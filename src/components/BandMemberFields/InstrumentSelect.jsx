import React from "react";

const InstrumentSelect = ({ member, MU_RATES, updateBandMember, index, memberIndex }) => {
  return (
    <div className="col-span-5">
      <label>Instrument</label>

      {member.instrument === "Other" ? (
        <input
          type="text"
          placeholder="Enter custom instrument"
          value={member.customInstrument || ""}
          onChange={(e) => {
            const value = e.target.value;
            updateBandMember(index, memberIndex, "customInstrument", value);

            if (value.trim() === "") {
              updateBandMember(index, memberIndex, "instrument", "");
            }
          }}
          className="w-full px-2 py-2 border text-sm"
        />
      ) : (
        <select
          className="w-full px-2 py-2 border text-sm"
          value={member.instrument || ""}
          onChange={(e) => {
            const selectedInstrument = e.target.value;
            updateBandMember(index, memberIndex, "instrument", selectedInstrument);

            if (member.useMURatesForFees) {
              updateBandMember(
                index,
                memberIndex,
                "fee",
                MU_RATES[selectedInstrument] || ""
              );
            }

            if (selectedInstrument === "Other") {
              updateBandMember(index, memberIndex, "customInstrument", "");
            }
          }}
        >
          <option value="">Select instrument</option>
          {Object.keys(MU_RATES).map((instrument) => (
            <option key={instrument} value={instrument || ""}>
              {instrument}
            </option>
          ))}
          <option value="Other">Other</option>
        </select>
      )}
    </div>
  );
};

export default InstrumentSelect;