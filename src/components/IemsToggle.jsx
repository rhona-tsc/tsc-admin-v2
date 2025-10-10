import React from "react";

const IemsToggle = ({ lineup, lineupIndex, setLineups }) => {
  const updateLineup = (field, value) => {
    setLineups((prev) =>
      prev.map((item, i) => (i === lineupIndex ? { ...item, [field]: value } : item))
    );
  };

  return (
    <div className="grid grid-cols-[auto_min-content] items-center gap-4 mb-4">
      <label>
        Can this lineup perform with in-ear-monitors (IEMs) only (i.e. no floor monitors)?
      </label>
      <div className="flex items-center gap-3 min-h-[40px]">
        <div
          className={`toggle ${lineup.iems ? "on" : "off"}`}
          onClick={() => updateLineup("iems", !lineup.iems)}
          style={{
            cursor: "pointer",
            width: "60px",
            height: "30px",
            borderRadius: "15px",
            backgroundColor: lineup.iems ? "#ff6667" : "#ccc",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "5px",
              left: lineup.iems ? "30px" : "5px",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              backgroundColor: "white",
              transition: "left 0.2s",
            }}
          ></div>
        </div>
        <p>{lineup.iems ? "Yes" : "No"}</p>
      </div>
    </div>
  );
};

export default IemsToggle;