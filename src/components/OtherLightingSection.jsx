import React, { useEffect, useState } from "react";

const OtherLightingSection = ({ equipment_spec, updateSpec }) => {
  const [otherLighting, setOtherLighting] = useState(equipment_spec.other_lighting || []);

  useEffect(() => {
    setOtherLighting(equipment_spec.other_lighting || []);
  }, [equipment_spec.other_lighting]);

  const handleChange = (index, field, value) => {
    const updated = [...otherLighting];
    updated[index][field] = value;
    setOtherLighting(updated);
    const filtered = updated.filter(
      (item) => item.name && item.quantity > 0 && item.wattage > 0
    );
    updateSpec('other_lighting', filtered);
  };

  const handleAdd = () => {
    console.log("➕ Add clicked");
    const updated = [...otherLighting, { name: "", wattage: "", quantity: "" }];
    setOtherLighting(updated);
    const filtered = updated.filter(
      (item) => item.name && item.quantity > 0 && item.wattage > 0
    );
    updateSpec('other_lighting', filtered);
  };

  return (
    <div className="mt-6">
      <h3 className="font-semibold text-md mb-2">Other Lighting</h3>
      {otherLighting.map((item, index) => (
  <div key={index} className="flex gap-4 mb-2">
    <input
      type="text"
      placeholder="Name"
      value={item.name}
      onChange={(e) => handleChange(index, "name", e.target.value)}
      className="border rounded px-2 py-1 w-1/2"
    />
    <input
      type="text"
      placeholder="Wattage"
      value={item.wattage}
      onChange={(e) => handleChange(index, "wattage", e.target.value)}
      className="border rounded px-2 py-1 w-[10%]"
    />
    <input
      type="number"
      placeholder="Qty"
      value={item.quantity || ""}
      onChange={(e) => handleChange(index, "quantity", Number(e.target.value))}
      className="border rounded px-2 py-1 w-[10%]"
    />
  </div>
))}
      <button
        type="button"
        onClick={handleAdd}
        className="text-sm text-blue-600 underline"
      >
        + Add
      </button>
    </div>
  );
};

export default OtherLightingSection;