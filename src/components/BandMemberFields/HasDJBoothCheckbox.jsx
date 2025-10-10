import React from 'react';

const HasDJBoothCheckbox = ({ member, index, memberIndex, updateBandMember }) => {
  const handleChange = () => {
    const value = !member.hasDjBooth;
    updateBandMember(index, memberIndex, "hasDjBooth", value);

    const existingRoles = member.additionalRoles || [];
    const hasPorterage = existingRoles.some(r => r.role === "DJ Booth Porterage");

    if (value && !hasPorterage) {
      updateBandMember(index, memberIndex, "additionalRoles", [
        ...existingRoles,
        { role: "Other", additionalRole: "DJ Booth Porterage", fee: "" }
      ]);
    }

    if (!value && hasPorterage) {
      const updatedRoles = existingRoles.filter(
        r => r.role !== "DJ Booth Porterage"
      );
      updateBandMember(index, memberIndex, "additionalRoles", updatedRoles);
    }
  };

  return (
    <div className="col-span-2">
      <label className="flex items-center gap-2 mt-4">
        <input
          type="checkbox"
          checked={member.hasDjBooth || false}
          onChange={handleChange}
          className="accent-[#ff6667] w-6 h-6"
        />
        Has a DJ booth & able to transport
      </label>
    </div>
  );
};

export default HasDJBoothCheckbox;