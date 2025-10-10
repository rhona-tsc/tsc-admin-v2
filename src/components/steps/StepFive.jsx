import React from "react";
import TravelFeeCalculator from "../TravelFeeCalculator";

const StepFive = ({
  useCountyTravelFee,
  setUseCountyTravelFee,
  countyFees,
  setCountyFees,
  costPerMile,
  setCostPerMile,
  useMUTravelRates,
  setUseMUTravelRates,
  lineups,
  setLineups,
  isChanged,
}) => {
  const hasTravelChanges =
    isChanged("useCountyTravelFee") ||
    isChanged("countyFees") ||
    isChanged("costPerMile") ||
    isChanged("useMUTravelRates");

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold mb-4">Step 5: Travel</h2>
      <div className={hasTravelChanges ? "border-l-4 border-yellow-400 pl-4" : ""}>
        <TravelFeeCalculator
          useCountyTravelFee={useCountyTravelFee}
          setUseCountyTravelFee={setUseCountyTravelFee}
          countyFees={countyFees}
          setCountyFees={setCountyFees}
          costPerMile={costPerMile}
          setCostPerMile={setCostPerMile}
          useMUTravelRates={useMUTravelRates}
          setUseMUTravelRates={setUseMUTravelRates}
          lineups={lineups}
          setLineups={setLineups}
        />
      </div>
    </div>
  );
};

export default StepFive;