// components/EmailInput.jsx
import React, { useState, useEffect } from "react";

const EmailInput = ({ member, index, memberIndex, updateBandMember }) => {
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    // Reset error if email becomes valid externally
    if (
      member.email &&
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(member.email)
    ) {
      setEmailError("");
    }
  }, [member.email]);

  const handleChange = (e) => {
    const inputValue = e.target.value;
    updateBandMember(index, memberIndex, "email", inputValue);

    if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(inputValue)
    ) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  };

  return (
    <div className="col-span-2">
      <label>Email</label>
      <input
        type="email"
        value={member.email || ""}
        onChange={handleChange}
        className={`w-full px-3 py-2 border ${
          emailError ? "border-red-500" : ""
        }`}
        placeholder="example@email.com"
      />
      {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
    </div>
  );
};

export default EmailInput;