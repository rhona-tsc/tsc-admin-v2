import React, { useState } from "react";
import { assets } from "../assets/assets";

const OtherRequests = ({ lineup, index, setLineups }) => {
  const [input, setInput] = useState("");

  const updateLineup = (field, value) => {
    setLineups((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const updateRiderItem = (riderIndex, value) => {
    const updated = Array.isArray(lineup.rider) ? [...lineup.rider] : [];
    updated[riderIndex] = value;
    updateLineup("rider", updated);
  };

  const removeRider = (riderIndex) => {
    const updated = (lineup.rider || []).filter((_, i) => i !== riderIndex);
    updateLineup("rider", updated);
  };

  const handleAddRider = () => {
    if (!input.trim()) return;
    const updated = [...(lineup.rider || []), input.trim()];
    updateLineup("rider", updated);
    setInput("");
  };

  const requiresOtherRequests = lineup.requiresOtherRequests ?? false;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 items-center gap-4">
        <label className="block">
          Does this lineup have any other rider requests?
        </label>

        <div className="col-span-1 flex justify-center items-center gap-2 h-full">
          <div
            className={`toggle ${requiresOtherRequests ? "on" : "off"}`}
            onClick={() => updateLineup("requiresOtherRequests", !requiresOtherRequests)}
            style={{
              cursor: "pointer",
              width: "60px",
              height: "30px",
              borderRadius: "15px",
              backgroundColor: requiresOtherRequests ? "#ff6667" : "#ccc",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "5px",
                left: requiresOtherRequests ? "30px" : "5px",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                backgroundColor: "white",
                transition: "left 0.2s",
              }}
            />
          </div>
          <span className="text-sm text-gray-700">
            {requiresOtherRequests ? "Yes" : "No"}
          </span>
        </div>

        <div className="flex gap-2 items-center w-full">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add a request"
            onKeyDown={(e) => e.key === "Enter" && handleAddRider()}
            className={`px-3 py-2 border rounded w-full transition-all duration-300 ${
              requiresOtherRequests ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />
          {requiresOtherRequests && (
            <button
              type="button"
              onClick={handleAddRider}
              className="px-3 py-2 bg-black text-white rounded hover:bg-[#ff6667] transition"
            >
              Add
            </button>
          )}
        </div>
      </div>

      {requiresOtherRequests && (lineup.rider || []).length > 0 && (
        <div className="space-y-2">
          {lineup.rider.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={item}
                onChange={(e) => updateRiderItem(i, e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="Rider request"
              />
              <button
                type="button"
                onClick={() => removeRider(i)}
                className="p-2 hover:opacity-80 transition"
                title="Remove"
              >
                <img
                  src={assets.cross_icon}
                  alt="Remove"
                  className="w-5 h-5"
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OtherRequests;