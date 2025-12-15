import React from "react";

const DepFiveInstrumentSpecs = ({ formData = {}, setFormData = () => {} }) => {
  const { instrumentSpecs = [] } = formData;

  const updateArrayItem = (arrayName, index, field, value) => {
    const updatedArray = [...(formData[arrayName] || [])];
    updatedArray[index] = { ...updatedArray[index], [field]: value };
    setFormData({ ...formData, [arrayName]: updatedArray });
  };

  const addItem = (arrayName, itemTemplate) => {
    const updatedArray = [...(formData[arrayName] || []), itemTemplate];
    setFormData({ ...formData, [arrayName]: updatedArray });
  };

  const removeItem = (arrayName, index) => {
    const updatedArray = [...(formData[arrayName] || [])];
    updatedArray.splice(index, 1);
    setFormData({ ...formData, [arrayName]: updatedArray });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 w-full">
        <h2 className="font-semibold text-lg mt-6">Instrument Specs</h2>
        <p className="text-sm text-gray-600">
          Please confirm the instrument specs you have in your setup and the respective wattage if applicable.
        </p>

        {instrumentSpecs.map((spec, index) => (
          <div key={index} className="grid grid-cols-3 gap-4 mb-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Make &amp; Model</label>
              <input
                type="text"
                value={spec.name || ""}
                onChange={(e) => updateArrayItem("instrumentSpecs", index, "name", e.target.value)}
                className="p-2 border rounded w-full"
                placeholder="Enter Make & Model"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Wattage</label>
              <input
                type="number"
                min="0"
                value={spec.wattage ?? ""}
                onChange={(e) => updateArrayItem("instrumentSpecs", index, "wattage", e.target.value)}
                className="p-2 border rounded w-full"
                placeholder="Enter wattage"
              />
            </div>

            <button
              type="button"
              onClick={() => removeItem("instrumentSpecs", index)}
              className="text-red-500 text-left col-span-3"
            >
              Remove
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            addItem("instrumentSpecs", {
              name: "",
              wattage: "",
            })
          }
          className="mt-2 text-sm text-blue-600 underline"
        >
          + Add an instrument
        </button>
      </div>
    </div>
  );
};

export default DepFiveInstrumentSpecs;