import React from "react";

const CarRegistrationInput = ({ member, index, memberIndex, updateBandMember }) => {
  const handleSelectChange = (e) => {
    const val = e.target.value;
    updateBandMember(index, memberIndex, "carRegistration", val);
    if (val !== "HAS_CAR") {
      updateBandMember(index, memberIndex, "carRegistrationValue", "");
    }
  };

const handleInputChange = (e) => {
  const inputValue = e.target.value.toUpperCase();
  updateBandMember(index, memberIndex, "carRegistrationValue", inputValue);
};

  return (
    <div className="col-span-2">
      <label>Car Registration</label>
      {member.carRegistration === "HAS_CAR" ? (
        <input
          type="text"
          className="w-full px-3 py-2 border"
          value={member.carRegistrationValue || ""}
          onChange={handleInputChange}
          onBlur={() => {
            if (!member.carRegistrationValue) {
              updateBandMember(index, memberIndex, "carRegistration", "");
            }
          }}
          placeholder="e.g., TS12 3CC"
        />
      ) : (
        <select
          className="w-full px-3 py-2 border mb-2"
          value={member.carRegistration || ""}
          onChange={handleSelectChange}
        >
          <option value="" disabled>
            Select option
          </option>
          <option value="NO_CAR">I don't drive</option>
          <option value="UNKNOWN">
            I drive, but don't know the reg until closer to the time of the gig
          </option>
          <option value="HAS_CAR">I drive, my car reg is...</option>
        </select>
      )}
    </div>
  );
};

export default CarRegistrationInput;