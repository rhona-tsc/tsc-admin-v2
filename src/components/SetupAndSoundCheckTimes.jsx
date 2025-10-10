import React from 'react';

const SetupAndSoundCheckTimes = ({ lineup, index, setLineups }) => {
  const { setupTime, soundcheckTime, totalSetupAndSoundcheckTime , packdownTime  } = lineup;

  const updateLineup = (field, value) => {
    setLineups((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
  
        const updated = {
          ...item,
          [field]: value === "" ? "" : Number(value),
        };
  
        // Only calculate total if both fields are valid numbers
        const setup = field === 'setupTime' ? value : item.setupTime;
        const soundcheck = field === 'soundcheckTime' ? value : item.soundcheckTime;
  
        updated.totalSetupAndSoundcheckTime =
          (Number(setup) || 0) + (Number(soundcheck) || 0);
  
        return updated;
      })
    );
  };

  return (
    <div className="grid grid-cols-8 gap-6">
      <div className="col-span-2">
        <label>Setup Time (mins)</label>
        <input
          type="number"
          placeholder="e.g., 60"
          className="w-full px-3 py-2 border"
          value={setupTime}
          onChange={(e) => updateLineup("setupTime", e.target.value)}
        />
      </div>

      <div className="col-span-2">
        <label>Soundcheck Time (mins)</label>
        <input
          type="number"
          placeholder="e.g., 30"
          className="w-full px-3 py-2 border"
          value={soundcheckTime}
          onChange={(e) => updateLineup("soundcheckTime", e.target.value)}
        />
      </div>

      <div className="col-span-2">
        <label>Total (mins)</label>
        <input
          type="number"
          value={totalSetupAndSoundcheckTime}
          disabled
          className="w-full px-3 py-2 border bg-gray-100"
        />
      </div>

      <div className="col-span-2">
        <label>Packdown Time (mins)</label>
        <input
          type="number"
          placeholder="e.g., 30"
          className="w-full px-3 py-2 border"
          value={packdownTime}
          onChange={(e) => updateLineup("packdownTime", e.target.value)}
        />
      </div>
    </div>
  );
};

export default SetupAndSoundCheckTimes;