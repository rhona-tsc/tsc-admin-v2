import React, { useState } from 'react'

const Approved = () => {
      const [status, setStatus] = useState("pending");
    
  return (

   <div className="flex flex-col gap-2">
   <label className="flex flex-col gap-2">
     <p className="strong">Status</p>

     <div className="flex items-center gap-6">

       <p>Is the status approved?</p>
       <div
         className={`toggle ${status === "approved" ? "on" : "off"}`} 
         onClick={() =>
           setStatus((prev) => (prev === "approved" ? null : "approved"))
         } 
         style={{
           cursor: "pointer",
           display: "inline-block",
           width: "60px",
           height: "30px",
           borderRadius: "15px",
           backgroundColor: status === "approved" ? "#4CAF50" : "#ccc", 
           position: "relative",
         }}
       >
         <div
           style={{
             position: "absolute",
             top: "5px",
             left: status === "approved" ? "30px" : "5px",
             width: "20px",
             height: "20px",
             borderRadius: "50%",
             backgroundColor: "white",
             transition: "left 0.2s",
           }}
         ></div>
       </div>
       <span>{status === "approved" ? "Approved" : "Pending"}</span>{" "}

     </div>
   </label>
 </div>

  )
}

export default Approved
