import React from "react";

const MobileNumberInput = ({ member, index, memberIndex, updateBandMember }) => {
  const handleChange = (e) => {
    let number = e.target.value.trim();
    if (number.startsWith('07')) {
      number = '+44' + number.slice(1);
    }
    updateBandMember(index, memberIndex, "phoneNumber", number);
  };



  return (
    <div className="col-span-2">
      <label>Mobile Number</label>
      <input
        type="tel"
        value={member.phoneNumber || ""}
        onChange={handleChange}
        className="w-full px-3 py-2 border"
        placeholder="+447XXXXXXXXX"
        pattern="^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$"
      />
    </div>
  );
};

export default MobileNumberInput;