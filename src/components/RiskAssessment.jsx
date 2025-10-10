import React, { useState } from "react";
import { assets } from "../assets/assets";

const RiskAssessment = ({
  usesGenericRiskAssessment,
  setUsesGenericRiskAssessment,
  riskAssessment,
  setRiskAssessment,
}) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    console.log("📂 Selected file:", file);

    if (!file) {
      console.warn("⚠️ No file selected.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ml_default");
    formData.append("folder", "riskAssessments");

    try {
      console.log("⬆️ Uploading to Cloudinary...");
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dvcgr3fyd/raw/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      console.log("✅ Cloudinary response:", data);

      if (data.secure_url) {
        setRiskAssessment(data.secure_url);
        console.log("📎 File uploaded to:", data.secure_url);
      } else {
        console.error("❌ No secure_url in response:", data);
      }
    } catch (err) {
      console.error("❌ Risk assessment upload failed:", err);
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  return (
    <div className="w-full mt-5">
      <p className="font-semibold">Risk Assessment</p>
   

      <div className="flex items-center gap-4 mb-4">
      <p className="mb-2 mt-2 text-sm">
        Would you like to use our generic risk assessment, or upload your own?
      </p>
        <div
          className={`toggle ${usesGenericRiskAssessment ? "on" : "off"}`}
          onClick={() => {
            setUsesGenericRiskAssessment((prev) => !prev);
            console.log("🔄 Toggled to:", !usesGenericRiskAssessment);
          }}
          style={{
            cursor: "pointer",
            display: "inline-block",
            width: "60px",
            height: "30px",
            borderRadius: "15px",
            backgroundColor: "#ff6667",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "5px",
              left: usesGenericRiskAssessment ? "5px" : "30px",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              backgroundColor: "white",
              transition: "left 0.2s",
            }}
          />
        </div>
        <span>{!usesGenericRiskAssessment ? "Upload Our Own" : "Use A Generic One"}</span>
      </div>

      {usesGenericRiskAssessment ? (
        <div>
          <a
            href="https://drive.google.com/uc?export=download&id=1f67ANs0WBFB2Q9Fi54U1-HRYM66cVgaO"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Download Generic Risk Assessment
          </a>
          <p className="mt-2 text-sm text-gray-600">
            Please familiarise yourself with this risk assessment and adhere to the advisements provided.
          </p>
        </div>
      ) : (
        <div className="w-1/4">
          <p className="mb-2 text-sm">Upload your file:</p>
          <label
            htmlFor="risk-upload"
            className={`block w-full px-3 py-2 border rounded text-center cursor-pointer shadow-sm transition ${
              riskAssessment
                ? "bg-black text-white border-black"
                : "bg-black hover:bg-[#ff6667] border-gray-300"
            }`}
          >
            {riskAssessment ? (
              <div className="flex items-center justify-start gap-3 text-xs">
                <img
                  src={assets.white_tick_icon}
                  alt="tick"
                  className="w-4 h-4"
                />
                <div className="flex flex-col text-left">
                  Selected file: {riskAssessment?.split("/").pop()?.slice(0, 12)}...
                  <span className="text-[10px] text-white">Click to change</span>
                </div>
              </div>
            ) : (
              <span className="text-sm text-white">Choose File</span>
            )}
            <input
              id="risk-upload"
              type="file"
              onChange={handleUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
            />
          </label>

          {uploading && (
            <p className="text-sm text-gray-500 mt-2 animate-pulse">
              Uploading...
            </p>
          )}

          {riskAssessment && (
            <a
              href={riskAssessment}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline text-xs mt-2 inline-block"
            >
              View uploaded file
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default RiskAssessment;