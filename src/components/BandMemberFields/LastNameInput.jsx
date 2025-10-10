
import React from "react";

const LastNameInput = ({ member, index, memberIndex, updateBandMember }) => (
  <div className="col-span-2">
    <label>Last Name</label>
    <input
      type="text"
      value={member.lastName || ""}
      onChange={(e) =>
        updateBandMember(index, memberIndex, "lastName", e.target.value)
      }
      className="w-full px-3 py-2 border"
    />
  </div>
);

export default LastNameInput;