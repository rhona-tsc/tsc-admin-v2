import React from 'react'

const VatRegistered = ({ vatRegistered, setVatRegistered }) => {    
  return (

    <div className="flex flex-col gap-2 mt-5">
    <label className="flex flex-col gap-2">
      <p className="font-semibold">VAT Registered</p>
  
      <div className="flex items-center gap-6">
        <p>Are you VAT Registered?</p>
        <div
          className={`toggle ${vatRegistered ? "on" : "off"}`}
          onClick={() => setVatRegistered((prev) => !prev)}
          style={{
            cursor: "pointer",
            display: "inline-block",
            width: "60px",
            height: "30px",
            borderRadius: "15px",
            backgroundColor: vatRegistered ? "#ff6667" : "#ccc",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "5px",
              left: vatRegistered ? "30px" : "5px",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              backgroundColor: "white",
              transition: "left 0.2s",
            }}
          ></div>
        </div>
        <span style={{ display: "inline-block", width: "30px" }}>
          {vatRegistered ? "Yes" : "No"}
        </span>
      </div>
    </label>
  </div>
  )
}

export default VatRegistered;