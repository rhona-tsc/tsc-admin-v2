import React from "react";

const DepFiveInstrumentMics = ({ formData, setFormData }) => {
  const instrumentMicOptions = ["", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "10+"];

  const updateInstrumentMics = (field, value) => {
    console.log(`🔄 Updating field: ${field} with value: ${value}`);

    const updatedInstrumentMics = {
      ...formData.instrumentMics,
      [field]: value,
    };

    console.log("✅ New instrumentMics object:", updatedInstrumentMics);

    setFormData({
      instrumentMics: updatedInstrumentMics,
    });
  };

  console.log("🧾 Current instrumentMics from formData:", formData.instrumentMics);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 w-2/3">
        <h2 className="font-semibold text-lg mt-6">Instrument Mics</h2>
        <p className="text-sm text-gray-600">
          Please indicate the number of instrument microphones you have in your setup.
        </p>
        <div className="flex gap-6 w-full">
          {[
            { field: "extra_wired_instrument_mics", label: "Wired Instrument Mics" },
            { field: "wireless_horn_mics", label: "Wireless Horn Mics" },
            { field: "drum_mic_kit", label: "Drum Mic Kit" },
          ].map(({ field, label }) => (
            <div key={field} className="flex flex-col w-1/3">
              <label htmlFor={field} className="text-sm font-medium mb-1">
                {label}
              </label>
              <select
                id={field}
                value={formData.instrumentMics?.[field] || ""}
                onChange={(e) => updateInstrumentMics(field, e.target.value)}
                className="border border-gray-300 rounded py-1.5 px-3.5"
              >
                <option value="">Select if applicable</option>
                {instrumentMicOptions.slice(1).map((option) => (
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

export default DepFiveInstrumentMics;