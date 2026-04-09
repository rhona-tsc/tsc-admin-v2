import React from "react";
import FeeLabelWithToolTip from "../FeeLabelWithToolTip";

const PERFORMANCE_LENGTH_OPTIONS = ["30", "40", "45", "60", "custom"];
const ADDITIONAL_PERFORMANCE_FIELD = "additionalPerformanceRates";

const sanitizeNumericInput = (value) => {
  let inputValue = String(value ?? "").replace(/[^0-9.]/g, "");

  if ((inputValue.match(/\./g) || []).length > 1) {
    inputValue = inputValue.slice(0, -1);
  }

  if (inputValue.startsWith(".")) {
    inputValue = "";
  }

  return inputValue;
};

// DB shape -> UI shape
const normalizeAdditionalPerformanceRateForUi = (rate = {}) => {
  const rawDuration =
    rate?.duration ?? rate?.minutes ?? rate?.label ?? "";

  const duration =
    rawDuration === null || rawDuration === undefined
      ? ""
      : sanitizeNumericInput(rawDuration);

  const rawFee =
    rate?.fee === null || rate?.fee === undefined
      ? ""
      : sanitizeNumericInput(rate.fee);

  return {
    duration,
    fee: rawFee,
    isCustom: !["30", "40", "45", "60"].includes(String(duration)),
  };
};

// UI shape -> DB shape
const normalizeAdditionalPerformanceRateForDb = (rate = {}) => {
  const rawDuration =
    rate?.duration ?? rate?.minutes ?? rate?.label ?? "";

  const duration = sanitizeNumericInput(rawDuration);

  const rawFee =
    rate?.fee === null || rate?.fee === undefined
      ? ""
      : sanitizeNumericInput(rate.fee);

  return {
    minutes: duration === "" ? null : Number(duration),
    label: duration,
    fee: rawFee === "" ? null : Number(rawFee),
  };
};

