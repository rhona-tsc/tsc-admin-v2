import React from "react";

const AccountNumberInput = ({
  member,
  index,
  memberIndex,
  updateBandMember,
  accountError,
  setAccountError,
  validateAccountNumber,
}) => {
  const handleChange = (e) => {
    const accountNumber = e.target.value.replace(/\D/g, ""); // Only digits
    updateBandMember(index, memberIndex, "accountNumber", accountNumber);

    setAccountError(
      validateAccountNumber(accountNumber)
        ? ""
        : "Account number must be 6 to 8 digits."
    );
  };

  return (
    <div className="col-span-2">
      <label>Account Number</label>
      <input
        type="text"
        value={member.accountNumber || ""}
        onChange={handleChange}
        className={`w-full px-3 py-2 border ${accountError ? "border-red-500" : ""}`}
        placeholder="e.g. 12345678"
      />
      {accountError && <p className="text-red-500 text-sm">{accountError}</p>}
    </div>
  );
};

export default AccountNumberInput;