import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import songsData from "../assets/songsData";

const genreMap = {
  "Funk & Disco": ["Funk", "Disco", "Jazz Funk", "Jazz Fusion", "Fusion"],
  "RnB, HipHop & Garage": [
    "Hip-Hop",
    "R&B",
    "Rap",
    "UK Garage",
    "Garage Rock",
    "Proto-Punk",
  ],
  "Alternative & Punk": [
    "Alternative",
    "Alternative Rock",
    "Alternative Metal",
    "Nu Metal",
    "Punk",
    "Punk Rock",
    "Post-Punk",
    "Proto-Punk",
  ],
  "Indie & Rock": [
    "Indie",
    "Indie Rock",
    "Indie Folk",
    "Indie Pop",
    "Pop Rock",
    "Soft Rock",
    "Rock",
    "Southern Rock",
    "Surf Rock",
    "Glam Rock",
    "Garage Rock",
    "Hard Rock",
    "Jazz Rock",
    "Latin Rock",
  ],
  "Dance & Electronic": [
    "Dance",
    "Dance Pop",
    "Dance-Pop",
    "Electronic",
    "Electropop",
    "EDM",
    "Eurodance",
    "House",
    "Drum and Bass",
    "Trip-Hop",
    "Synthpop",
    "Tropical House",
    "Electronic Dance Music",
  ],
  "Reggae & Afrobeat": [
    "Afrobeat",
    "Afrobeats",
    "Reggae",
    "Reggaeton",
    "Reggae Fusion",
    "Dancehall",
  ],
  "Soul & Motown": ["Soul", "Motown", "Bossa Nova"],
  "Pop & Classic Pop": [
    "Pop",
    "Pop Rock",
    "Pop Ballad",
    "Pop Punk",
    "Comedy",
    "Showtunes",
    "Musical",
    "Disney",
  ],
  "Jazz & Swing": ["Jazz", "Swing", "Jazz Fusion", "Jazz Rock"],
  "Folk & Acoustic": [
    "Folk",
    "Folk Rock",
    "Country",
    "Country Pop",
    "Country Rock",
    "Bluegrass",
    "Ska",
    "Acoustic",
  ],
  Latin: ["Latin", "Latin Pop", "Latin Rock", "Salsa"],
  Classical: ["Classical", "Instrumental"],
  Other: [],
};

const normalizeGenreString = (g = "") =>
  String(g || "")
    .replace(/\u00A0/g, " ") // nbsp
    .trim();

const splitGenres = (genreValue) => {
  // Accept string, array, null, etc.
  if (Array.isArray(genreValue)) {
    return genreValue
      .flatMap((v) => splitGenres(v))
      .map(normalizeGenreString)
      .filter(Boolean);
  }

  const raw = normalizeGenreString(genreValue);
  if (!raw) return [];

  // Split on common separators: /, comma, pipe, semicolon, ampersand
  // (keeps things like "R&B" intact)
  return raw
    .split(/\s*\/\s*|\s*,\s*|\s*\|\s*|\s*;\s*|\s*&\s*/g)
    .map(normalizeGenreString)
    .filter(Boolean);
};

const categorizeGenre = (genre) => {
  const g = normalizeGenreString(genre).toLowerCase();
  for (const [category, values] of Object.entries(genreMap)) {
    if (values.some((v) => v.toLowerCase() === g)) return category;
  }
  return "Other";
};

export const enrichAndSetSongsFromRepertoire = async (
  customRepertoire,
  setSelectedSongs
) => {
  const parsed = parseCustomRepertoire(customRepertoire);

  const enriched = await Promise.all(
    parsed.map(async (song) => {
      const title = String(song?.title || "").trim();
      const artist = String(song?.artist || "").trim();

      if (!title || !artist) return song;

      const existing = songsData.find(
        (s) =>
          String(s.title || "").toLowerCase() === title.toLowerCase() &&
          String(s.artist || "").toLowerCase() === artist.toLowerCase()
      );

      if (existing) return existing;

      try {
        const res = await axios.post("/api/ai/lookup-song", {
          title,
          artist,
          genre: song.genre,
        });

        const enrichedSong = res?.data?.song;
        if (enrichedSong) return enrichedSong;

        // If no AI enrichment, POST to moderation queue
        await axios.post("/api/moderation/pending-song", {
          title,
          artist,
          genre: song.genre,
          year: song.year,
        });

        return { ...song, note: "Pending moderation" };
      } catch (err) {
        console.error("Song enrichment + moderation failed:", song, err);
        return song;
      }
    })
  );

  setSelectedSongs(enriched);
};

const parseCustomRepertoire = (text) => {
  const lines = String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let currentGenre = "";
  const parsedSongs = [];

  // supports:
  // 2020 - Title - Artist
  // Title - Artist
  // Title – Artist (en-dash)
  // Title — Artist (em-dash)
  // 2020 Title – Artist
  const songLineRegex =
    /^(?:(\d{4})\s*)?(?:-?\s*)?(.+?)\s*[-–—]\s*(.+)$/;

  lines.forEach((line) => {
    // Genre headers (keep your existing behaviour)
    if (
      /^[A-Z][a-zA-Z\s\/&+]+$/.test(line) &&
      !line.includes("-") &&
      line.length < 60
    ) {
      currentGenre = line;
      return;
    }

    const match = line.match(songLineRegex);
    if (!match) return;

    const year = match[1] ? parseInt(match[1], 10) : null;
    const title = match[2].trim();
    const artist = match[3].trim();

    parsedSongs.push({
      title,
      artist,
      genre: currentGenre || "Other",
      year,
    });
  });

  return parsedSongs;
};

