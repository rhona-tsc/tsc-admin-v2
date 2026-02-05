import React from "react";
import { v4 as uuidv4 } from "uuid";

const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

// remove mongo subdoc ids at any depth
const stripMongoIds = (value) => {
  if (Array.isArray(value)) return value.map(stripMongoIds);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === "_id") continue; // ✅ critical
      out[k] = stripMongoIds(v);
    }
    return out;
  }
  return value;
};

const AddAnotherLineup = ({ lineups = [], setLineups, setOpenLineups }) => {
  const addNewLineup = () => {
    const newLineup = {
      lineupId: uuidv4(), // ✅ give new ones an id too
      actSize: "",
      spaceRequired: "",
      electricityReqs: "",
      soundLimitations: "",
      setupAndSoundCheck: "",
      bandMembers: [],
    };

    setLineups((prev) => [...(prev || []), newLineup]);
    setOpenLineups((prev) => [...(prev || []), true]);
  };

  const duplicateLineup = () => {
    if (!Array.isArray(lineups) || lineups.length === 0) return;

    const last = lineups[lineups.length - 1];

    // deep clone + strip all nested _id values
    const duplicated = stripMongoIds(deepClone(last));

    // ✅ regenerate your custom id
    duplicated.lineupId = uuidv4();

    // keep your label tweak
    duplicated.actSize = `Copy of ${last.actSize || `Lineup ${lineups.length}`}`;

    setLineups((prev) => [...(prev || []), duplicated]);
    setOpenLineups((prev) => [...(prev || []), true]);
  };

  return (
    <div className="flex gap-4 mt-4">
      <button
        type="button"
        onClick={addNewLineup}
        className="px-4 py-2 bg-black text-white rounded hover:bg-[#ff6667] transition"
      >
        + Add An New/Empty Lineup
      </button>

      {Array.isArray(lineups) && lineups.length > 0 && (
        <button
          type="button"
          onClick={duplicateLineup}
          className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300 transition"
        >
          + Duplicate Last Lineup
        </button>
      )}
    </div>
  );
};

export default AddAnotherLineup;