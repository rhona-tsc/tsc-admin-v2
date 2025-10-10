import React from "react";

const AddAnotherLineup = ({ lineups, setLineups, setOpenLineups }) => {
  const addNewLineup = () => {
    const newLineup = {
      actSize: "",
      spaceRequired: "",
      electricityReqs: "",
      soundLimitations: "",
      setupAndSoundCheck: "",
      bandMembers: [],
    };
    setLineups((prev) => [...prev, newLineup]);
    setOpenLineups((prev) => [...prev, true]);
  };

  const duplicateLineup = () => {
    const last = lineups[lineups.length - 1];
    const duplicated = {
      ...JSON.parse(JSON.stringify(last)), // deep clone
      actSize: `Copy of ${last.actSize || `Lineup ${lineups.length}`}`,
    };
    setLineups((prev) => [...prev, duplicated]);
    setOpenLineups((prev) => [...prev, true]);
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
      {lineups.length > 0 && (
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