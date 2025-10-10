import React from "react";

const DepFiveAdditionalEquipment = ({ formData, setFormData }) => {
  const additionalEquipmentOptions = ["", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "10+"];

  const updateAdditionalEquipment = (field, value) => {
    console.log(`🔄 Updating field: ${field} with value: ${value}`);

    const updatedAdditionalEquipment = {
      ...formData.additionalEquipment,
      [field]: value,
    };

    console.log("✅ New additionalEquipment object:", updatedAdditionalEquipment);

    setFormData({
      additionalEquipment: updatedAdditionalEquipment,
    });
  };

  console.log("🧾 Current additionalEquipment from formData:", formData.additionalEquipment);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 w-full">
        <h2 className="font-semibold text-lg mt-6">Additional Equipment</h2>
        <p className="text-sm text-gray-600">
          Please what additional equipment is in your setup.
        </p>
        <div className="flex gap-6 w-full">
          {[
            { field: "mic_stands", label: "Mic Stands" },
            { field: "di_boxes", label: "DI Boxes" },
            { field: "wireless_guitar_jacks", label: "Wireless Guitar Jacks & Receivers" },
          ].map(({ field, label }) => (
            <div key={field} className="flex flex-col w-1/3">
              <label htmlFor={field} className="text-sm font-medium mb-1">
                {label}
              </label>
              <select
                id={field}
                value={formData.additionalEquipment?.[field] || ""}
                onChange={(e) => updateAdditionalEquipment(field, e.target.value)}
                className="border border-gray-300 rounded py-1.5 px-3.5"
              >
                <option value="">Select if applicable</option>
                {additionalEquipmentOptions.slice(1).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DepFiveAdditionalEquipment;