const FeeInput = ({
  member,
  MU_RATES,
  feeError,
  setFeeError = () => {},
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

    const cleanedOverride = sanitizeNumericInput(nextOverride);

    const next = {
      ...prev,
      nye: {
        ...prevNye,
        extraFee: typeof prevNye.extraFee === "number" ? prevNye.extraFee : 0,
        overrideFee:
          cleanedOverride === "" || cleanedOverride === null || cleanedOverride === undefined
            ? null
            : Number(cleanedOverride),
      },
    };

    updateBandMember(index, memberIndex, "specialDatePricing", next);
  };

  const getAdditionalPerformanceRates = () => {
    const rates =
      member?.[ADDITIONAL_PERFORMANCE_FIELD] ||
      member?.additionalPerformanceFees ||
      [];

    return Array.isArray(rates)
      ? rates.map(normalizeAdditionalPerformanceRateForUi)
      : [];
  };

  const setAdditionalPerformanceRates = (nextRates) => {
    const normalizedRates = Array.isArray(nextRates)
      ? nextRates.map(normalizeAdditionalPerformanceRateForDb)
      : [];

    updateBandMember(
      index,
      memberIndex,
      ADDITIONAL_PERFORMANCE_FIELD,
      normalizedRates
    );
  };

  const addAdditionalPerformanceRate = (selectedLength) => {
    const currentRates = getAdditionalPerformanceRates();

    const duration = selectedLength === "custom" ? "" : String(selectedLength);

    const nextRate = {
      duration,
      fee: "",
      isCustom: selectedLength === "custom",
    };

    setAdditionalPerformanceRates([...currentRates, nextRate]);
  };

  const updateAdditionalPerformanceRate = (rateIndex, field, value) => {
    const currentRates = getAdditionalPerformanceRates();

    const nextRates = currentRates.map((rate, i) => {
      if (i !== rateIndex) return rate;

      return {
        ...rate,
        [field]: field === "duration" || field === "fee"
          ? sanitizeNumericInput(value)
          : value,
      };
    });

    setAdditionalPerformanceRates(nextRates);
  };

  const removeAdditionalPerformanceRate = (rateIndex) => {
    const currentRates = getAdditionalPerformanceRates();
    const nextRates = currentRates.filter((_, i) => i !== rateIndex);
    setAdditionalPerformanceRates(nextRates);
  };

  const hasNyeOverride =
    member?.specialDatePricing?.nye?.overrideFee !== null &&
    member?.specialDatePricing?.nye?.overrideFee !== undefined &&
    String(member?.specialDatePricing?.nye?.overrideFee) !== "";

  const additionalPerformanceRates = getAdditionalPerformanceRates();

  return (
    <div className="col-span-1">
      <FeeLabelWithToolTip />

      <input
        type="text"
        value={
          member.useMURatesForFees
            ? getMuRate()
            : member.fee === null || member.fee === undefined
            ? ""
            : String(member.fee)
        }
        onChange={(e) => {
          const inputValue = sanitizeNumericInput(e.target.value);

          updateBandMember(
            index,
            memberIndex,
            "fee",
            inputValue === "" ? null : Number(inputValue)
          );

          setFeeError(
            inputValue === "" || isNaN(Number(inputValue))
              ? "Fee must be a valid number"
              : ""
          );
        }}
        className={`w-full px-3 py-2 border ${feeError ? "border-red-500" : ""}`}
        placeholder="Fee"
        disabled={member.useMURatesForFees}
      />

      {feeError && <p className="text-red-500 text-sm">{feeError}</p>}

      <div className="mt-4 rounded-md border border-gray-200 bg-white p-3">
        <div>
          <p className="text-xs font-medium text-gray-800">
            Additional performance fees
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            Add optional fees for longer performance times.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {PERFORMANCE_LENGTH_OPTIONS.map((option) => {
            const label = option === "custom" ? "+ Custom" : `+ ${option} mins`;

            return (
              <button
                key={option}
                type="button"
                onClick={() => addAdditionalPerformanceRate(option)}
                className="px-2.5 py-1 text-[11px] rounded-full border border-gray-300 bg-gray-50 text-gray-700 hover:border-[#ff6667] hover:text-[#ff6667] transition"
              >
                {label}
              </button>
            );
          })}
        </div>

        {additionalPerformanceRates.length > 0 && (
          <div className="mt-3 space-y-2">
            {additionalPerformanceRates.map((rate, rateIndex) => (
              <div
                key={`${rate.duration || "custom"}-${rateIndex}`}
                className="rounded-md border border-gray-200 bg-gray-50 p-2.5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-[120px_minmax(0,1fr)_auto] gap-2 items-end">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-gray-600">
                      Mins
                    </label>
                    <input
                      type="text"
                      value={String(rate?.duration ?? "")}
                      onChange={(e) => {
                        updateAdditionalPerformanceRate(
                          rateIndex,
                          "duration",
                          e.target.value
                        );
                      }}
                      className="w-full px-3 py-2 border bg-white text-sm"
                      placeholder="Minutes"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-gray-600">
                      Fee (£)
                    </label>
                    <input
                      type="text"
                      value={String(rate?.fee ?? "")}
                      onChange={(e) => {
                        updateAdditionalPerformanceRate(
                          rateIndex,
                          "fee",
                          e.target.value
                        );
                      }}
                      className="w-full px-3 py-2 border bg-white text-sm"
                      placeholder="Fee"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeAdditionalPerformanceRate(rateIndex)}
                    className="text-xs text-gray-500 hover:text-red-500 transition px-1 justify-self-start sm:justify-self-end"
                    aria-label="Remove additional performance rate"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3">
        <label className="text-xs text-gray-700 flex items-center gap-2">
          <input
            type="checkbox"
            checked={hasNyeOverride}
            onChange={(e) => {
              const nextChecked = e.target.checked;

              if (nextChecked) {
                const seed = member?.useMURatesForFees
                  ? getMuRate()
                  : member?.fee ?? "";

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
                setNyeOverride(e.target.value);
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