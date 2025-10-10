import React from "react";

const InstrumentInput = ({
  member,
  index,
  memberIndex,
  updateBandMember,
  MU_RATES,
}) => {
  const handleSelectChange = (e) => {
    const selected = e.target.value;

    updateBandMember(index, memberIndex, "instrument", selected);

    if (selected === "Other") {
      updateBandMember(index, memberIndex, "customInstrument", "");
    } else {
      // Set fee from MU_RATES if enabled
      if (member.useMURatesForFees && MU_RATES[selected]) {
        updateBandMember(index, memberIndex, "fee", MU_RATES[selected]);
      }
      updateBandMember(index, memberIndex, "customInstrument", "");
    }
  };

  const handleCustomInstrumentChange = (e) => {
    const customValue = e.target.value;
    updateBandMember(index, memberIndex, "customInstrument", customValue);
    updateBandMember(index, memberIndex, "instrument", customValue); // ✅ Keep instrument in sync
  };

  const isCustomInstrument = member.instrument === "Other" || (
    member.instrument &&
    !Object.keys(MU_RATES).includes(member.instrument)
  );

  return (
    <div className="col-span-2">
      <label>Instrument</label>
      {isCustomInstrument ? (
        <input
          type="text"
          placeholder="Enter custom instrument"
          value={member.customInstrument || member.instrument || ""}
                    onChange={handleCustomInstrumentChange}
          className="w-full px-2 py-2 border text-sm"
        />
      ) : (
        <select
          className="w-full px-2 py-2 border text-sm"
          value={member.instrument || ""}
          onChange={handleSelectChange}
        >
          <option value="">Select instrument</option>
          {Object.keys(MU_RATES).map((instrument) => (
            <option key={instrument} value={instrument}>
              {instrument}
            </option>
          ))}
          <option value="Other">Other</option>
        </select>
      )}
    </div>
  );
};

export default InstrumentInput;