import React from "react";

const DJGearCheckboxes = ({ member, index, memberIndex, updateBandMember }) => {
  const handleChange = (field) => (e) => {
    const value = e.target.checked;
    updateBandMember(index, memberIndex, field, value);

    if (field === "haveBooth") {
      const existingRoles = member.additionalRoles || [];
      const hasPorterage = existingRoles.some(
        (r) => r.role === "DJ Booth Porterage"
      );

      if (value && !hasPorterage) {
        updateBandMember(index, memberIndex, "additionalRoles", [
          ...existingRoles,
          { role: "Other", role: "DJ Booth Porterage", fee: "" },
        ]);
      }

      if (!value && hasPorterage) {
        const updatedRoles = existingRoles.filter(
          (r) => r.role !== "DJ Booth Porterage"
        );
        updateBandMember(index, memberIndex, "additionalRoles", updatedRoles);
      }
    }
  };

  if (!member.canDJ) return null;

  return (
    <>
      <div className="col-span-2">
        <label className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            checked={member.haveMixingConsoleOrDecks || false}
            onChange={handleChange("haveMixingConsoleOrDecks")}
            className="accent-[#ff6667] w-8 h-8"
          />
          Has a mixing console/decks
        </label>
      </div>
      <div className="col-span-2">
        <label className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            checked={member.hasDjTable || false}
            onChange={handleChange("hasDjTable")}
            className="accent-[#ff6667] w-5 h-5"
          />
          Has a DJ table & able to transport
        </label>
      </div>
      <div className="col-span-2">
        <label className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            checked={member.haveBooth || false}
            onChange={handleChange("haveBooth")}
            className="accent-[#ff6667] w-8 h-8"
          />
          Has a DJ Booth & able to transport
        </label>
      </div>
    </>
  );
};

export default DJGearCheckboxes;