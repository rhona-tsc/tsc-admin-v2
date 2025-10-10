import React from "react";
import FeeLabelWithToolTip from "../FeeLabelWithToolTip";

const FeeInput = ({
  member,
  MU_RATES,
  feeError,
  setFeeError = () => {}, // fallback no-op function
  updateBandMember,
  index,
  memberIndex,
}) => {
  return (
    <div className="col-span-1">
      <FeeLabelWithToolTip />
      <input
        type="text"
        value={
          member.useMURatesForFees
            ? MU_RATES[member.instrument] || ""
            : member.fee
        }
        onChange={(e) => {
          let inputValue = e.target.value.replace(/[^0-9.]/g, "");

          if ((inputValue.match(/\./g) || []).length > 1) {
            inputValue = inputValue.slice(0, -1);
          }
          if (inputValue.startsWith(".")) {
            inputValue = "";
          }

          updateBandMember(index, memberIndex, "fee", inputValue);
          setFeeError(
            inputValue === "" || isNaN(inputValue)
              ? "Fee must be a valid number"
              : ""
          );
        }}
        className={`w-full px-3 py-2 border ${feeError ? "border-red-500" : ""}`}
        placeholder="Fee"
        disabled={member.useMURatesForFees}
      />
      {feeError && <p className="text-red-500 text-sm">{feeError}</p>}
    </div>
  );
};

export default FeeInput;