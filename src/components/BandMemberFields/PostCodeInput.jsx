// components/PostCodeInput.jsx
import React from "react";

const PostCodeInput = ({
  member,
  index,
  memberIndex,
  updateBandMember,
  postCodeError,
  setPostCodeError,
}) => {
  const handleChange = (e) => {
    const inputValue = e.target.value.toUpperCase();
    updateBandMember(index, memberIndex, "postCode", inputValue);

    const ukPostcodeRegex =
      /^(GIR 0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/;
    setPostCodeError(
      ukPostcodeRegex.test(inputValue)
        ? ""
        : "Please enter a valid UK postcode."
    );
  };

  return (
    <div className="col-span-2">
      <label>Post Code</label>
      <input
        type="text"
        value={member.postCode || ""}
        onChange={handleChange}
        className={`w-full px-3 py-2 border ${postCodeError ? "border-red-500" : ""}`}
        placeholder="e.g., SW1A 1AA"
      />
      {postCodeError && (
        <p className="text-red-500 text-sm">{postCodeError}</p>
      )}
    </div>
  );
};

export default PostCodeInput;