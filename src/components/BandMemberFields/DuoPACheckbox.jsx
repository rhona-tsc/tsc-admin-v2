// components/DuoPACheckbox.jsx
import React from "react";

const DuoPACheckbox = ({ member, index, memberIndex, updateBandMember }) => {
  const handleChange = () => {
    updateBandMember(index, memberIndex, "haveDuoPa", !member.haveDuoPa);
  };

  return (
    <div className="col-span-2">
      <label className="flex items-center gap-2 mt-5">
        <input
          type="checkbox"
          checked={member.haveDuoPa || false}
          onChange={handleChange}
          className="accent-[#ff6667] w-6 h-6"
        />
        Has own PA for duo sets
      </label>
    </div>
  );
};

export default DuoPACheckbox;