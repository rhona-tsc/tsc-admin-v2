import React from "react";

const DietaryRequirementsInput = ({ member, index, memberIndex, updateBandMember }) => {
  const handleChange = (e) => {
    updateBandMember(index, memberIndex, "dietaryRequirements", e.target.value);
  };

  return (
    <div className="col-span-2">
      <label>Dietary Requirements</label>
      <input
        type="text"
        value={member.dietaryRequirements || ""}
        onChange={handleChange}
        className="w-full px-3 py-2 border"
      />
    </div>
  );
};

export default DietaryRequirementsInput;