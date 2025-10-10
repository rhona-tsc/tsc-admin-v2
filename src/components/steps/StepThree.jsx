import React from "react";
import StandardPerformanceSets from "../StandardPerformanceSets";
import PaAndLights from "../PaAndLights";
import Pat from "../Pat";
import Pli from "../Pli";
import RiskAssessment from "../RiskAssessment";
import VatRegistered from "../VatRegistered";
import Setlist from "../Setlist";
import OffRepertoireRequests from "../OffRepertoireRequests";

const StepThree = ({
  numberOfSets,
  setNumberOfSets,
  lengthOfSets,
  setLengthOfSets,
  minimumIntervalLength,
  setMinimumIntervalLength,
  paSystem,
  setPaSystem,
  setlist,
  setSetlist,
  offRepertoireRequests,
  setOffRepertoireRequests,
  lightingSystem,
  setLightingSystem,
  patCert,
  setPatCert,
  patExpiry,
  setPatExpiry,
  patFile,
  setPatFile,
  pli,
  setPli,
  pliAmount,
  setPliAmount,
  pliExpiry,
  setPliExpiry,
  pliFile,
  setPliFile,
  riskAssessment,
  setRiskAssessment,
  usesGenericRiskAssessment,
  setUsesGenericRiskAssessment,
  vatRegistered,
  setVatRegistered,
  isChanged
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Your Act's Specifics</h2>

      <div className={isChanged("numberOfSets") || isChanged("lengthOfSets") || isChanged("minimumIntervalLength") ? "border-l-4 border-yellow-400 pl-4" : ""}>
        <StandardPerformanceSets
          numberOfSets={numberOfSets}
          setNumberOfSets={setNumberOfSets}
          lengthOfSets={lengthOfSets}
          setLengthOfSets={setLengthOfSets}
          minimumIntervalLength={minimumIntervalLength}
          setMinimumIntervalLength={setMinimumIntervalLength}
        />
      </div>

      <div className={isChanged("paSystem") || isChanged("lightingSystem") ? "border-l-4 border-yellow-400 pl-4" : ""}>
        <PaAndLights
          paSystem={paSystem}
          setPaSystem={setPaSystem}
          lightingSystem={lightingSystem}
          setLightingSystem={setLightingSystem}
        />
      </div>

      <div className={isChanged("setlist") ? "border-l-4 border-yellow-400 pl-4" : ""}>
        <Setlist
          setlist={setlist}
          setSetlist={setSetlist}
        />
      </div>

      <div className={isChanged("offRepertoireRequests") ? "border-l-4 border-yellow-400 pl-4" : ""}>
        <OffRepertoireRequests
          offRepertoireRequests={offRepertoireRequests}
          setOffRepertoireRequests={setOffRepertoireRequests}
        />
      </div>





      <div className={isChanged("patCert") || isChanged("patExpiry") ? "border-l-4 border-yellow-400 pl-4" : ""}>
        <Pat
          patCert={patCert}
          setPatCert={setPatCert}
          patExpiry={patExpiry}
          setPatExpiry={setPatExpiry}
          patFile={patFile}
          setPatFile={setPatFile}
        />
      </div>

      <div className={isChanged("pli") || isChanged("pliAmount") || isChanged("pliExpiry") ? "border-l-4 border-yellow-400 pl-4" : ""}>
        <Pli
          pli={pli}
          setPli={setPli}
          pliAmount={pliAmount}
          setPliAmount={setPliAmount}
          pliExpiry={pliExpiry}
          setPliExpiry={setPliExpiry}
          pliFile={pliFile}
          setPliFile={setPliFile}
        />
      </div>

      <div className={isChanged("riskAssessment") || isChanged("usesGenericRiskAssessment") ? "border-l-4 border-yellow-400 pl-4" : ""}>
        <RiskAssessment
          riskAssessment={riskAssessment}
          setRiskAssessment={setRiskAssessment}
          usesGenericRiskAssessment={usesGenericRiskAssessment}
          setUsesGenericRiskAssessment={setUsesGenericRiskAssessment}
        />
      </div>

      <div className={isChanged("vatRegistered") ? "border-l-4 border-yellow-400 pl-4" : ""}>
        <VatRegistered
          vatRegistered={vatRegistered}
          setVatRegistered={setVatRegistered}
        />
      </div>
    </div>
  );
};

export default StepThree;