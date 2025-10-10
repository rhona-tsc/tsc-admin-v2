import React, { useState, useEffect } from 'react';
import axios from 'axios';
import songsData from '../assets/songsData';

 const genreMap = {
  "Funk & Disco": ["Funk", "Disco", "Jazz Funk", "Jazz Fusion", "Fusion"],
  "RnB, HipHop & Garage": ["Hip-Hop", "R&B", "Rap", "UK Garage", "Garage Rock", "Proto-Punk"],
  "Alternative & Punk": ["Alternative", "Alternative Rock", "Alternative Metal", "Nu Metal", "Punk", "Punk Rock", "Post-Punk", "Proto-Punk"],
  "Indie & Rock": ["Indie", "Indie Rock", "Indie Folk", "Indie Pop", "Pop Rock", "Soft Rock", "Rock", "Southern Rock", "Surf Rock", "Glam Rock", "Garage Rock", "Hard Rock", "Jazz Rock", "Latin Rock"],
  "Dance & Electronic": ["Dance", "Dance Pop", "Dance-Pop", "Electronic", "Electropop", "EDM", "Eurodance", "House", "Drum and Bass", "Trip-Hop", "Synthpop", "Tropical House", "Electronic Dance Music"],
  "Reggae & Afrobeat": ["Afrobeat", "Afrobeats", "Reggae", "Reggaeton", "Reggae Fusion", "Dancehall"],
  "Soul & Motown": ["Soul", "Motown", "Bossa Nova"],
  "Pop & Classic Pop": ["Pop", "Pop Rock", "Pop Ballad", "Pop Punk", "Comedy", "Showtunes", "Musical", "Disney"],
  "Jazz & Swing": ["Jazz", "Swing", "Jazz Fusion", "Jazz Rock"],
  "Folk & Acoustic": ["Folk", "Folk Rock", "Country", "Country Pop", "Country Rock", "Bluegrass", "Ska", "Acoustic"],
  "Latin": ["Latin", "Latin Pop", "Latin Rock", "Salsa"],
  "Classical": ["Classical", "Instrumental"],
  "Other": []
};

 const categorizeGenre = (genre) => {
  genre = genre.trim().toLowerCase();
  for (const [category, values] of Object.entries(genreMap)) {
    if (values.some(g => g.toLowerCase() === genre)) return category;
  }
  return "Other";
};

export const enrichAndSetSongsFromRepertoire = async (customRepertoire, setSelectedSongs) => {
  const parsed = parseCustomRepertoire(customRepertoire);

  const enriched = await Promise.all(parsed.map(async (song) => {
    const existing = songsData.find(
      (s) =>
        s.title.toLowerCase() === song.title.toLowerCase() &&
        s.artist.toLowerCase() === song.artist.toLowerCase()
    );

    if (existing) return existing;

    try {
      const res = await axios.post('/api/ai/lookup-song', {
        title: song.title,
        artist: song.artist,
        genre: song.genre,
      });

      const enrichedSong = res.data.song;
      if (enrichedSong) return enrichedSong;

      // If no AI enrichment, POST to moderation queue
      await axios.post('/api/moderation/pending-song', {
        title: song.title,
        artist: song.artist,
        genre: song.genre,
        year: song.year,
      });

      return {
        ...song,
        note: "Pending moderation",
      };
    } catch (err) {
      console.error("Song enrichment + moderation failed:", song, err);
      return song;
    }
  }));

  setSelectedSongs(enriched);
};

const parseCustomRepertoire = (text) => {
  const lines = text.split("\n").map(line => line.trim()).filter(Boolean);
  let currentGenre = '';
  const parsedSongs = [];

  lines.forEach((line) => {
    if (/^[A-Z][a-zA-Z\s\/&+]+$/.test(line) && !line.includes("-") && line.length < 40) {
      currentGenre = line;
    } else {
      const match = line.match(/^(\d{4})?\s?-?\s?(.*?)\s*-\s*(.+)$/);
      if (match) {
        const year = match[1] ? parseInt(match[1]) : null;
        const title = match[2].trim();
        const artist = match[3].trim();

        parsedSongs.push({ title, artist, genre: currentGenre || "Other", year });
      }
    }
  });

  return parsedSongs;
};

