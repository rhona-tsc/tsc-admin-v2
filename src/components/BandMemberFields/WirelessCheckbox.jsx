
import React from "react";

const WirelessCheckbox = ({ member, index, memberIndex, updateBandMember }) => {
  const handleChange = () => {
    updateBandMember(index, memberIndex, "wireless", !member.wireless);
  };

  return (
    <div className="col-span-2">
      <label className="flex items-center gap-2 mt-7">
        <input
          type="checkbox"
          checked={member.wireless || false}
          onChange={handleChange}
          className="accent-[#ff6667] w-6 h-6"
        />
        Has a wireless mic & can roam
      </label>
    </div>
  );
};

export default WirelessCheckbox;