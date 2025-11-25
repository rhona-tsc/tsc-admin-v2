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

  // 🔍 Extract saved Other text if it exists
  const savedOtherText = selectedGenres.find((g) => g.startsWith("Other:"));
  const otherValue = savedOtherText ? savedOtherText.replace("Other:", "") : "";

  const handleToggle = (genre) => {
    const set = new Set(selectedGenres);

    if (set.has(genre)) {
      set.delete(genre);
    } else {
      set.add(genre);
    }

    // ❗ If user unchecks "Other", remove all "Other:*" values
    if (genre === "Other" && set.has("Other") === false) {
      const cleaned = [...set].filter((g) => !g.startsWith("Other:"));
      return onChange(cleaned);
    }

    onChange([...set]);
  };

  const updateOther = (value) => {
    const cleaned = selectedGenres.filter((g) => !g.startsWith("Other:"));
    onChange([...cleaned, "Other", `Other:${value}`]);
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

      {selectedGenres.includes("Other") && (
        <input
          type="text"
          value={otherValue}   // ← IMPORTANT: Persist saved value
          className="mt-2 border border-gray-300 rounded py-1.5 px-3.5 w-full text-sm"
          placeholder="Please specify other genres"
          onChange={(e) => updateOther(e.target.value)}
        />
      )}
    </div>
  );
};

export default GenresSelector;