const Repertoire = ({ customRepertoire, setCustomRepertoire, selectedSongs, setSelectedSongs }) => {
  const [filter, setFilter] = useState({ decade: '', genre: '', artist: '', search: '' });
  const [filteredSongs, setFilteredSongs] = useState([]);

  const categorizedGenres = {};

  songsData.forEach(song => {
    song.genre.split("/").forEach(g => {
      const category = categorizeGenre(g.trim());
      if (!categorizedGenres[category]) categorizedGenres[category] = new Set();
      categorizedGenres[category].add(g.trim());
    });
  });

  const genreCategories = Object.keys(genreMap).filter(cat => cat !== "Other");

  useEffect(() => {
    let result = [...songsData];

    if (filter.decade) result = result.filter(song => String(song.year).startsWith(filter.decade));
    if (filter.genre) {
      result = result.filter(song =>
        song.genre
          .split("/")
          .map(g => categorizeGenre(g.trim()))
          .includes(filter.genre)
      );
    }
    if (filter.artist) result = result.filter(song => song.artist.toLowerCase().includes(filter.artist.toLowerCase()));
    if (filter.search) result = result.filter(song =>
      song.title.toLowerCase().includes(filter.search.toLowerCase()) ||
      song.artist.toLowerCase().includes(filter.search.toLowerCase())
    );

    setFilteredSongs(result);
  }, [filter]);

  const addSong = (song) => {
    if (!selectedSongs.some(s => s.title === song.title && s.artist === song.artist)) {
      setSelectedSongs([...selectedSongs, song]);
    }
  };

  const removeSong = (index) => {
    const updated = [...selectedSongs];
    updated.splice(index, 1);
    setSelectedSongs(updated);
  };

  return (
    <div className="my-6">
      <h2 className="text-m font-semibold mb-2">Repertoire</h2>
      <p>We recommend at least 100 songs for clients to make suggestions from. These songs should be 'gig ready' and require no rehearsals.</p>
      <textarea
        className="w-full p-3 border rounded h-40 resize-y"
        placeholder="Paste your repertoire here"
        value={customRepertoire}
        onChange={(e) => setCustomRepertoire(e.target.value)}
      />

      <h2 className="text-m font-semibold mt-6 mb-2">Repertoire (continued)</h2>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <select className="border px-2 py-1 rounded" value={filter.decade} onChange={(e) => setFilter({ ...filter, decade: e.target.value })}>
          <option value="">All Decades</option>
          <option value="195">≤ 1969</option>
          <option value="197">1970s</option>
          <option value="198">1980s</option>
          <option value="199">1990s</option>
          <option value="200">2000s</option>
          <option value="201">2010s</option>
          <option value="202">2020s</option>
        </select>
        <select className="border px-2 py-1 rounded" value={filter.genre} onChange={(e) => setFilter({ ...filter, genre: e.target.value })}>
          <option value="">All Genres</option>
          {genreCategories.map((category, index) => (
            <option key={index} value={category}>{category}</option>
          ))}
          <option value="Other">Other</option>
        </select>
        <input type="text" placeholder="Artist" className="border px-2 py-1 rounded" value={filter.artist} onChange={(e) => setFilter({ ...filter, artist: e.target.value })} />
        <input type="text" placeholder="Search title" className="border px-2 py-1 rounded" value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })} />
      </div>

      <div className="max-h-60 overflow-y-scroll border rounded p-3 bg-white">
        {filteredSongs.slice(0, 100).map((song, idx) => (
          <div key={`${song.title}-${song.artist}-${idx}`} className="flex justify-between items-center border-b py-1">
            <span>{song.title} – {song.artist}</span>
            <button type="button" className="text-sm text-blue-600 hover:underline" onClick={() => addSong(song)}>Add</button>
          </div>
        ))}
      </div>

      <h3 className="text-m font-semibold mt-4 mb-2">Selected Songs</h3>
      {selectedSongs.length === 0 ? (
        <p className="text-gray-500 italic">No songs selected</p>
      ) : (
        <div className="max-h-[500px] overflow-y-auto border rounded p-3 bg-white">
          <ul>
            {selectedSongs.map((song, index) => (
              <li key={index} className="flex justify-between items-center border p-2 rounded">
                <span>{song.title} – {song.artist}</span>
                <button type="button" onClick={() => removeSong(index)} className="text-xs text-red-500 hover:underline">Remove</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export { Repertoire as default, parseCustomRepertoire, categorizeGenre, genreMap };