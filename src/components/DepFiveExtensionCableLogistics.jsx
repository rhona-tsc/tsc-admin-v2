import React from "react";

const DepFiveExtensionCableLogistics = ({ formData = {}, setFormData = () => {} }) => {
  const extensionCableLengthAndQuantityOptions = [
    "", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "20+"
  ];

  const { extensionCableLogistics = [] } = formData;

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
        <h2 className="font-semibold text-lg mt-6">Extension Cables</h2>
        <p className="text-sm text-gray-600">
          Please indicate how many extension cables you have in your setup and their respective lengths.
        </p>
        <div>
          {extensionCableLogistics.map((extensionCable, index) => (
            <div key={index} className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Length (m)</label>
                <select
                  value={extensionCable.length || ""}
                  onChange={(e) => updateArrayItem("extensionCableLogistics", index, "length", e.target.value)}
                  className="p-2 border rounded w-full"
                >
                  {extensionCableLengthAndQuantityOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <select
                  value={extensionCable.quantity || ""}
                  onChange={(e) => updateArrayItem("extensionCableLogistics", index, "quantity", e.target.value)}
                  className="p-2 border rounded w-full"
                >
                  {extensionCableLengthAndQuantityOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => removeItem("extensionCableLogistics", index)}
                className="text-red-500 text-left col-span-2"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              addItem("extensionCableLogistics", {
                length: "",
                quantity: "",
              })
            }
            className="mt-2 text-sm text-blue-600 underline"
          >
            + Add Another Extension Cable
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepFiveExtensionCableLogistics;