import React, { useState } from "react";

const StandardPerformanceSets = ({
  numberOfSets,
  setNumberOfSets,
  lengthOfSets,
  setLengthOfSets,
  minimumIntervalLength,
  setMinimumIntervalLength,
}) => {

  return (
    <div>
      <p className="font-semibold mt-6 ">Standard Performance Sets</p>

      <div className="flex flex-col gap-4">
        {/* First Row */}
        <div className="flex gap-6">
          <div className="flex-1">
            <label className="text-sm">Number of Sets</label>
            <input
              type="number"
              placeholder="e.g. 3"
              className="w-full px-3 py-2 border"
              value={numberOfSets[0] || ""}
              onChange={(e) => {
                const updatedSets = [...numberOfSets];
                updatedSets[0] = e.target.value;
                setNumberOfSets(updatedSets);
              }}
            />
          </div>
          <div>
            <p className="py-8">X</p>
          </div>

          <div className="flex-1">
            <label className="text-sm">Length of Sets (mins)</label>
            <input
              type="number"
              placeholder="e.g. 40"
              className="w-full px-3 py-2 border"
              value={lengthOfSets[0] || ""}
              onChange={(e) => {
                const updatedLengths = [...lengthOfSets];
                updatedLengths[0] = e.target.value;
                setLengthOfSets(updatedLengths);
              }}
            />
          </div>
          <div>
            <p className="py-8 text-sm">with a minimum break of</p>
          </div>

          <div className="flex-1">
            <label className="text-sm">Break (mins)</label>
            <input
              type="number"
              placeholder="e.g. 15"
              className="w-full px-3 py-2 border"
              value={minimumIntervalLength[0] || ""}
              onChange={(e) => {
                const updatedIntervals = [...minimumIntervalLength];
                updatedIntervals[0] = e.target.value;
                setMinimumIntervalLength(updatedIntervals);
              }}
            />
          </div>
        </div>

        <div className="flex justify-left mt-[-20px]">
          <p className="text-center">OR</p>
        </div>

        {/* Second Row */}
        <div className="flex gap-6">
          <div className="flex-1">
            <input
              type="number"
              placeholder="e.g. 2"
              className="w-full px-3 py-2 border"
              value={numberOfSets[1] || ""}
              onChange={(e) => {
                const updatedSets = [...numberOfSets];
                updatedSets[1] = e.target.value;
                setNumberOfSets(updatedSets);
              }}
            />
          </div>
          <div>
            <p className="py-2">X</p>
          </div>

          <div className="flex-1">
            <input
              type="number"
              placeholder="e.g. 60"
              className="w-full px-3 py-2 border"
              value={lengthOfSets[1] || ""}
              onChange={(e) => {
                const updatedLengths = [...lengthOfSets];
                updatedLengths[1] = e.target.value;
                setLengthOfSets(updatedLengths);
              }}
            />
          </div>

          <div>
            <p className="py-2 text-sm">with a minimum break of</p>
          </div>

          <div className="flex-1">
            <input
              type="number"
              placeholder="e.g. 30"
              className="w-full px-3 py-2 border"
              value={minimumIntervalLength[1] || ""}
              onChange={(e) => {
                const updatedIntervals = [...minimumIntervalLength];
                updatedIntervals[1] = e.target.value;
                setMinimumIntervalLength(updatedIntervals);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandardPerformanceSets;