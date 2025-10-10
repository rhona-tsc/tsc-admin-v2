import React, { useState } from 'react';

const Genre = ({ genre, setGenre }) => {
  const [customGenre, setCustomGenre] = useState('');
  const [genreOptions, setGenreOptions] = useState([
    "Soul & Motown",
    "Funk & Disco",
    "Indie & Rock",
    "Alternative & Punk",
    "Pop & Classic Pop",
    "Dance & Electronic",
    "Reggae & Afrobeat",
    "RnB, HipHop & Garage",
    "80s",
    "90s",
    "00s",
    "Latin",
    "Folk & Acoustic",
    "Roaming",
    "Jazz & Swing",
    "Classical",
    "Israeli",
    "Other"
  ]);

  const toggleGenre = (value) => {
    if (value === "Other") {
      if (genre.includes("Other")) {
        setGenre(genre.filter((item) => item !== "Other")); // Uncheck "Other"
      } else if (genre.length < 3) {
        setGenre([...genre, "Other"]); // Check "Other" to show input
      } else {
        alert("You may select up to 3 genre categories max.");
      }
      return;
    }

    if (genre.includes(value)) {
      setGenre(genre.filter((item) => item !== value));
    } else if (genre.length < 3) {
      setGenre([...genre, value]);
    } else {
      alert("You may select up to 3 genre categories max.");
    }
  };

  const handleAddCustomGenre = () => {
    if (!customGenre.trim()) return;
    if (genreOptions.includes(customGenre)) {
      alert("This genre already exists.");
      return;
    }

    // Replace "Other" with the custom genre in selected genres
    setGenre(genre.map((g) => (g === "Other" ? customGenre : g)));
    setGenreOptions([...genreOptions, customGenre]);
    setCustomGenre('');
  };

  return (
    <div className="w-full">
      <p className="mb-2">
        <strong>Genres</strong> (you may select up to 3)
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        {genreOptions.map((option) => (
          <label key={option} className="flex gap-2 items-center">
            <input
              type="checkbox"
              className="w-4 h-4"
              value={option}
              checked={genre.includes(option)}
              onChange={() => toggleGenre(option)}
              disabled={!genre.includes(option) && genre.length >= 3}
            />
            {option}
          </label>
        ))}
      </div>

      {/* Show input field if "Other" is selected */}
      {genre.includes("Other") && (
  <div className="grid grid-cols-12 gap-2 mt-3">
    <input
      type="text"
      className="border px-3 py-2 col-span-3"
      placeholder="Enter your genre"
      value={customGenre}
      onChange={(e) => setCustomGenre(e.target.value)}
    />
    <button
    type="button"
      onClick={handleAddCustomGenre}
      className="bg-black hover:bg-[#ff6667] text-white px-3 py-2 rounded"
    >
      Add
    </button>
  </div>
)}
    </div>
  );
};

export default Genre;