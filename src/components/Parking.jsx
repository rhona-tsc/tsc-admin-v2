import React from "react";

const Parking = ({ lineup, index, setLineups }) => {
  const updateLineup = (field, value) => {
    setLineups((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const parkingCount = lineup.parking || 0;
  const isEnabled = parkingCount > 0;

  return (
    <div className="grid grid-cols-3 items-center gap-4 mb-4">
      <label className="block">Does this lineup require any parking spaces?</label>

      <div className="col-span-1 flex justify-center items-center gap-2 h-full">
        <div
          className={`toggle ${isEnabled ? "on" : "off"}`}
          onClick={() => updateLineup("parking", isEnabled ? 0 : 1)}
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

      <input
        type="number"
        min="0"
        placeholder="How many?"
        value={parkingCount}
        onChange={(e) =>
          updateLineup("parking", parseInt(e.target.value) || 0)
        }
        className={`px-3 py-2 border rounded w-full transition-all duration-300 ${
          isEnabled ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
    </div>
  );
};

export default Parking;