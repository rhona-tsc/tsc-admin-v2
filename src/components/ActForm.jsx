import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import ImageUpload from "../components/ImageUpload";
import TravelFeeCalculator from "../components/TravelFeeCalculator";
import ExtrasPricing from "../components/ExtrasPricing";
import OriginalActName from "../components/OriginalActName";
import ActDescription from "../components/ActDescription";
import ActBio from "../components/ActBio";
import Genre from "../components/Genre";
import Mp3s from "../components/Mp3s";
import StandardPerformanceSets from "../components/StandardPerformanceSets";
import LineupsComponent from "../components/LineupsComponent";
import Pli from "../components/Pli";
import Pat from "../components/Pat";
import RiskAssessment from "../components/RiskAssessment";
import VatRegistered from "../components/VatRegistered";
import PaAndLights from "../components/PaAndLights";
import SaveProgress from "../components/SaveProgress";
import Videos from "../components/Videos";
import Discount from "../components/Discount";
import StandardLineupSelector from "../components/StandardLineupSelector";
import Repertoire from "../components/Repertoire";
import TscName from "./TscName";
import { jwtDecode } from "jwt-decode";

import StepNav from "./StepNav";
import CustomToast from "../components/CustomToast";
import TscActDescription from "./TscActDescription";
import { useNavigate } from "react-router-dom";


