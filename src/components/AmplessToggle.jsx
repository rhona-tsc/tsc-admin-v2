
import React from "react";

const AmplessToggle = ({ lineup, lineupIndex, setLineups }) => {
  const updateLineup = (field, value) => {
    setLineups((prev) =>
      prev.map((item, i) => (i === lineupIndex ? { ...item, [field]: value } : item))
    );
  };

  return (
    <div className="grid grid-cols-[auto_min-content] items-center gap-4 mb-4">
      <label className="block">
        Can this lineup perform ampless (i.e. direct input only)?
      </label>
      <div className="flex items-center gap-3 min-h-[40px]">
        <div
          className={`toggle ${lineup.ampless ? "on" : "off"}`}
          onClick={() => updateLineup("ampless", !lineup.ampless)}
          style={{
            cursor: "pointer",
            display: "inline-block",
            width: "60px",
            height: "30px",
            borderRadius: "15px",
            backgroundColor: lineup.ampless ? "#ff6667" : "#ccc",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "5px",
              left: lineup.ampless ? "30px" : "5px",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              backgroundColor: "white",
              transition: "left 0.2s",
            }}
          ></div>
        </div>
        <p>{lineup.ampless ? "Yes" : "No"}</p>
      </div>
    </div>
  );
};

export default AmplessToggle;

