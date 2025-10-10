import React from "react";

const GenresSelector = ({ selectedGenres = [], onChange = () => {} }) => {
  const genresList = [
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
    "Other",
  ];

  const handleToggle = (genre) => {
    const set = new Set(selectedGenres);
    if (set.has(genre)) {
      set.delete(genre);
    } else {
      set.add(genre);
    }
    onChange(Array.from(set));
  };

  return (
    <div className="mt-4">
      <label className="block font-medium mb-1">
        Which genres best suit your voice?
      </label>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {genresList.map((genre) => (
          <label key={genre} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selectedGenres.includes(genre)}
              onChange={() => handleToggle(genre)}
            />
            {genre}
          </label>
        ))}
      </div>
    </div>
  );
};

export default GenresSelector;