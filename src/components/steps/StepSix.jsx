import React from "react";
import ExtrasPricing from "../ExtrasPricing";
import CeremonySets from "../CeremonySets";

const StepSix = ({
  useMURates,
  setUseMURates,
  isChanged,
  extras,
  setExtras,
  lineups,
  setLineups,
}) => {
  const hasExtrasChanges = isChanged("extras") || isChanged("useMURates");
          console.log("🧪 Lineups passed to CeremonySets:", lineups);


  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Extras Pricing</h2>
      <p className="text-gray-600 mb-4">
        Add any additional fees related to your act – e.g., extra vocalists, speedy setup, rider items, or extended sets.
      </p>

      

      <div className={hasExtrasChanges ? "border-l-4 border-yellow-400 pl-4" : ""}>
        <ExtrasPricing
          useMURates={useMURates}
          setUseMURates={setUseMURates}
          lineups={lineups}
          extras={extras}
          setExtras={setExtras}
        />
      </div>

      <div className={isChanged("ceremonySets") ? "border-l-4 border-yellow-400 pl-4" : ""}>
        <CeremonySets
          lineups={lineups}
          setLineups={setLineups}
        />
      </div>
    </div>
  );
};

export default StepSix;