const Repertoire = ({
  customRepertoire,
  setCustomRepertoire,
  selectedSongs,
  setSelectedSongs,
}) => {
  const [filter, setFilter] = useState({
    decade: "",
    genre: "",
    artist: "",
    search: "",
  });

  const [filteredSongs, setFilteredSongs] = useState([]);
  const [recentlyAddedKey, setRecentlyAddedKey] = useState(null);
  const selectedSongsContainerRef = useRef(null);
  const highlightTimeoutRef = useRef(null);

  const genreCategories = Object.keys(genreMap).filter((cat) => cat !== "Other");

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let result = [...songsData];

    // ✅ decade filter (fixes the ≤1969 bug)
    if (filter.decade) {
      if (filter.decade === "le1969") {
        result = result.filter((song) => Number(song?.year) <= 1969);
      } else {
        const start = Number(filter.decade); // e.g. 1970
        const end = start + 9;
        result = result.filter((song) => {
          const y = Number(song?.year);
          return Number.isFinite(y) && y >= start && y <= end;
        });
      }
    }

    if (filter.genre) {
      result = result.filter((song) => {
        const parts = splitGenres(song?.genre);
        const categories = parts.map((g) => categorizeGenre(g));
        return categories.includes(filter.genre);
      });
    }

    if (filter.artist) {
      const q = filter.artist.toLowerCase();
      result = result.filter((song) =>
        String(song?.artist || "").toLowerCase().includes(q)
      );
    }

    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter((song) => {
        const title = String(song?.title || "").toLowerCase();
        const artist = String(song?.artist || "").toLowerCase();
        return title.includes(q) || artist.includes(q);
      });
    }

    setFilteredSongs(result);
  }, [filter]);

  const addSong = (song) => {
    const alreadySelected = selectedSongs.some(
      (s) =>
        String(s.title) === String(song.title) &&
        String(s.artist) === String(song.artist)
    );

    if (alreadySelected) return;

    const songKey = `${song.title}-${song.artist}`;

    setSelectedSongs((prev) => [song, ...prev]);
    setRecentlyAddedKey(songKey);

    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }

    highlightTimeoutRef.current = setTimeout(() => {
      setRecentlyAddedKey(null);
    }, 1800);

    requestAnimationFrame(() => {
      if (selectedSongsContainerRef.current) {
        selectedSongsContainerRef.current.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    });
  };

  const removeSong = (index) => {
    const updated = [...selectedSongs];
    updated.splice(index, 1);
    setSelectedSongs(updated);
  };

  return (
    <div className="my-6">
      <h2 className="text-m font-semibold mb-2">Repertoire</h2>
      <p>
        We recommend at least 100 songs for clients to make suggestions from.
        These songs should be 'gig ready' and require no rehearsals.
      </p>

      <textarea
        className="w-full p-3 border rounded h-40 resize-y"
        placeholder="Paste your repertoire here"
        value={customRepertoire}
        onChange={(e) => setCustomRepertoire(e.target.value)}
      />

      <h2 className="text-m font-semibold mt-6 mb-2">Repertoire (continued)</h2>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <select
          className="border px-2 py-1 rounded"
          value={filter.decade}
          onChange={(e) => setFilter({ ...filter, decade: e.target.value })}
        >
          <option value="">All Decades</option>
          <option value="le1969">≤ 1969</option>
          <option value="1970">1970s</option>
          <option value="1980">1980s</option>
          <option value="1990">1990s</option>
          <option value="2000">2000s</option>
          <option value="2010">2010s</option>
          <option value="2020">2020s</option>
        </select>

        <select
          className="border px-2 py-1 rounded"
          value={filter.genre}
          onChange={(e) => setFilter({ ...filter, genre: e.target.value })}
        >
          <option value="">All Genres</option>
          {genreCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
          <option value="Other">Other</option>
        </select>

        <input
          type="text"
          placeholder="Artist"
          className="border px-2 py-1 rounded"
          value={filter.artist}
          onChange={(e) => setFilter({ ...filter, artist: e.target.value })}
        />

        <input
          type="text"
          placeholder="Search title"
          className="border px-2 py-1 rounded"
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
        />
      </div>

      <div className="max-h-60 overflow-y-scroll border rounded p-3 bg-white">
        {filteredSongs.length === 0 ? (
          <p className="text-gray-500 italic">No songs match those filters</p>
        ) : (
          filteredSongs.slice(0, 100).map((song, idx) => (
            <div
              key={`${song.title}-${song.artist}-${idx}`}
              className="flex justify-between items-center border-b py-1"
            >
              <span>
                {song.title} – {song.artist}
              </span>
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                onClick={() => addSong(song)}
              >
                Add
              </button>
            </div>
          ))
        )}
      </div>

      <h3 className="text-m font-semibold mt-4 mb-2">Selected Songs</h3>

      {selectedSongs.length === 0 ? (
        <p className="text-gray-500 italic">No songs selected</p>
      ) : (
        <div
          ref={selectedSongsContainerRef}
          className="max-h-[500px] overflow-y-auto border rounded p-3 bg-white scroll-smooth"
        >
          <ul>
            {selectedSongs.map((song, index) => (
              <li
                key={`${song.title}-${song.artist}-${index}`}
                className={`flex justify-between items-center border p-2 rounded transition-all duration-500 ${
                  recentlyAddedKey === `${song.title}-${song.artist}`
                    ? "bg-green-50 border-green-400 shadow-md scale-[1.01]"
                    : "bg-white"
                }`}
              >
                <span>
                  {song.title} – {song.artist}
                  {recentlyAddedKey === `${song.title}-${song.artist}` && (
                    <span className="ml-2 text-xs font-medium text-green-600">
                      Added
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => removeSong(index)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Repertoire;
export { parseCustomRepertoire, categorizeGenre, genreMap, splitGenres };