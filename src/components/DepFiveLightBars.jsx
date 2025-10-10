import React from "react";

const DepFiveLightBars = ({ formData = {}, setFormData = () => {} }) => {
  const lightBarQuantityOptions = [
    "", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "20+"
  ];

  const { lightBars = [] } = formData;

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
        <h2 className="font-semibold text-lg mt-6">Light Bars</h2>
        <p className="text-sm text-gray-600">
          Please indicate how many light bars you have in your setup and their respective wattage.
        </p>
        <div>
          {lightBars.map((lightBars, index) => (
            <div key={index} className="grid grid-cols-2 gap-4 mb-3">
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <select
                  value={lightBars.quantity || ""}
                  onChange={(e) => updateArrayItem("lightBars", index, "quantity", e.target.value)}
                  className="p-2 border rounded w-full"
                >
                  {lightBarQuantityOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
  <label className="block text-sm font-medium text-gray-700">Wattage</label>
  <input
    type="number"
    min="0"
    value={lightBars.wattage || ""}
    onChange={(e) => updateArrayItem("lightBars", index, "wattage", e.target.value)}
    className="p-2 border rounded w-full"
    placeholder="Enter wattage"
  />
</div>
              <button
                onClick={() => removeItem("lightBars", index)}
                className="text-red-500 text-left col-span-1"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              addItem("lightBars", {
                quantity: "",
                wattage: "",
              })
            }
            className="mt-2 text-sm text-blue-600 underline"
          >
            + Add a light bar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepFiveLightBars;