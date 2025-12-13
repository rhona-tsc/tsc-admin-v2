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
    "Other", // UI only
  ];

  const standardSet = new Set(genresList.filter((g) => g !== "Other"));

  const standardGenres = (selectedGenres || [])
    .map((g) => String(g || "").trim())
    .filter(Boolean)
    .filter((g) => standardSet.has(g));

  const customGenres = (selectedGenres || [])
    .map((g) => String(g || "").trim())
    .filter(Boolean)
    .filter((g) => !standardSet.has(g) && g !== "Other");

  const isOtherChecked = customGenres.length > 0;

  const commit = (nextStandard, nextCustom) => {
    const cleanedCustom = (nextCustom || [])
      .map((s) => String(s || "").trim())
      .filter(Boolean);

    // de-dupe (case-insensitive) but keep original casing of first occurrence
    const seen = new Set();
    const deduped = [];
    for (const s of [...nextStandard, ...cleanedCustom]) {
      const key = s.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(s);
    }

    onChange(deduped); // ✅ only plain strings
  };

  const handleToggle = (genre) => {
    if (genre === "Other") {
      // Unchecking "Other" = clear all custom genres
      if (isOtherChecked) commit(standardGenres, []);
      else commit(standardGenres, [""]); // checking: start with one empty input
      return;
    }

    const set = new Set(standardGenres);
    set.has(genre) ? set.delete(genre) : set.add(genre);
    commit(Array.from(set), customGenres);
  };

  const addOtherInput = () => commit(standardGenres, [...customGenres, ""]);
  const removeOtherInput = (idx) =>
    commit(standardGenres, customGenres.filter((_, i) => i !== idx));

  const updateOtherAt = (idx, value) => {
    const next = [...customGenres];
    next[idx] = value;
    commit(standardGenres, next);
  };

  // Show at least 1 input when Other is checked, even if empty
  const otherInputs =
    isOtherChecked ? customGenres : selectedGenres.includes("Other") ? [""] : [];

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
              checked={genre === "Other" ? otherInputs.length > 0 : standardGenres.includes(genre)}
              onChange={() => handleToggle(genre)}
            />
            {genre}
          </label>
        ))}
      </div>

      {otherInputs.length > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          {otherInputs.map((val, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                type="text"
                className="border border-gray-300 rounded py-1.5 px-3.5 w-full text-sm"
                placeholder="e.g. Yodelling"
                value={val}
                onChange={(e) => updateOtherAt(idx, e.target.value)}
              />
              <button
                type="button"
                className="text-red-600 text-sm"
                onClick={() => removeOtherInput(idx)}
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            className="text-blue-600 text-sm underline self-start"
            onClick={addOtherInput}
          >
            + Add more
          </button>
        </div>
      )}
    </div>
  );
};

export default GenresSelector;