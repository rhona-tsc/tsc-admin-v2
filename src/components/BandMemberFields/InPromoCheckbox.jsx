
import React from "react";

const InPromoCheckbox = ({ member, index, memberIndex, updateBandMember }) => {
  const handleChange = () => {
    updateBandMember(index, memberIndex, "inPromo", !member.inPromo);
  };

  return (
    <div className="col-span-2">
      <label className="flex items-center gap-2 mt-7">
        <input
          type="checkbox"
          checked={member.inPromo || false}
          onChange={handleChange}
          className="accent-[#ff6667] w-6 h-6"
        />
        Features in our promotional material
      </label>
    </div>
  );
};

export default InPromoCheckbox;