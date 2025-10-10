import React from "react";
import LineupsComponent from "../LineupsComponent";

const StepFour = ({ lineups, setLineups, isChanged, markChanged, selectedSongs, actGenres }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Step 4: Your Lineups & Performance Fees</h2>
      <p className="text-sm text-gray-600 mb-4">
        Define the different lineup configurations your act offers (e.g., 4-piece, 6-piece), and their associated performance fees.
      </p>

      <div className={isChanged("lineups") || isChanged("extras") ? "border-l-4 border-yellow-400 pl-4" : ""}>
        <LineupsComponent
          lineups={lineups}
          setLineups={setLineups}
          selectedSongs={selectedSongs}
          actGenres={actGenres}   
        />
      </div>
    </div>
  );
};

export default StepFour;