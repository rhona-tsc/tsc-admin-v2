import React from "react";

const DepFiveDjEquipmentCategories = ({
  formData = {},
  setFormData = () => {},
}) => {
  const updateField = (field, value) => {
    const updatedArray = formData.djEquipmentCategories?.length
      ? [...formData.djEquipmentCategories]
      : [
          {
            hasDjTable: false,
            hasDjBooth: false,
            hasMixingConsole: false,
            hasCdjs: false,
            hasVinylDecks: false,
          },
        ];

    updatedArray[0][field] = value;
    setFormData({ ...formData, djEquipmentCategories: updatedArray });
  };

  const djEquipment = formData.djEquipmentCategories?.[0] || {
    hasDjTable: false,
    hasDjBooth: false,
    hasMixingConsole: false,
    hasCdjs: false,
    hasVinylDecks: false,
  };

  return (
    <div className="flex flex-col gap-8 max-w-[100%]">
      <div className="flex flex-col gap-3 w-full">
        <h2 className="font-semibold text-lg mt-6">My DJ Setup</h2>
        <p className="text-sm text-gray-600">
          Please indicate below which pieces of DJ equipment you have and are able to transport.
        </p>
        <div className="grid grid-cols-1 gap-4 mb-3 w-[30%]">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-600">
              DJ Table
            </label>
            <input
              type="checkbox"
              checked={djEquipment.hasDjTable}
              onChange={(e) => updateField("hasDjTable", e.target.checked)}
              className="p-2 border rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              DJ Booth
            </label>
            <input
              type="checkbox"
              checked={djEquipment.hasDjBooth}
              onChange={(e) => updateField("hasDjBooth", e.target.checked)}
              className="p-2 border rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Digital Mixing Console
            </label>
            <input
              type="checkbox"
              checked={djEquipment.hasMixingConsole}
              onChange={(e) => updateField("hasMixingConsole", e.target.checked)}
              className="p-2 border rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              CDJs
            </label>
            <input
              type="checkbox"
              checked={djEquipment.hasCdjs}
              onChange={(e) => updateField("hasCdjs", e.target.checked)}
              className="p-2 border rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Vinyl Decks
            </label>
            <input
              type="checkbox"
              checked={djEquipment.hasVinylDecks}
              onChange={(e) => updateField("hasVinylDecks", e.target.checked)}
              className="p-2 border rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepFiveDjEquipmentCategories;