import React, { useState, useEffect } from "react";

const WattageInput = ({ member, index, memberIndex, updateBandMember }) => {
  const [wattage, setWattage] = useState(Array.isArray(member.wattage) ? member.wattage : []);

  useEffect(() => {
    setWattage(Array.isArray(member.wattage) ? member.wattage : []);
  }, [member.wattage]);

  return (
    <div className="flex flex-col gap-2">
      <label className="font-semibold">Wattage</label>
      {wattage.map((watts, i) => (
        <input
          key={i}
          type="text"
          value={watts}
          placeholder={`Wattage ${i + 1}`}
          onChange={(e) =>
            updateBandMember(index, memberIndex, `wattage.${i}`, e.target.value)
          }
          className="w-full px-3 py-2 border"
        />
      ))}
    </div>
  );
};

export default WattageInput;