const ActForm = ({ initialData = null, onSubmit, userRole, token }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 7;
  const [name, setName] = useState("");
  const [tscName, setTscName] = useState("");
  const [description, setDescription] = useState("");
  const [bio, setBio] = useState("");
  const [videos, setVideos] = useState([]);
  const [mp3s, setMp3s] = useState([]);
  const [genre, setGenre] = useState([]);
  const [lineups, setLineups] = useState([]);
  const [bandMembers, setBandMembers] = useState([]);
  const [lengthOfSets, setLengthOfSets] = useState([]);
  const [minimumIntervalLength, setMinimumIntervalLength] = useState([]);
  const [status, setStatus] = useState("");
  const [images, setImages] = useState([]);
  const [useCountyTravelFee, setUseCountyTravelFee] = useState(true);
  const [countyFees, setCountyFees] = useState({});
  const [costPerMile, setCostPerMile] = useState("");
  const [pli, setPli] = useState(false);
  const [pliAmount, setPliAmount] = useState("");
  const [pliExpiry, setPliExpiry] = useState("");
  const [pliFile, setPliFile] = useState(null);
  const [patCert, setPatCert] = useState(false);
  const [patExpiry, setPatExpiry] = useState("");
  const [patFile, setPatFile] = useState(null);
  const [riskAssessment, setRiskAssessment] = useState("");
  const [vatRegistered, setVatRegistered] = useState(false);
  const [bestseller, setBestseller] = useState(false);
  const [paSystem, setPaSystem] = useState({});
  const [lightingSystem, setLightingSystem] = useState({});
  const [discountToClient, setDiscountToClient] = useState("");
  const [usesGenericRiskAssessment, setUsesGenericRiskAssessment] = useState(false);
  const [extrasPricing, setExtrasPricing] = useState({});
  const [repertoire, setRepertoire] = useState([]);
  const [customRepertoire, setCustomRepertoire] = useState("");
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [numberOfSets, setNumberOfSets] = useState([]);
  const [useMURates, setUseMURates] = useState(false);
  const [isPercentage, setIsPercentage] = useState(false);
  const [useMUTravelRates, setUseMUTravelRates] = useState(false);
  const [tscDescription, setTscDescription] = useState("");
  const [tscBio, setTscBio] = useState("");
  const [tscVideos, setTscVideos] = useState([]);
  const [resolvedRole, setResolvedRole] = useState(userRole);

useEffect(() => {
  console.log("Submitting, resolvedRole is:", resolvedRole);
  if (!userRole && token) {
    try {
      const decoded = jwtDecode(token);
      if (decoded?.id === "68123dcda79759339808b578") {
        setResolvedRole("agent");
      }
    } catch (err) {
      console.error("Token decode error in ActForm:", err);
    }
  }
}, [userRole, token]);

  const [lastSaved, setLastSaved] = useState(null);

  const payload = {
    name,
    tscName,
    description,
    bio,
    videos,
    mp3s,
    genre,
    lineups,
    bandMembers,
    lengthOfSets,
    minimumIntervalLength,
    status,
    images,
    useCountyTravelFee,
    countyFees,
    costPerMile,
    pli,
    pliAmount,
    pliExpiry,
    patCert,
    patExpiry,
    riskAssessment,
    vatRegistered,
    bestseller,
    paSystem,
    lightingSystem,
    discountToClient,
    usesGenericRiskAssessment,
    extras: extrasPricing,
    repertoire,
    customRepertoire,
    selectedSongs,
    numberOfSets,
    useMURates,
    isPercentage,
    useMUTravelRates,
    tscVideos,
    tscBio,
    tscDescription,
  };
  

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setTscName(initialData.tscName || "");
      setDescription(initialData.description || "");
      setTscDescription(initialData.tscDescription || "");
      setTscVideos(initialData.tscVideos || []);
      setTscBio(initialData.tscBio || "");
      setBio(initialData.bio || "");
      setVideos(initialData.videos || []);
      setMp3s(initialData.mp3s || []);
      setGenre(initialData.genre || []);
      setLineups(initialData.lineups || []);
      setBandMembers(initialData.bandMembers || []);
      setLengthOfSets(initialData.lengthOfSets || []);
      setMinimumIntervalLength(initialData.minimumIntervalLength || []);
      setStatus(initialData.status || "");
      setImages(initialData.images || []);
      setUseCountyTravelFee(initialData.useCountyTravelFee ?? true);
      setCountyFees(initialData.countyFees || {});
      setCostPerMile(initialData.costPerMile || "");
      setPli(initialData.pli || false);
      setPliAmount(initialData.pliAmount || "");
      setPliExpiry(initialData.pliExpiry || "");
      setPatCert(initialData.patCert || false);
      setPatExpiry(initialData.patExpiry || "");
      setRiskAssessment(initialData.riskAssessment || "");
      setVatRegistered(initialData.vatRegistered || false);
      setBestseller(initialData.bestseller || false);
      setPaSystem(initialData.paSystem || {});
      setLightingSystem(initialData.lightingSystem || {});
      setDiscountToClient(initialData.discountToClient || "");
      setUsesGenericRiskAssessment(initialData.usesGenericRiskAssessment || false);
      setExtrasPricing(initialData.extras || {});
      setRepertoire(initialData.repertoire || []);
      setCustomRepertoire(initialData.customRepertoire || "");
      setSelectedSongs(initialData.selectedSongs || []);
      setNumberOfSets(initialData.numberOfSets || []);
      setUseMURates(initialData.useMURates || false);
      setIsPercentage(initialData.isPercentage || false);
      setUseMUTravelRates(initialData.useMUTravelRates || false);
    }
  }, [initialData]);

  const internalSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    

    try {
      await onSubmit(payload);
      console.log("✅ Payload submitted successfully");

      toast.success("Your act has been submitted for review.");

      if (resolvedRole === "moderator" || resolvedRole === "agent") {
        navigate("/moderate-acts");
      } else {
        navigate("/list");
      }
    } catch (error) {
      console.error("❌ Submission error:", error);
      toast.error("Failed to submit the act.");
    }
  };

  const saveDraft = async () => {
    setLastSaved(new Date().toLocaleTimeString());
    try {
      const payload = {
        id: initialData?._id,
        name,
        tscName,
        description,
        tscDescription,
        bio,
        tscBio,
        tscVideos,
        videos,
        mp3s,
        genre,
        lineups,
        bandMembers,
        lengthOfSets,
        minimumIntervalLength,
        status,
        images,
        useCountyTravelFee,
        countyFees,
        costPerMile,
        pli,
        pliAmount,
        pliExpiry,
        patCert,
        patExpiry,
        riskAssessment,
        vatRegistered,
        bestseller,
        paSystem: typeof paSystem === "string" ? paSystem : "",
        lightingSystem: typeof lightingSystem === "string" ? lightingSystem : "",
        discountToClient,
        usesGenericRiskAssessment,
        extras: extrasPricing,
        repertoire,
        customRepertoire,
        selectedSongs,
        numberOfSets,
        useMURates,
        isPercentage,
        useMUTravelRates,
        
      };
  
      // ✅ Clean images (convert objects to strings)
      payload.images = (payload.images || [])
      .map((img) => (typeof img === "string" ? img : img?.url || null))
      .filter(Boolean); // Removes empty/null values
  
      await axios.post(`${backendUrl}/api/musician/act/save-draft`, payload, {
        headers: { token },
      });
  
      toast(<CustomToast type="success" message="Saved" />);
    } catch (err) {
      toast(<CustomToast type="error" message="Failed to save progress" />);
      console.error("❌ Save draft error:", err);
    }
  };

  

  const isChanged = (field) => {
    return Object.prototype.hasOwnProperty.call(initialData?.amendment?.changes || {}, field)
  };



  
    


  return (
    
    <form onSubmit={internalSubmit} className="flex flex-col w-full items-start gap-6">

{/* Step Progress Bar */}
<div className="w-full mb-6">
  <div className="text-sm text-gray-600 font-semibold mb-2 text-center">
    Step {step} of {totalSteps}
  </div>
  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
    <div
      className="h-full bg-black transition-all duration-300"
      style={{ width: `${(step / totalSteps) * 100}%` }}
    />
  </div>
</div>

    {step === 1 && (
      <StepOne
        name={name} setName={setName}
        tscName={tscName} setTscName={setTscName}
        images={images} setImages={setImages}
        videos={videos} setVideos={setVideos}
        tscVideos={tscVideos} setTscVideos={setTscVideos}
        mp3s={mp3s} setMp3s={setMp3s}
        description={description} setDescription={setDescription}
        bio={bio} setBio={setBio}
        userRole={resolvedRole} 
        isChanged={isChanged}
        tscDescription={tscDescription} setTscDescription={setTscDescription}
tscBio={tscBio} setTscBio={setTscBio}
      />
    )}


  
    {step === 2 && (
      <StepTwo
        genre={genre} setGenre={setGenre}
        customRepertoire={customRepertoire} setCustomRepertoire={setCustomRepertoire}
        selectedSongs={selectedSongs} setSelectedSongs={setSelectedSongs}
        setRepertoire={setRepertoire}
        isChanged={isChanged}

      />
    )}



  
    {step === 3 && (
      <StepThree
        numberOfSets={numberOfSets} setNumberOfSets={setNumberOfSets}
        lengthOfSets={lengthOfSets} setLengthOfSets={setLengthOfSets}
        minimumIntervalLength={minimumIntervalLength} setMinimumIntervalLength={setMinimumIntervalLength}
        paSystem={paSystem} setPaSystem={setPaSystem}
        lightingSystem={lightingSystem} setLightingSystem={setLightingSystem}
        patCert={patCert} setPatCert={setPatCert}
        patExpiry={patExpiry} setPatExpiry={setPatExpiry}
        patFile={patFile} setPatFile={setPatFile}
        pli={pli} setPli={setPli}
        pliAmount={pliAmount} setPliAmount={setPliAmount}
        pliExpiry={pliExpiry} setPliExpiry={setPliExpiry}
        pliFile={pliFile} setPliFile={setPliFile}
        riskAssessment={riskAssessment} setRiskAssessment={setRiskAssessment}
        usesGenericRiskAssessment={usesGenericRiskAssessment} setUsesGenericRiskAssessment={setUsesGenericRiskAssessment}
        vatRegistered={vatRegistered} setVatRegistered={setVatRegistered}
        isChanged={isChanged}

      />
    )}


  
    {step === 4 && (
      <StepFour
        lineups={lineups} setLineups={setLineups}
        extrasPricing={extrasPricing} setExtrasPricing={setExtrasPricing}
        isChanged={isChanged}
        selectedSongs={selectedSongs}

      />
    )}


  
    {step === 5 && (
      <StepFive
        useCountyTravelFee={useCountyTravelFee} setUseCountyTravelFee={setUseCountyTravelFee}
        countyFees={countyFees} setCountyFees={setCountyFees}
        costPerMile={costPerMile} setCostPerMile={setCostPerMile}
        useMUTravelRates={useMUTravelRates} setUseMUTravelRates={setUseMUTravelRates}
        lineups={lineups} setLineups={setLineups}
        isChanged={isChanged}

      />
    )}


  
    {step === 6 && (
      <StepSix
        useMURates={useMURates} setUseMURates={setUseMURates}
        extrasPricing={extrasPricing} setExtrasPricing={setExtrasPricing}
        isChanged={isChanged}

      />
    )}


  
{step === 7 && (
  <StepSeven
    discountToClient={discountToClient} setDiscountToClient={setDiscountToClient}
    isPercentage={isPercentage} setIsPercentage={setIsPercentage}

    isChanged={isChanged}

  />
)}


     
   <div className="flex justify-between items-center w-full">
  <div className="flex-1">
  <StepNav step={step} setStep={setStep} totalSteps={totalSteps} onSubmit={internalSubmit} />  </div>
  
  <button
    type="button"
    onClick={saveDraft}
    className="mt-4 ml-4 px-4 py-3 bg-black text-white hover:bg-[#ff6667] hover:text-black "
    value={console.log("Submitting lineups:", JSON.stringify(lineups, null, 2))}
  >
    Save Progress
  </button>
</div>

  {/* Moderator/Agent Approve/Reject Buttons */}
  {resolvedRole === "moderator" || resolvedRole === "agent" ? (
    <div className="flex gap-4 mt-6 ml-auto">
      <button
        type="button"
        onClick={async () => {
          try {
            console.log("🚀 Saving draft with payload:", JSON.stringify(payload, null, 2));
            await axios.post(`${backendUrl}/api/musician/act/approve`, { id: initialData?._id }, { headers: { token } });
            toast(<CustomToast type="success" message="Act approved!" />);
          } catch (err) {
            toast(<CustomToast type="error" message="Failed to approve act" />);
            console.error("❌ Approve error:", err);
          }
        }}
        className="bg-green-600 text-white px-4 py-3 hover:bg-green-700"
      >
        Approve Act
      </button>
      <button
        type="button"
        onClick={async () => {
          try {
            await axios.post(`${backendUrl}/api/musician/act/reject`, { id: initialData?._id }, { headers: { token } });
            toast(<CustomToast type="info" message="Act rejected." />);
          } catch (err) {
            toast(<CustomToast type="error" message="Failed to reject act" />);
            console.error("❌ Reject error:", err);
          }
        }}
        className="bg-red-600 text-white px-4 py-3 hover:bg-red-700"
      >
        Reject Act
      </button>
    </div>
  ) : null}
    </form>
  );
};


export default ActForm;