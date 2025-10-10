import React from "react";

const SortCodeInput = ({
  member,
  index,
  memberIndex,
  updateBandMember,
  sortCodeError,
  setSortCodeError,
  validateSortCode,
}) => {
  const handleSortCodeChange = (e) => {
    let formattedSortCode = e.target.value.replace(/\D/g, ""); // Remove non-digits

    if (formattedSortCode.length >= 4) {
      formattedSortCode = formattedSortCode
        .slice(0, 6)
        .replace(/(\d{2})(\d{2})(\d{2})/, "$1-$2-$3");
    }

    updateBandMember(index, memberIndex, "sortCode", formattedSortCode);

    setSortCodeError(
      validateSortCode(formattedSortCode)
        ? ""
        : "Sort code must be 6 digits (XX-XX-XX)."
    );
  };

  return (
    <div className="col-span-2">
      <label>Sort Code</label>
      <input
        type="text"
        value={member.sortCode || ""}
        onChange={handleSortCodeChange}
        className={`w-full px-3 py-2 border ${sortCodeError ? "border-red-500" : ""}`}
        placeholder="XX-XX-XX"
        maxLength={8}
      />
      {sortCodeError && <p className="text-red-500 text-sm">{sortCodeError}</p>}
    </div>
  );
};

export default SortCodeInput;