import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import songsData from "../assets/songsData";

export const genreMap = {
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

// ✅ SAFE + exported (no .trim crash)
export const categorizeGenre = (genre) => {
  const g0 = String(genre || "").trim().toLowerCase();
  if (!g0) return "Other";

  for (const [category, values] of Object.entries(genreMap)) {
    if (values.some((g) => String(g).toLowerCase() === g0)) return category;
  }
  return "Other";
};

// ✅ Helper: safely split a song's "genre" string like "Pop / Soul"
export const splitGenres = (song) =>
  String(song?.genre || "")
    .split("/")
    .map((g) => g.trim())
    .filter(Boolean);

export const parseCustomRepertoire = (text) => {
  const lines = String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let currentGenre = "";
  const parsedSongs = [];

  lines.forEach((line) => {
    // Genre headings (simple heuristic)
    if (
      /^[A-Z][a-zA-Z\s\/&+]+$/.test(line) &&
      !line.includes("-") &&
      line.length < 40
    ) {
      currentGenre = line;
      return;
    }

    // Optional year + "Title - Artist"
    const match = line.match(/^(\d{4})?\s?-?\s?(.*?)\s*-\s*(.+)$/);
    if (!match) return;

    const year = match[1] ? parseInt(match[1], 10) : null;
    const title = String(match[2] || "").trim();
    const artist = String(match[3] || "").trim();

    if (!title || !artist) return;

    parsedSongs.push({
      title,
      artist,
      genre: currentGenre || "Other",
      year,
    });
  });

  return parsedSongs;
};

export const enrichAndSetSongsFromRepertoire = async (
  customRepertoire,
  setSelectedSongs,
  authHeaders = {},
  backendUrl = ""
) => {
  const parsed = parseCustomRepertoire(customRepertoire);

  const enriched = await Promise.all(
    parsed.map(async (song) => {
      const existing = songsData.find(
        (s) =>
          String(s?.title || "").toLowerCase() ===
            String(song?.title || "").toLowerCase() &&
          String(s?.artist || "").toLowerCase() ===
            String(song?.artist || "").toLowerCase()
      );

      if (existing) return existing;

      try {
       const res = await axios.post(
  `${backendUrl}/api/ai/lookup-song`,
  {
    title: song.title,
    artist: song.artist,
    genre: song.genre,
  },
  {
    headers: authHeaders,
    withCredentials: true,
  },
);

        const enrichedSong = res?.data?.song;
        if (enrichedSong) return enrichedSong;

        // If no AI enrichment, POST to moderation queue
        await axios.post(
  `${backendUrl}/api/moderation/pending-song`,
  {
    title: song.title,
    artist: song.artist,
    genre: song.genre,
    year: song.year,
  },
  {
    headers: authHeaders,
    withCredentials: true,
  },
);

        return { ...song, note: "Pending moderation" };
      } catch (err) {
        console.error("Song enrichment + moderation failed:", song, err);
        return song;
      }
    })
  );

  setSelectedSongs(enriched);
};

const DeputyRepertoire = ({
  customRepertoire,
  setCustomRepertoire,
  selectedSongs,
  setSelectedSongs,
  authHeaders = {},
}) => {
  const [filter, setFilter] = useState({
    decade: "",
    genre: "",
    artist: "",
    search: "",
  });
  const [filteredSongs, setFilteredSongs] = useState([]);

  // ✅ Memoized: not rebuilt on every render
  const categorizedGenres = useMemo(() => {
    const out = {};
    (songsData || []).forEach((song) => {
      splitGenres(song).forEach((g) => {
        const category = categorizeGenre(g);
        if (!out[category]) out[category] = new Set();
        out[category].add(g);
      });
    });
    return out;
  }, []);

  // (kept for your dropdown; leaving categorizedGenres computed in case you use it later)
  const genreCategories = useMemo(
    () => Object.keys(genreMap).filter((cat) => cat !== "Other"),
    []
  );

  useEffect(() => {
    let result = [...(songsData || [])];

    if (filter.decade) {
      result = result.filter((song) =>
        String(song?.year ?? "").startsWith(filter.decade)
      );
    }

    if (filter.genre) {
      result = result.filter((song) =>
        splitGenres(song).map(categorizeGenre).includes(filter.genre)
      );
    }

    if (filter.artist) {
      const a = String(filter.artist || "").toLowerCase();
      result = result.filter((song) =>
        String(song?.artist || "").toLowerCase().includes(a)
      );
    }

    if (filter.search) {
      const q = String(filter.search || "").toLowerCase();
      result = result.filter((song) => {
        const t = String(song?.title || "").toLowerCase();
        const a = String(song?.artist || "").toLowerCase();
        return t.includes(q) || a.includes(q);
      });
    }

    setFilteredSongs(result);
  }, [filter]);

  return (
    <div className="flex flex-row gap-6">
      <div className="w-1/2 pr-4">
        <textarea
          className="w-full p-3 border rounded h-80 resize-y text-sm"
          placeholder="Paste your repertoire here or select songs from the list on the right."
          value={customRepertoire}
          onChange={(e) => setCustomRepertoire(e.target.value)}
        />
      </div>

      <div className="w-1/2">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <select
            className="border px-2 py-1 rounded"
            value={filter.decade}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, decade: e.target.value }))
            }
          >
            <option value="">All Decades</option>
            <option value="195">≤ 1969</option>
            <option value="197">1970s</option>
            <option value="198">1980s</option>
            <option value="199">1990s</option>
            <option value="200">2000s</option>
            <option value="201">2010s</option>
            <option value="202">2020s</option>
          </select>

          <select
            className="border px-2 py-1 rounded"
            value={filter.genre}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, genre: e.target.value }))
            }
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
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, artist: e.target.value }))
            }
          />

          <input
            type="text"
            placeholder="Search title"
            className="border px-2 py-1 rounded"
            value={filter.search}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, search: e.target.value }))
            }
          />
        </div>

        <div className="max-h-60 overflow-y-scroll border rounded p-3 bg-white">
          {filteredSongs.slice(0, 100).map((song, idx) => {
            const key = `${song?._id || ""}-${song?.title || ""}-${song?.artist || ""}-${idx}`;
            const title = String(song?.title || "");
            const artist = String(song?.artist || "");
            const checked = (selectedSongs || []).some(
              (s) =>
                String(s?.title || "") === title &&
                String(s?.artist || "") === artist
            );

            return (
              <div
                key={key}
                className="flex justify-between items-center border-b py-1"
              >
                <label className="flex items-center gap-2 w-full">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const exists = (selectedSongs || []).some(
                        (s) =>
                          String(s?.title || "") === title &&
                          String(s?.artist || "") === artist
                      );

                      const updated = exists
                        ? (selectedSongs || []).filter(
                            (s) =>
                              !(
                                String(s?.title || "") === title &&
                                String(s?.artist || "") === artist
                              )
                          )
                        : [...(selectedSongs || []), song];

                      setSelectedSongs(updated);
                    }}
                  />
                  <span className="text-sm">
                    {title} – {artist}
                  </span>
                </label>
              </div>
            );
          })}
        </div>

        {/* Selected Songs section removed */}
      </div>
    </div>
  );
};

export default DeputyRepertoire;

// Note: categorizedGenres is memoized above so it won't rebuild every render.
// If you want to use it later (e.g., show sub-genre chips), it's ready:
// console.log(Object.fromEntries(Object.entries(categorizedGenres).map(([k,v]) => [k, [...v]])));