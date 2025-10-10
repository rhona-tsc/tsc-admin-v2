import React from 'react';

const LineupsLineupSize = ({ lineupItem, lineupIndex, setLineups }) => {
  const updateLineup = (field, value) => {
    setLineups((prev) =>
      prev.map((item, i) =>
        i === lineupIndex ? { ...item, [field]: value } : item
      )
    );
  };

  return (
    <div className="w-full">
      <h2 className="text-xl mb-2">
        {lineupItem.actSize ? `${lineupItem.actSize}` : "Select your lineup"}
      </h2>

      <label>Lineup Size</label>
      <select
  className={`w-full px-2 py-2 border text-sm ${
    lineupItem.actSize ? "text-gray-900" : "text-gray-400"
  }`}
  value={lineupItem.actSize || ""}
  onChange={(e) => updateLineup("actSize", e.target.value)}
>
  <option value="" disabled hidden>
    Select Lineup Size
  </option>
  {[
    "Solo",
    "Duo",
    "3-Piece",
    "4-Piece",
    "5-Piece",
    "6-Piece",
    "7-Piece",
    "8-Piece",
    "9-Piece",
    "10-Piece +",
  ].map((size) => (
    <option key={size} value={size}>
      {size}
    </option>
  ))}
</select>
    </div>
  );
};

export default LineupsLineupSize;