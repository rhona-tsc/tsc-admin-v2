// components/SoloPACheckbox.jsx
import React from "react";

const SoloPACheckbox = ({ member, index, memberIndex, updateBandMember }) => {
  const handleChange = () => {
    updateBandMember(index, memberIndex, "haveSoloPa", !member.haveSoloPa);
  };

  return (
    <div className="col-span-2">
      <label className="flex items-center gap-2 mt-5">
        <input
          type="checkbox"
          checked={member.haveSoloPa || false}
          onChange={handleChange}
          className="accent-[#ff6667] w-6 h-6"
        />
        Has own PA for solo sets
      </label>
    </div>
  );
};

export default SoloPACheckbox;