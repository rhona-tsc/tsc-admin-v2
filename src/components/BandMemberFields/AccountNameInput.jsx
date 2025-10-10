import React from "react";

const AccountNameInput = ({
  member,
  index,
  memberIndex,
  updateBandMember,
}) => {
  return (
    <div className="col-span-2">
      <label>Account Name</label>
      <input
        type="text"
        value={member.accountName || ""}
        onChange={(e) =>
          updateBandMember(index, memberIndex, "accountName", e.target.value)
        }
        className="w-full px-3 py-2 border"
      />
    </div>
  );
};

export default AccountNameInput;