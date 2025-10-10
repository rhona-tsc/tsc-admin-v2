import React from "react";

const CoverOverhead = ({ lineup, index, setLineups }) => {
  const updateLineup = (field, value) => {
    setLineups((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  return (
<div className="grid grid-cols-[auto_min-content] items-center gap-4 mb-4">
<label className="block">Does this lineup require cover overhead?</label>
      <div className="flex items-center gap-3 min-h-[40px]">
        <div
          className={`toggle ${lineup.coverOverhead ? "on" : "off"} mt-2`}
          onClick={() => updateLineup("coverOverhead", !lineup.coverOverhead)}
          style={{
            cursor: "pointer",
            display: "inline-block",
            width: "60px",
            height: "30px",
            borderRadius: "15px",
            backgroundColor: lineup.coverOverhead ? "#ff6667" : "#ccc",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "5px",
              left: lineup.coverOverhead ? "30px" : "5px",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              backgroundColor: "white",
              transition: "left 0.2s",
            }}
          ></div>
        </div>        <p>{lineup.coverOverhead ? "Yes" : "No"}</p>

      </div>
    </div>
  );
};

export default CoverOverhead;