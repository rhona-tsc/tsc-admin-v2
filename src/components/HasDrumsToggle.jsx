import React from "react";

const coerceBool = (v) => {
  if (Array.isArray(v)) return Boolean(v[0]); // ✅ [true] -> true
  if (v === "true") return true;
  if (v === "false") return false;
  return !!v;
};

const HasDrumsToggle = ({ lineup, lineupIndex, setLineups }) => {
  const updateLineup = (field, value) => {
    const nextVal = coerceBool(value);
    setLineups((prev) =>
      prev.map((item, i) =>
        i === lineupIndex ? { ...item, [field]: nextVal } : item
      )
    );
  };

  const isEnabled = coerceBool(lineup?.hasDrums);

  return (
    <div className="grid grid-cols-3 items-center gap-x-2 gap-y-3 mb-4">
      <label className="col-span-1">
        Does this lineup usually have drums in it?
      </label>

      <div className="col-span-1 flex justify-center items-center gap-2 h-full">
        <div
          className={`toggle ${isEnabled ? "on" : "off"}`}
          onClick={() => updateLineup("hasDrums", !isEnabled)}
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

      <div className="col-span-1" />
    </div>
  );
};

export default HasDrumsToggle;