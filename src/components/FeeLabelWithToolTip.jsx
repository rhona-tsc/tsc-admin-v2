import { useState } from "react";
import { assets } from "../assets/assets";

const FeeLabelWithTooltip = () => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <label className="flex items-center gap-2 font-medium">
        Fee (£)
        <span
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="text-gray-500 cursor-pointer"
        >
         <img src={assets.info_icon} className="w-4 h-4"/>
        </span>
      </label>

      {showTooltip && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-black text-white text-xs rounded px-3 py-2 shadow-lg w-max max-w-xs">
          Please provide your rate for 7 hours on site, e.g. 5pm to midnight
        </div>
      )}
    </div>
  );
};

export default FeeLabelWithTooltip;