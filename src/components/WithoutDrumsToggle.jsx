import React from "react";

const WithoutDrumsToggle = ({ lineup, lineupIndex, setLineups }) => {
  const updateLineup = (field, value) => {
    setLineups((prev) =>
      prev.map((item, i) => (i === lineupIndex ? { ...item, [field]: value } : item))
    );
  };

  if (!lineup?.hasDrums) return null;

  return (
    <div className="grid grid-cols-3 items-center gap-x-2 gap-y-3 mb-4">
      {/* Label */}
      <label className="col-span-1">
        Can this lineup perform without drums?
      </label>

      {/* Toggle + Yes/No */}
      <div className="col-span-1 flex justify-center items-center gap-2 h-full">
        <div
          className={`toggle ${lineup.withoutDrums ? "on" : "off"}`}
          onClick={() => updateLineup("withoutDrums", !lineup.withoutDrums)}
          style={{
            cursor: "pointer",
            width: "60px",
            height: "30px",
            borderRadius: "15px",
            backgroundColor: lineup.withoutDrums ? "#ff6667" : "#ccc",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "5px",
              left: lineup.withoutDrums ? "30px" : "5px",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              backgroundColor: "white",
              transition: "left 0.2s",
            }}
          />
        </div>
        <span>{lineup.withoutDrums ? "Yes" : "No"}</span>
      </div>

      {/* Placeholder column */}
      <div className="col-span-1" />
    </div>
  );
};

export default WithoutDrumsToggle;