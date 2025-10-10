import React from "react";
import PropTypes from "prop-types";

const StepNav = ({ step, setStep, totalSteps, onSubmit }) => (
  <div className="flex justify-between mt-6 w-full">
    {step > 1 && (
      <button
        type="button"
        className="bg-gray-200 px-4 py-2 "
        onClick={() => setStep(step - 1)}
      >
        Back
      </button>
    )}
    {step < totalSteps ? (
      <button
        type="button"
        className="bg-black text-white px-4 py-2 "
        onClick={() => setStep(step + 1)}
      >
        Next
      </button>
    ) : (
      <button
        type="button"
        onClick={() => {
          console.log("🔍 Submit button clicked - starting handleSubmit");
          onSubmit();
        }}
        className="mb-2 px-4 py-3 bg-black text-white hover:bg-[#ff6667] hover:text-black"
      >
        Submit
      </button>
    )}
  </div>
);
StepNav.propTypes = {
  step: PropTypes.number.isRequired,
  setStep: PropTypes.func.isRequired,
  totalSteps: PropTypes.number.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
export default StepNav;
