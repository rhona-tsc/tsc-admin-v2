import React from "react";

const DepStepFiveSpeechMics = ({ formData, setFormData }) => {
  const speechMicOptions = ["", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "10+"];

  const updateSpeechMics = (field, value) => {
    console.log(`🔄 Updating field: ${field} with value: ${value}`);

    const updatedSpeechMics = {
      ...formData.speechMics,
      [field]: value,
    };

    console.log("✅ New speechMics object:", updatedSpeechMics);

    setFormData({
      speechMics: updatedSpeechMics,
    });
  };

  console.log("🧾 Current speechMics from formData:", formData.speechMics);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 w-2/3">
        <h2 className="font-semibold text-lg mt-6">Speech Mics</h2>
        <p className="text-sm text-gray-600">
          Please indicate the number of microphones suitable for speeches that you have in your setup.
        </p>
        <div className="flex gap-6 w-full">
          {[
            { field: "wireless_speech_mics", label: "Wired Speech Mics" },
            { field: "wired_speech_mics", label: "Wireless Speech Mics" },
          ].map(({ field, label }) => (
            <div key={field} className="flex flex-col w-1/3">
              <label htmlFor={field} className="text-sm font-medium mb-1">
                {label}
              </label>
              <select
                id={field}
                value={formData.speechMics?.[field] || ""}
                onChange={(e) => updateSpeechMics(field, e.target.value)}
                className="border border-gray-300 rounded py-1.5 px-3.5"
              >
                <option value="">Select if applicable</option>
                {speechMicOptions.slice(1).map((option) => (
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

export default DepStepFiveSpeechMics;