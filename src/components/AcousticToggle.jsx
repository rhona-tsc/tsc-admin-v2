import React from "react";

const AcousticToggle = ({ lineup, lineupIndex, setLineups }) => {
  const updateLineup = (field, value) => {
    setLineups((prev) =>
      prev.map((item, i) => (i === lineupIndex ? { ...item, [field]: value } : item))
    );
  };

  return (
    <div className="grid grid-cols-[auto_min-content] items-center gap-4 mb-4">
      <label className="block">
        Can this lineup perform entirely acoustic?
      </label>
      <div className="flex items-center gap-3 min-h-[40px]">
        <div
          className={`toggle ${lineup.acoustic ? "on" : "off"}`}
          onClick={() => updateLineup("acoustic", !lineup.acoustic)}
          style={{
            cursor: "pointer",
            display: "inline-block",
            width: "60px",
            height: "30px",
            borderRadius: "15px",
            backgroundColor: lineup.acoustic ? "#ff6667" : "#ccc",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "5px",
              left: lineup.acoustic ? "30px" : "5px",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              backgroundColor: "white",
              transition: "left 0.2s",
            }}
          ></div>
        </div>
        <p>{lineup.acoustic ? "Yes" : "No"}</p>
      </div>
    </div>
  );
};

export default AcousticToggle;