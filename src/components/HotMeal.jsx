import React from "react";

const HotMeal = ({ lineup, index, setLineups }) => {
  const updateLineup = (field, value) => {
    setLineups((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const hotMealCount = lineup.hotMeal || 0;
  const isEnabled = hotMealCount > 0;

  return (
    <div className="grid grid-cols-3 items-center gap-x-2 gap-y-3 mb-4">
      {/* Label */}
      <label className="col-span-1">Does this lineup require hot meals?</label>

      {/* Toggle */}
      <div className="col-span-1 flex justify-center items-center gap-2 h-full">
        <div
          className={`toggle ${isEnabled ? "on" : "off"}`}
          onClick={() => updateLineup("hotMeal", isEnabled ? 0 : 1)}
          style={{
            cursor: "pointer",
            width: "60px",
            height: "30px",
            borderRadius: "15px",
            backgroundColor: isEnabled ? "#ff6667" : "#ccc",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "5px",
              left: isEnabled ? "30px" : "5px",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              backgroundColor: "white",
              transition: "left 0.2s",
            }}
          />
        </div>
        <span>{isEnabled ? "Yes" : "No"}</span>
      </div>

      {/* Input */}
      <div className="col-span-1">
        <input
          type="number"
          min="0"
          placeholder="How many?"
          value={hotMealCount}
          onChange={(e) =>
            updateLineup("hotMeal", parseInt(e.target.value) || 0)
          }
          className={`w-full px-3 py-2 border rounded transition-all duration-300 ${
            isEnabled ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />
      </div>
    </div>
  );
};

export default HotMeal;