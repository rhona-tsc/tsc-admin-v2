import React from "react";

const FirstNameInput = ({ member, index, memberIndex, updateBandMember }) => (
  <div>
    <label>First Name</label>
    <input
      type="text"
      value={member.firstName || ""}
      onChange={(e) =>
        updateBandMember(index, memberIndex, "firstName", e.target.value)
      }
      className="w-full px-3 py-2 border"
    />
  </div>
);

export default FirstNameInput;