import React from "react";

const AnotherVocalistToggle = ({ lineup, lineupIndex, setLineups }) => {
  const updateLineup = (field, value) => {
    setLineups((prev) =>
      prev.map((item, i) => (i === lineupIndex ? { ...item, [field]: value } : item))
    );
  };

  return (
    <div className="grid grid-cols-[auto_min-content] items-center gap-4 mb-4">
      <label className="block">
        Can the client add a vocalist (or another vocalist) to your act?
      </label>
      <div className="flex items-center gap-3 min-h-[40px]">
        <div
          className={`toggle ${lineup.anotherVocalist ? "on" : "off"}`}
          onClick={() =>
            updateLineup("anotherVocalist", !lineup.anotherVocalist)
          }
          style={{
            cursor: "pointer",
            width: "60px",
            height: "30px",
            borderRadius: "15px",
            backgroundColor: lineup.anotherVocalist ? "#ff6667" : "#ccc",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "5px",
              left: lineup.anotherVocalist ? "30px" : "5px",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              backgroundColor: "white",
              transition: "left 0.2s",
            }}
          ></div>
        </div>
        <p>{lineup.anotherVocalist ? "Yes" : "No"}</p>
      </div>
    </div>
  );
};

export default AnotherVocalistToggle;