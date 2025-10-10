import React from "react";

const MURatesToggle = ({ useMURatesForFees, updateBandMember, index, memberIndex }) => {
  return (
    <div className="col-span-2 flex flex-col justify-center">
      <label className="mb-1">
        Use {" "}
        <a
          href="https://musiciansunion.org.uk/working-performing/gigs-and-live-performances/live-engagement-rates-of-pay/national-gig-rates"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800"
        >
          MU Rates
        </a>{" "}
        ?
      </label>
      <div className="flex items-center gap-2 ml-8">
        <input
          type="checkbox"
          checked={useMURatesForFees}
          onChange={() =>
            updateBandMember(index, memberIndex, "useMURatesForFees", !useMURatesForFees)
          }
          className="w-4 h-4 accent-[#ff6667] cursor-pointer items-center mt-1 border-2 border-gray-300"
        />
      </div>
    </div>
  );
};

export default MURatesToggle;
