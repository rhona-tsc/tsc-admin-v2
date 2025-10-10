import React from "react";

const DepFivePaSpeakerSpecs = ({ formData = {}, setFormData = () => {} }) => {
  const paSpeakerSpecsQuantityOptions = [
    "", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "20+"
  ];

  const { paSpeakerSpecs = [] } = formData;

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
        <h2 className="font-semibold text-lg mt-6">PA Speakers</h2>
        <p className="text-sm text-gray-600">
          Please confirm the PA speaker specs you have in your setup and the respective quantity and wattage.
        </p>
        <div>
        {paSpeakerSpecs.map((paSpeakerSpecs, index) => (
  <div key={index} className="grid grid-cols-3 gap-4 mb-3">
    <div>
      <label className="block text-sm font-medium text-gray-700">Make & Model</label>
      <input
        type="text"
        value={paSpeakerSpecs.name || ""}
        onChange={(e) => updateArrayItem("paSpeakerSpecs", index, "name", e.target.value)}
        className="p-2 border rounded w-full"
        placeholder="Enter PA Make & Model"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700">Quantity</label>
      <select
        value={paSpeakerSpecs.quantity || ""}
        onChange={(e) => updateArrayItem("paSpeakerSpecs", index, "quantity", e.target.value)}
        className="p-2 border rounded w-full"
      >
        {paSpeakerSpecsQuantityOptions.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700">Wattage</label>
      <input
        type="number"
        min="0"
        value={paSpeakerSpecs.wattage || ""}
        onChange={(e) => updateArrayItem("paSpeakerSpecs", index, "wattage", e.target.value)}
        className="p-2 border rounded w-full"
        placeholder="Enter wattage"
      />
    </div>

    <button
      onClick={() => removeItem("paSpeakerSpecs", index)}
      className="text-red-500 text-left col-span-3"
    >
      Remove
    </button>
  </div>
))}
          <button
            onClick={() =>
              addItem("paSpeakerSpecs", {
                quantity: "",
                wattage: "",
              })
            }
            className="mt-2 text-sm text-blue-600 underline"
          >
            + Add a PA speaker
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepFivePaSpeakerSpecs;