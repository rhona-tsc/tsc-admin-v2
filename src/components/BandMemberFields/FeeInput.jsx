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
  const getMuRate = () => {
    const r = MU_RATES?.[member?.instrument];
    return r === undefined || r === null ? "" : String(r);
  };

  const getNyeOverride = () => {
    const v = member?.specialDatePricing?.nye?.overrideFee;
    return v === null || v === undefined ? "" : String(v);
  };

  const setNyeOverride = (nextOverride) => {
    const prev = member?.specialDatePricing || {};
    const prevNye = prev?.nye || {};
    const next = {
      ...prev,
      nye: {
        ...prevNye,
        // keep extraFee if you ever use it later
        extraFee: typeof prevNye.extraFee === "number" ? prevNye.extraFee : 0,
        overrideFee:
          nextOverride === "" || nextOverride === null || nextOverride === undefined
            ? null
            : nextOverride,
      },
    };

    updateBandMember(index, memberIndex, "specialDatePricing", next);
  };

  const hasNyeOverride = member?.specialDatePricing?.nye?.overrideFee !== null &&
    member?.specialDatePricing?.nye?.overrideFee !== undefined &&
    String(member?.specialDatePricing?.nye?.overrideFee) !== "";

    console.log("NYE member snapshot", member?.specialDatePricing);

  return (
    <div className="col-span-1">
      <FeeLabelWithToolTip />
      <input
        type="text"
        value={
          member.useMURatesForFees
            ? getMuRate()
            : (member.fee === null || member.fee === undefined ? "" : String(member.fee))
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

      {/* 🎇 NYE override (per band member) */}
      <div className="mt-3">
        <label className="text-xs text-gray-700 flex items-center gap-2">
          <input
            type="checkbox"
            checked={hasNyeOverride}
            onChange={(e) => {
              const nextChecked = e.target.checked;
              if (nextChecked) {
                // default to current fee (or MU rate) so they can tweak
                const seed = member?.useMURatesForFees ? getMuRate() : (member?.fee ?? "");
                setNyeOverride(seed === null || seed === undefined ? "" : String(seed));
              } else {
                setNyeOverride(null);
              }
            }}
            className="w-4 h-4 accent-[#ff6667] cursor-pointer"
          />
          Different rate for NYE?
        </label>

        {hasNyeOverride && (
          <div className="mt-2">
            <input
              type="text"
              value={getNyeOverride()}
              onChange={(e) => {
                let inputValue = e.target.value.replace(/[^0-9.]/g, "");
                if ((inputValue.match(/\./g) || []).length > 1) inputValue = inputValue.slice(0, -1);
                if (inputValue.startsWith(".")) inputValue = "";
                setNyeOverride(inputValue);
              }}
              className="w-full px-3 py-2 border"
              placeholder="NYE fee override"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Overrides the normal fee for 31st Dec enquiries for this band member.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeeInput;