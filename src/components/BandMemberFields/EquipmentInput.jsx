import React from "react";
import { assets } from "../../assets/assets";

const EquipmentInput = ({
  equipment,
  index,
  isLast,
  updateAdditionalEquipment,
  removeAdditionalEquipment,
  addAdditionalEquipment,
  OTHER_EQUIPMENT,
  lineupIndex,
  memberIndex,
  updateBandMember,
  member
}) => {
  return (
    <div className="grid grid-cols-8 items-start gap-4 w-full">
      {/* Equipment dropdown or custom input */}
      <div className="col-span-4 mb-4">
      <label className="block ">Equipment</label>
  
      {equipment.equipment === "Other" ? (    
        <input
          type="text"
          placeholder="Enter your equipment"
          value={equipment.customEquipment || ""}
          onChange={(e) => {
            const value = e.target.value;
            updateAdditionalEquipment(
              lineupIndex,
              memberIndex,
              index,
              "customEquipment",
              value
            );
            if (value.trim() === "") {
              updateAdditionalEquipment(
                lineupIndex,
                memberIndex,
                index,
                "equipment",
                ""
              );
            }
          }}          className="w-full px-2 py-2 border text-sm"

        />
      ) : (
        <select
          className="w-full px-2 py-2 border rounded text-sm"
          value={equipment.equipment || ""}
          onChange={(e) => {
            const selectedEquipment = e.target.value;
            console.log("Equipment changed to:", selectedEquipment);
            updateAdditionalEquipment(
              lineupIndex,
              memberIndex,
              index,
              "equipment",
              selectedEquipment
            );

            if (selectedEquipment === "Other") {
              updateAdditionalEquipment(
                lineupIndex,
                memberIndex,
                index,
                "customEquipment",
                ""
              );
            }
          }}
        >
          {console.log("Dropdown selected value:", equipment.equipment)}
          <option value="">Select equipment</option>
          {OTHER_EQUIPMENT.map((eq) => (
            <option key={eq} value={eq}>
              {eq}
            </option>
          ))}
          <option value="Other">Other</option>
        </select>
      )}
      </div>

      {/* Wattage input */}
      <div className="col-span-1">
        <label>Wattage</label>
        <input
          type="text"
          value={equipment.wattage || ""}
          onChange={(e) => {
            let inputValue = e.target.value.replace(/[^0-9.]/g, "");
            if ((inputValue.match(/\./g) || []).length > 1)
              inputValue = inputValue.slice(0, -1);
            if (inputValue.startsWith(".")) inputValue = "";
            updateAdditionalEquipment(
              lineupIndex,
              memberIndex,
              index,
              "wattage",
              inputValue
            );
          }}
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      {/* Quantity input */}
      <div className="col-span-1">
        <label>Quantity</label>
        <input
          type="text"
          value={equipment.quantity || ""}
          onChange={(e) => {
            let inputValue = e.target.value.replace(/[^0-9.]/g, "");
            if ((inputValue.match(/\./g) || []).length > 1)
              inputValue = inputValue.slice(0, -1);
            if (inputValue.startsWith(".")) inputValue = "";
            updateAdditionalEquipment(
              lineupIndex,
              memberIndex,
              index,
              "quantity",
              inputValue
            );
          }}
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      {/* Add or Remove Button */}
      <div className="col-span-2 flex justify-center">
        {isLast ? (
          <button
            type="button"
            onClick={addAdditionalEquipment}
            className="px-2 py-2 bg-black text-white rounded hover:bg-[#ff6667] transition mt-6 text-sm"
          >
            <img src={assets.white_add_icon} alt="Add" className="w-5 h-5 " />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => removeAdditionalEquipment(index)}
            className="px-2 py-2 bg-black text-white rounded hover:bg-[#ff6667] transition text-sm mt-6"
          >
            <img src={assets.cross_icon} alt="Remove" className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default EquipmentInput;