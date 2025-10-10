import React from "react";

const DepStepFiveVocalMics = ({ formData, setFormData }) => {
  const micOptions = ["", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "10+"];

  const updateVocalMics = (field, value) => {
    console.log(`🔄 Updating field: ${field} with value: ${value}`);

    const updatedVocalMics = {
      ...formData.vocalMics,
      [field]: value,
    };

    console.log("✅ New vocalMics object:", updatedVocalMics);

    setFormData({
      vocalMics: updatedVocalMics,
    });
  };

  console.log("🧾 Current vocalMics from formData:", formData.vocalMics);

  return (
    <div className="flex flex-col gap-8 mt-6">
      <div className="flex flex-col gap-3 w-2/3">
        <h2 className="font-semibold text-lg">Vocal Microphones</h2>
        <p className="text-sm text-gray-600">
          Please indicate the number of vocal microphones you have in your setup.
        </p>
        <div className="flex gap-6 w-full">
  {[
    { field: "wired_vocal_mics", label: "Wired Vocal Mics" },
    { field: "wireless_vocal_mics", label: "Wireless Vocal Mics" },
    { field: "wireless_vocal_adapters", label: "Wireless Vocal Adapters" },
  ].map(({ field, label }) => (
    <div key={field} className="flex flex-col w-1/3">
      <label htmlFor={field} className="text-sm font-medium mb-1">
        {label}
      </label>
      <select
        id={field}
        value={formData.vocalMics?.[field] || ""}
        onChange={(e) => updateVocalMics(field, e.target.value)}
        className="border border-gray-300 rounded py-1.5 px-3.5"
      >
        <option value="">Select if applicable</option>
        {micOptions.slice(1).map((option) => (
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

export default DepStepFiveVocalMics;