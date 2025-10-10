import React from "react";

const DepFiveLighting = ({ formData = {}, setFormData = () => {} }) => {
  const uplightQuantityOptions = [
    "", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "20+"
  ];

  const { uplights = [] } = formData;

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
        <h2 className="font-semibold text-lg mt-6">Uplights</h2>
        <p className="text-sm text-gray-600">
          Please indicate how many uplights you have in your setup and their respective wattage.
        </p>
        <div>
          {uplights.map((uplight, index) => (
            <div key={index} className="grid grid-cols-2 gap-4 mb-3">
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <select
                  value={uplight.quantity || ""}
                  onChange={(e) => updateArrayItem("uplights", index, "quantity", e.target.value)}
                  className="p-2 border rounded w-full"
                >
                  {uplightQuantityOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
  <label className="block text-sm font-medium text-gray-700">Wattage</label>
  <input
    type="number"
    min="0"
    value={uplight.wattage || ""}
    onChange={(e) => updateArrayItem("uplights", index, "wattage", e.target.value)}
    className="p-2 border rounded w-full"
    placeholder="Enter wattage (number)"
  />
</div>
              <button
                onClick={() => removeItem("uplights", index)}
                className="text-red-500 text-left col-span-2"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              addItem("uplights", {
                quantity: "",
                wattage: "",
              })
            }
            className="mt-2 text-sm text-blue-600 underline"
          >
            + Add Another Uplight
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepFiveLighting;