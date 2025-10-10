import React from "react";

const DepFiveInEarMonitoring = ({ formData, setFormData }) => {
  const inEarMonitoringOptions = ["", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "10+"];

  const updateInEarMonitoring = (field, value) => {
    console.log(`🔄 Updating field: ${field} with value: ${value}`);

    const updatedInEarMonitoring = {
      ...formData.inEarMonitoring,
      [field]: value,
    };

    console.log("✅ New inEarMonitoring object:", updatedInEarMonitoring);

    setFormData({
      inEarMonitoring: updatedInEarMonitoring,
    });
  };

  console.log("🧾 Current inEarMonitoring from formData:", formData.inEarMonitoring);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 w-2/3">
        <h2 className="font-semibold text-lg mt-6">In Ear Monitoring</h2>
        <p className="text-sm text-gray-600">
          Please indicate your in-ear monitor equipment.
        </p>
        <div className="flex gap-6 w-full">
          {[
            { field: "wired_in_ear_packs", label: "Wired In Ear Packs" },
            { field: "wireless_in_ear_packs", label: "Wireless In Ear Packs" },
            { field: "in_ear_monitors", label: "In Ear Monitors (Buds)" },
          ].map(({ field, label }) => (
            <div key={field} className="flex flex-col w-1/3">
              <label htmlFor={field} className="text-sm font-medium mb-1">
                {label}
              </label>
              <select
                id={field}
                value={formData.inEarMonitoring?.[field] || ""}
                onChange={(e) => updateInEarMonitoring(field, e.target.value)}
                className="border border-gray-300 rounded py-1.5 px-3.5"
              >
                <option value="">Select if applicable</option>
                {inEarMonitoringOptions.slice(1).map((option) => (
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

export default DepFiveInEarMonitoring;