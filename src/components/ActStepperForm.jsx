// ActStepperForm.jsx
import React, { useState } from 'react';
import StepNav from './StepNav';
import renameAndCompressImage from "./utils/renameAndCompressImage";
import StepOne from './steps/StepOne';
import StepTwo from './steps/StepTwo';
import StepThree from './steps/StepThree';
import StepFour from './steps/StepFour';
import StepFive from './steps/StepFive';
import StepSix from './steps/StepSix';
import StepSeven from './steps/StepSeven';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ActStepperForm = ({ onSubmit }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 7;
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [tscName, setTscName] = useState('');
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [tscVideos, setTscVideos] = useState([]);
  const [mp3s, setMp3s] = useState([]);
  const [description, setDescription] = useState('');
  const [bio, setBio] = useState('');
  const [genre, setGenre] = useState([]);
  const [repertoire, setRepertoire] = useState([]);
  const [customRepertoire, setCustomRepertoire] = useState('');
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [numberOfSets, setNumberOfSets] = useState([]);
  const [lengthOfSets, setLengthOfSets] = useState([]);
  const [minimumIntervalLength, setMinimumIntervalLength] = useState([]);
  const [paSystem, setPaSystem] = useState({});
  const [lightingSystem, setLightingSystem] = useState({});
  const [patCert, setPatCert] = useState(false);
  const [pli, setPli] = useState(false);
  const [pliAmount, setPliAmount] = useState('');
  const [pliExpiry, setPliExpiry] = useState('');
  const [patExpiry, setPatExpiry] = useState('');
  const [riskAssessment, setRiskAssessment] = useState('');
  const [vatRegistered, setVatRegistered] = useState(false);
  const [lineups, setLineups] = useState([]);
  const [useCountyTravelFee, setUseCountyTravelFee] = useState(true);
  const [countyFees, setCountyFees] = useState({});
  const [costPerMile, setCostPerMile] = useState('');
  const [useMUTravelRates, setUseMUTravelRates] = useState(false);
  const [useMURates, setUseMURates] = useState(false);
  const [extrasPricing, setExtrasPricing] = useState({});
  const [discountToClient, setDiscountToClient] = useState('');
  const [isPercentage, setIsPercentage] = useState(false);
  const [tscDescription, setTscDescription] = useState(false);
  const [tscBio, setTscBio] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("🔍 Submit button clicked - starting handleSubmit");

      const uploadedImageUrls = await renameAndCompressImage({
        images,
        tscName,
        genres: genre,
        lineupSize: lineups[0]?.actSize,
        bandMembers: lineups[0]?.bandMembers || [],
      });

      console.log("🖼️ Uploaded Image URLs:", uploadedImageUrls);

      const payload = {
        name, tscName, images: uploadedImageUrls, videos, mp3s, description, bio,
        genre, repertoire, customRepertoire, selectedSongs,
        numberOfSets, lengthOfSets, minimumIntervalLength,
        paSystem, lightingSystem, patCert, pli, pliAmount, pliExpiry,
        patExpiry, riskAssessment, vatRegistered,
        lineups, useCountyTravelFee, countyFees, costPerMile, useMUTravelRates,
        useMURates, extras: extrasPricing, discountToClient, isPercentage, tscBio, tscDescription, tscVideos,
        status: "pending", // ✅ Force it to 'pending'
      };

      console.log("📦 Payload to submit:", payload);

      await onSubmit(payload);
      console.log("✅ Payload submitted successfully");

      toast.success("Your act has been submitted for review.");
      navigate("/list");
    } catch (err) {
      console.error("❌ Submit handler failed:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto bg-white p-6 shadow rounded">
      <div className="mb-4">
        <p className="text-sm text-gray-500">Step {step} of {totalSteps}</p>
        <div className="h-2 bg-gray-200 rounded">
          <div className="h-full bg-blue-600 rounded" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
        </div>
      </div>

      {step === 1 && <StepOne {...{ name, setName, tscName, setTscName, images, setImages, videos, setVideos, mp3s, setMp3s, description, setDescription, tscDescription, setTscDescription, bio, setBio, setTscVideos, tscVideos, tscBio, setTscBio }} />}
      {step === 2 && <StepTwo {...{ genre, setGenre, repertoire, setRepertoire, customRepertoire, setCustomRepertoire, selectedSongs, setSelectedSongs }} />}
      {step === 3 && <StepThree {...{ numberOfSets, setNumberOfSets, lengthOfSets, setLengthOfSets, minimumIntervalLength, setMinimumIntervalLength, paSystem, setPaSystem, lightingSystem, setLightingSystem, patCert, setPatCert, patExpiry, setPatExpiry, pli, setPli, pliAmount, setPliAmount, pliExpiry, setPliExpiry, riskAssessment, setRiskAssessment, vatRegistered, setVatRegistered }} />}
      {step === 4 && <StepFour {...{ lineups, setLineups }} />}
      {step === 5 && <StepFive {...{ useCountyTravelFee, setUseCountyTravelFee, countyFees, setCountyFees, costPerMile, setCostPerMile, useMUTravelRates, setUseMUTravelRates }} />}
      {step === 6 && <StepSix {...{ useMURates, setUseMURates, extrasPricing, setExtrasPricing }} />}
      {step === 7 && (
        <StepSeven
          discountToClient={discountToClient}
          setDiscountToClient={setDiscountToClient}
          isPercentage={isPercentage}
          setIsPercentage={setIsPercentage}
          onSubmit={handleSubmit}
        />
      )}

      <StepNav
        step={step}
        setStep={setStep}
        totalSteps={totalSteps}
        onSubmit={handleSubmit}
      />
    </form>
  );
};
export default ActStepperForm;