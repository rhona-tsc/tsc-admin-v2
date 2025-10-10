import React from "react";

const CanDJCheckbox = ({ member, index, memberIndex, updateBandMember }) => {
  const handleChange = () => {
    const isNowChecked = !member.canDJ;

    updateBandMember(index, memberIndex, "canDJ", !member.canDJ);

    if (!isNowChecked) {
      const updatedRoles = (member.additionalRoles || []).filter((role) => {
        const hasCustom = role.role && role.role.trim() !== "";
        const hasFee = role.fee && role.fee !== "";
        return hasCustom || hasFee;
      });

      updateBandMember(index, memberIndex, "additionalRoles", updatedRoles);
    }
  };

  return (
    <div className="col-span-2">
         <label className="flex items-center gap-2 mt-4">
        <input
          type="checkbox"
          checked={member.canDJ || false}
          onChange={handleChange}
          className="accent-[#ff6667] w-4 h-4"

        />
        Can DJ with mixing console/decks
      </label>
    </div>
  );
};

export default CanDJCheckbox;