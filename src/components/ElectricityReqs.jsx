import React from 'react';

const ElectricityReqs = ({ lineup, index, setLineups }) => {
  const updateLineup = (field, value) => {
    setLineups((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  return (
    <div>
      <label>Electricity Requirements</label>
      <input
        type="text"
        placeholder="e.g., 4 x 13amp sockets"
        className="w-full px-3 py-2 border"
        value={lineup.electricityRequirements || ""}
        onChange={(e) =>
          updateLineup("electricityRequirements", e.target.value)
        }
        autoComplete="off"
        spellCheck="false"
        autoCorrect="off"
        inputMode="text"
        name={`electricity-${index}`} 
      />
    </div>
  );
};

export default ElectricityReqs;