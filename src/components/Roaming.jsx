import React from 'react'
import { assets } from '../assets/assets';

const Roaming = ({lineups, setLineups}) => {
  
      const updateLineup = (index, field, value) => {
        setLineups((prev) =>
          prev.map((lineups, i) =>
            i === index ? { ...lineups, [field]: value } : lineups
          )
        );
      };
     
  return (
    <div className="col-span-2">
    <div className="flex flex-row items-center py-1 gap-2">
      <img
        src={assets.roaming_icon}
        className="w-7 h-7"
        alt="Changing Room Icon"
      />
      <label className="mt-2">Is This A Roaming lineups?</label>
    </div>

    <div className="flex flex-row items-center">
      {/* Toggle Switch */}
      <div
        className={`toggle ${lineups.roaming ? "on" : "off"}`}
        onClick={() =>
          updateLineup(0, "roaming", !lineups[0].roaming)
        }
        style={{
          cursor: "pointer",
          display: "inline-block",
          width: "60px",
          height: "30px",
          borderRadius: "15px",
          backgroundColor: lineups.roaming ? "#ff6667" : "#ccc",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "5px",
            left: lineups.roaming ? "30px" : "5px",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            backgroundColor: "white",
            transition: "left 0.2s",
          }}
        ></div>
      </div>

   
      <div className="px-4 mt-1">
        <span className="mt-1">
          {lineups.roaming ? "Yes" : "No"}
        </span>
      </div>
    </div>
  </div>

  )
}

export default Roaming
