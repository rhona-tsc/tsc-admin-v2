import React, { useEffect, useMemo, useState } from "react";

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

  const standardSet = useMemo(
    () => new Set(genresList.filter((g) => g !== "Other")),
    []
  );

  const standardGenres = (selectedGenres || [])
    .map((g) => String(g || "").trim())
    .filter(Boolean)
    .filter((g) => standardSet.has(g));

  const customGenres = (selectedGenres || [])
    .map((g) => String(g || "").trim())
    .filter(Boolean)
    .filter((g) => !standardSet.has(g) && g !== "Other");

  const [otherOpen, setOtherOpen] = useState(false);

  // ✅ UI-only: how many "Other" inputs are shown (including empty ones)
  const [otherCount, setOtherCount] = useState(0);

  // open Other automatically if there are saved custom genres (editing mode)
  useEffect(() => {
    if (customGenres.length > 0) setOtherOpen(true);
  }, [customGenres.length]);

  // keep UI count in sync when opening/closing or when editing loads values
  useEffect(() => {
    if (!otherOpen) {
      setOtherCount(0);
      return;
    }
    // show at least 1 input when open; if editing with N customs, show N
    setOtherCount((prev) => Math.max(prev || 0, Math.max(customGenres.length, 1)));
  }, [otherOpen, customGenres.length]);

  const commit = (nextStandard, nextCustom) => {
    const cleanedCustom = (nextCustom || [])
      .map((s) => String(s || "").trim())
      .filter(Boolean);

    const seen = new Set();
    const deduped = [];
    for (const s of [...nextStandard, ...cleanedCustom]) {
      const key = s.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(s);
    }

    onChange(deduped);
  };

  const handleToggle = (genre) => {
    if (genre === "Other") {
      setOtherOpen((prev) => {
        const next = !prev;
        // if closing, clear custom genres and remove inputs
        if (!next) {
          commit(standardGenres, []);
          setOtherCount(0);
        } else {
          setOtherCount((c) => Math.max(c, 1));
        }
        return next;
      });
      return;
    }

    const set = new Set(standardGenres);
    set.has(genre) ? set.delete(genre) : set.add(genre);
    commit(Array.from(set), customGenres);
  };

  const addOtherInput = () => {
    setOtherOpen(true);
    setOtherCount((c) => (c || 0) + 1);
  };

  const removeOtherInput = (idx) => {
    // remove the persisted custom genre at this index (if it exists)
    const nextCustom = customGenres.filter((_, i) => i !== idx);
    commit(standardGenres, nextCustom);

    // remove the UI slot
    setOtherCount((c) => {
      const nextCount = Math.max((c || 0) - 1, 0);

      // ✅ if no inputs left (and no custom genres left), close Other + uncheck
      if (nextCount === 0 && nextCustom.length === 0) {
        setOtherOpen(false);
        commit(standardGenres, []);
        return 0;
      }

      return nextCount;
    });
  };

  const updateOtherAt = (idx, value) => {
    // Build an array of length otherCount using current customGenres + blanks
    const slots = Array.from({ length: otherCount }, (_, i) => customGenres[i] || "");
    slots[idx] = value;
    commit(standardGenres, slots);
  };

  const otherInputs = otherOpen
    ? Array.from({ length: otherCount }, (_, i) => customGenres[i] || "")
    : [];

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
              checked={genre === "Other" ? otherOpen : standardGenres.includes(genre)}
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