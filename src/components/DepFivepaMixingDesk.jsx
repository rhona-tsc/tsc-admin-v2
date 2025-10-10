import React from "react";

const DepFiveMixingDesk = ({ formData = {}, setFormData = () => {} }) => {
  const mixingDeskQuantityOptions = [
    "", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "20+"
  ];

  const { mixingDesk = [] } = formData;

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
        <h2 className="font-semibold text-lg mt-6">Mixing Desks</h2>
        <p className="text-sm text-gray-600">
          Please confirm the mixing desk specs you have in your setup and the respective quantity and wattage.
        </p>
        <div>
        {mixingDesk.map((mixingDesk, index) => (
  <div key={index} className="grid grid-cols-3 gap-4 mb-3">
    <div>
      <label className="block text-sm font-medium text-gray-700">Make & Model</label>
      <input
        type="text"
        value={mixingDesk.name || ""}
        onChange={(e) => updateArrayItem("mixingDesk", index, "name", e.target.value)}
        className="p-2 border rounded w-full"
        placeholder="Enter Make & Model"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700">Quantity</label>
      <select
        value={mixingDesk.quantity || ""}
        onChange={(e) => updateArrayItem("mixingDesk", index, "quantity", e.target.value)}
        className="p-2 border rounded w-full"
      >
        {mixingDeskQuantityOptions.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700">Wattage</label>
      <input
        type="number"
        min="0"
        value={mixingDesk.wattage || ""}
        onChange={(e) => updateArrayItem("mixingDesk", index, "wattage", e.target.value)}
        className="p-2 border rounded w-full"
        placeholder="Enter wattage"
      />
    </div>

    <button
      onClick={() => removeItem("mixingDesk", index)}
      className="text-red-500 text-left col-span-3"
    >
      Remove
    </button>
  </div>
))}
          <button
            onClick={() =>
              addItem("mixingDesk", {
                quantity: "",
                wattage: "",
              })
            }
            className="mt-2 text-sm text-blue-600 underline"
          >
            + Add a mixing desk
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepFiveMixingDesk;