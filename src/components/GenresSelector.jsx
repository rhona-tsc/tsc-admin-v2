import React, { useEffect, useMemo, useState } from "react";

const GenresSelector = ({ selectedGenres = [], onChange = () => {} }) => {
  const debug = (...args) => console.log("🎛️[GenresSelector]", ...args);

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
    "Other"];

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

  // ✅ UI-only state: whether the Other section is open
  const [otherOpen, setOtherOpen] = useState(false);

  // open Other automatically if there are saved custom genres (editing mode)
  useEffect(() => {
    const shouldOpen = customGenres.length > 0;
    setOtherOpen((prev) => (prev ? true : shouldOpen));
  }, [customGenres.length]);

  const commit = (nextStandard, nextCustom) => {
    debug("commit() input", { nextStandard, nextCustom });

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

    debug("commit() output -> onChange", { cleanedCustom, deduped });
    onChange(deduped);
  };

  const handleToggle = (genre) => {
    debug("handleToggle()", { genre, otherOpen, selectedGenres, standardGenres, customGenres });

    if (genre === "Other") {
      // ✅ toggle UI open/closed
      setOtherOpen((prev) => {
        const next = !prev;
        debug("Other toggled", { from: prev, to: next });

        // if closing, clear custom genres from saved state
        if (!next) commit(standardGenres, []);
        return next;
      });
      return;
    }

    const set = new Set(standardGenres);
    set.has(genre) ? set.delete(genre) : set.add(genre);
    commit(Array.from(set), customGenres);
  };

  const addOtherInput = () => {
    debug("addOtherInput()", { customGenres });
    setOtherOpen(true);
    // we only store when user types; UI can show empty inputs without storing ""
  };

  const removeOtherInput = (idx) => {
    debug("removeOtherInput()", { idx, customGenres });
    const next = customGenres.filter((_, i) => i !== idx);
    commit(standardGenres, next);
  };

  const updateOtherAt = (idx, value) => {
    debug("updateOtherAt()", { idx, value });
    const next = [...customGenres];
    next[idx] = value;
    commit(standardGenres, next);
  };

  // ✅ show at least one input when Other is open
  const otherInputs = otherOpen ? (customGenres.length ? customGenres : [""]) : [];

  useEffect(() => {
    debug("derived state", {
      selectedGenres,
      standardGenres,
      customGenres,
      otherOpen,
      otherInputs,
    });
  }, [selectedGenres, otherOpen]);

  return (
    <div className="mt-4">
      <label className="block font-medium mb-1">Which genres best suit your voice?</label>

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