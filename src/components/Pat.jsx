import React from "react";
import { assets } from "../assets/assets";

// ✅ Format ISO/Date string to "yyyy-MM-dd" for <input type="date" />
const formatDateForInput = (date) => {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
};

const Pat = ({ patCert, setPatCert, patExpiry, setPatExpiry, patFile, setPatFile, tscName }) => {
  const handlePatUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const renamed = new File([file], `PAT_${tscName || "band"}_${Date.now()}.pdf`, { type: file.type });

    const formData = new FormData();
    formData.append("file", renamed);
    formData.append("upload_preset", "ml_default");
    formData.append("folder", "patCertificates");

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dvcgr3fyd/raw/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        setPatFile(data.secure_url);
      }
    } catch (err) {
      console.error("❌ PAT upload failed:", err);
    }
  };

  return (
    <div>
      <p className="font-semibold mt-5">Portable Appliance Test (PAT) Certificate</p>
      <div className="flex items-center gap-6 mt-2">
        <p>Do you have a PAT certificate?</p>
        <div
          className={`toggle ${patCert ? "on" : "off"}`}
          onClick={() => setPatCert((prev) => !prev)}
          style={{
            cursor: "pointer",
            display: "inline-block",
            width: "48px",
            height: "30px",
            borderRadius: "15px",
            backgroundColor: patCert ? "#ff6667" : "#ccc",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "5px",
              left: patCert ? "24px" : "5px",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              backgroundColor: "white",
              transition: "left 0.2s",
            }}
          />
        </div>
        <span>{patCert ? "Yes" : "No"}</span>
      </div>

      {patCert && (
        <div className="flex items-center gap-6 mt-4">
          <div className="w-1/2">
            <p className="mb-2 text-sm">Expiry:</p>
            <input
              type="date"
              onChange={(e) => setPatExpiry(e.target.value)}
              className="px-3 py-2 w-full"
              value={formatDateForInput(patExpiry)}
            />
          </div>

          <div className="w-1/4">
            <p className="mb-2 text-sm">Upload a copy:</p>
            <label
              className={`block w-full px-3 py-2 border rounded text-center cursor-pointer shadow-sm transition ${
                patFile ? "bg-black text-white border-black" : "bg-black hover:bg-[#ff6667] border-gray-300"
              }`}
            >
              {patFile ? (
                <div className="flex items-center justify-start gap-3 text-xs">
                  <img src={assets.white_tick_icon} alt="tick" className="w-4 h-4" />
                  <div className="flex flex-col text-left">
                    <span>
                      Selected file: {patFile?.split("/").pop()?.slice(0, 12)}...
                    </span>
                    <span className="text-[10px] text-white">Click to change</span>
                  </div>
                </div>
              ) : (
                <span className="text-sm text-white">Choose File</span>
              )}
              <input type="file" onChange={handlePatUpload} className="hidden" />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pat;