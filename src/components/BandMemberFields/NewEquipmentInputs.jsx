import React from "react";
import assets from "../../assets/assets";

const NewEquipmentInputs = ({ equipmentItems, onChange, onAdd, onRemove }) => {
  return (
    <div className="space-y-2">
      {equipmentItems.map((item, index) => (
        <div key={index} className="grid grid-cols-8 gap-4 items-start">
          <div className="col-span-5">
            {index === 0 && (
              <label className="block text-sm font-medium mb-1">Equipment</label>
            )}
            <input
              type="text"
              value={item.equipment || ""}
              onChange={(e) => onChange(index, "equipment", e.target.value)}
              placeholder="e.g. PA Speaker"
              className="w-full px-2 py-2 border rounded text-sm"
            />
          </div>
          <div className="col-span-1">
            {index === 0 && (
              <label className="block text-sm font-medium mb-1">Quant.</label>
            )}
            <input
              type="text"
              value={item.quantity || ""}
              onChange={(e) => onChange(index, "quantity", e.target.value)}
      
              className="w-full px-2 py-2 border rounded text-sm"
            />
          </div>
          <div className="col-span-1">
            {index === 0 && (
              <label className="block text-sm font-medium mb-1">Watt.</label>
            )}
            <input
              type="text"
              value={item.wattage || ""}
              onChange={(e) => onChange(index, "wattage", e.target.value)}
     
              className="w-full px-2 py-2 border rounded text-sm"
            />
          </div>
          <div className={`col-span-1 ${index === 0 ? 'mt-6' : ''}`}>
            {index === equipmentItems.length - 1 ? (
              <button
                type="button"
                onClick={onAdd}
                className="px-2 py-2 bg-black text-white rounded hover:bg-[#ff6667]"
              >
                <img src={assets.white_add_icon} alt="Add" className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="px-2 py-2 text-white bg-black hover:bg-[#ff6667] rounded"
              >
                <img src={assets.white_cross_icon} alt="Remove" className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NewEquipmentInputs;
