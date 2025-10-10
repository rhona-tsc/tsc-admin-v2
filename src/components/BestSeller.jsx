import React, { useState } from 'react'

const BestSeller = () => {

      const [bestseller, setBestseller] = useState(false);
    
  return (
    <div className="flex flex-col gap-2">
    <label className="flex flex-col gap-2">
      <p className="strong">Bestseller</p>

      <div className="flex items-center gap-6">
      
        <p>Is this a Bestseller?</p>
        <div
          className={`toggle ${bestseller ? "on" : "off"}`} // Use `bestseller` state here
          onClick={() => setBestseller((prev) => !prev)} // Toggle the state like PLI and PAT
          style={{
            cursor: "pointer",
            display: "inline-block",
            width: "60px",
            height: "30px",
            borderRadius: "15px",
            backgroundColor: bestseller ? "#ff6667" : "#ccc", // Visual color change
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "5px",
              left: bestseller ? "30px" : "5px", // Position the circle based on the state
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              backgroundColor: "white",
              transition: "left 0.2s", // Smooth transition for sliding effect
            }}
          ></div>
        </div>
        <span>{bestseller ? "Yes" : "No"}</span>
      </div>
      </label>
      </div>
  )
}

export default BestSeller
