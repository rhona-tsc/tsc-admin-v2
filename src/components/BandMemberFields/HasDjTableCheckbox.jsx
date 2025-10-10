import React from 'react'

const HasDjTableCheckbox = ({ member, index, memberIndex, updateBandMember }) => {
  const handleChange = () => {
    const isNowChecked = !member.hasDjTable;

    // Update the checkbox value
    updateBandMember(index, memberIndex, "hasDjTable", isNowChecked);

    if (!isNowChecked) {
      // If DJ is being turned off, remove DJ-related custom roles if they exist but have no label
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
            checked={member.hasDjTable || false}
            onChange={handleChange}
            className="accent-[#ff6667] w-4 h-4"            />
          Has a DJ table & able to transport
        </label>
      </div>
    );
    
}

export default HasDjTableCheckbox
