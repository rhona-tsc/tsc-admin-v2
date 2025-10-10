import React from "react";

const DepFiveAgreementCheckboxes = ({
  formData = {},
  setFormData = () => {},
}) => {
  const updateField = (field, value) => {
    const updatedArray = formData.agreementCheckboxes?.length
      ? [...formData.agreementCheckboxes]
      : [
          {
            termsAndConditions: false,
            privacyPolicy: false,
          },
        ];

    updatedArray[0][field] = value;
    setFormData({ ...formData, agreementCheckboxes: updatedArray });
  };

  const agreementCheckboxes = formData.agreementCheckboxes?.[0] || {
    termsAndConditions: false,
            privacyPolicy: false,
  };

  return (
    <div className="flex flex-col gap-8 ">
      <div className="flex flex-col gap-3 w-full">
        <h2 className="font-semibold text-lg mt-6">My Consent</h2>
    
        <div className="grid grid-cols-1 gap-4 mb-3 w-full">
        <div className="flex items-start gap-2 text-left">
  <input
    type="checkbox"
    checked={agreementCheckboxes.termsAndConditions}
    onChange={(e) => updateField("termsAndConditions", e.target.checked)}
    className="mt-1"
  />
  <label className="text-sm text-gray-600">
    I agree to the terms and conditions as set out in the musicians contract above.
  </label>
</div>
        <div className="flex items-start gap-2 text-left">
  <input
    type="checkbox"
    checked={agreementCheckboxes.privacyPolicy}
    onChange={(e) => updateField("privacyPolicy", e.target.checked)}
    className="mt-1"
  />
  <label className="text-sm text-gray-700">
  I hereby consent to the processing of my data and, I consent to be contacted for roles and opportunities that align with my skills and abilities. The Supreme Collective assures me that my data will be securely stored and accessed only by authorised personnel. The data collected will be used exclusively for recruitment purposes, under all applicable data protection laws. Please see the privacy policy for further information.           </label>
</div>
        
        </div>
      </div>
    </div>
  );
};

export default DepFiveAgreementCheckboxes;