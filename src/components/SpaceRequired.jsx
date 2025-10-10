import React from 'react';

const SpaceRequired = ({ lineup, index, setLineups }) => {
  const updateLineup = (field, value) => {
    setLineups(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  return (
    <div >
      <label>Space Required</label>
      <input
      type="text"
      value={lineup.spaceRequired || ""}
      onChange={(e) => updateLineup("spaceRequired", e.target.value)}
      className="w-full px-2 py-2 border text-sm"
      placeholder="e.g. 3x4m or 18x12ft"
    />
    </div>
  );
};

export default SpaceRequired;