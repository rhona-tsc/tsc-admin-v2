import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../App";
import StepOne from "./steps/StepOne";
import StepTwo from "./steps/StepTwo";
import StepThree from "./steps/StepThree";
import StepFour from "./steps/StepFour";
import StepFive from "./steps/StepFive";
import StepSix from "./steps/StepSix";
import StepSeven from "./steps/StepSeven";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const steps = [
  "Act Info",
  "Repertoire",
  "Performance Setup",
  "Lineups",
  "Travel & Fees",
  "Extras",
  "Reviews & Submit",
];

const AddAct2StepperForm = ({
  initialData = null,
  mode = "add",
  userEmail,
  userRole,
  isModeration = false,
}) => {
  console.log("🔍 AddAct2StepperForm userEmail:", userEmail);
  console.log("🔍 AddAct2StepperForm userRole:", userRole);
  console.log("🔒 AddAct2StepperForm isModeration:", isModeration);

  const [step, setStep] = useState(0);
  const totalSteps = steps.length;
  const { id } = useParams();
  const [actId, setActId] = useState(() => id || localStorage.getItem("currentDraftActId") || null);
  const navigate = useNavigate();
const [hydratedFromInitial, setHydratedFromInitial] = useState(false); 
  const [name, setName] = useState("");
  const [tscName, setTscName] = useState("");
  const [images, setImages] = useState([]);
  const [coverImage, setCoverImage] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [videos, setVideos] = useState([]);
  const [tscVideos, setTscVideos] = useState([]);
  const [mp3s, setMp3s] = useState([]);
  const [description, setDescription] = useState("");
  const [bio, setBio] = useState("");
  const [genre, setGenre] = useState([]);
  const [repertoire, setRepertoire] = useState([]);
  const [customRepertoire, setCustomRepertoire] = useState("");
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [numberOfSets, setNumberOfSets] = useState([]);
  const [lengthOfSets, setLengthOfSets] = useState([]);
  const [minimumIntervalLength, setMinimumIntervalLength] = useState([]);
  const [paSystem, setPaSystem] = useState({});
  const [setlist, setSetlist] = useState({});

  const [offRepertoireRequests, setOffRepertoireRequests] = useState([]);
  const [draftHasBeenSaved, setDraftHasBeenSaved] = useState(false);
  const [lightingSystem, setLightingSystem] = useState({});
  const [patCert, setPatCert] = useState(false);
  const [pli, setPli] = useState(false);
  const [patFile, setPatFile] = useState(null);
  const [pliFile, setPliFile] = useState(null);
  const [pliAmount, setPliAmount] = useState("");
  const [pliExpiry, setPliExpiry] = useState("");
  const [patExpiry, setPatExpiry] = useState("");
  const [riskAssessment, setRiskAssessment] = useState("");
  const [vatRegistered, setVatRegistered] = useState(false);
  const [lineups, setLineups] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [useCountyTravelFee, setUseCountyTravelFee] = useState(true);
  const [countyFees, setCountyFees] = useState({});
  const [costPerMile, setCostPerMile] = useState("");
  const [useMUTravelRates, setUseMUTravelRates] = useState(false);
  const [useMURates, setUseMURates] = useState(false);
  const [discountToClient, setDiscountToClient] = useState("");
  const [isPercentage, setIsPercentage] = useState(false);
  const [tscDescription, setTscDescription] = useState("");
  const [tscBio, setTscBio] = useState("");
  const [usesGenericRiskAssessment, setUsesGenericRiskAssessment] =
    useState(false);
  const [extras, setExtras] = useState("");
  const [changedFields, setChangedFields] = useState({});
  const isAgent = userEmail
    ?.toLowerCase()
    .includes("thesupremecollective.co.uk");

  const markChanged = (field) => {
    setChangedFields((prev) => ({ ...prev, [field]: true }));
  };

  const isChanged = (field) => !!changedFields[field];

  const [lastSaved, setLastSaved] = useState(null);
  const autosaveTimer = useRef(null);
  const [initializedFromData, setInitializedFromData] = useState(false);
  const isEditMode = Boolean(id);
  const modeToUse = mode || (isEditMode ? "edit" : "add");

  const sanitizeMediaArray = (media) => {
    return (media || [])
      .map((item) => {
        if (typeof item === "string") return { title: "", url: item };
        if (typeof item === "object" && item.url)
          return {
            title: item.title || "",
            url: item.url,
          };
        return null;
      })
      .filter(Boolean);
  };

  const sanitizeLineups = (lineups) => {
    return lineups.map(lineup => {
      const newLineup = { ...lineup };
      if (newLineup.ceremonySets instanceof Map) {
        newLineup.ceremonySets = Object.fromEntries(newLineup.ceremonySets);
      }
      // Patch: transform "HAS_CAR" to carRegistrationValue for each band member
      newLineup.bandMembers = (lineup.bandMembers || []).map((member) => {
        const carRegToSave =
          member.carRegistration === "HAS_CAR"
            ? member.carRegistrationValue
            : member.carRegistration;

        return {
          ...member,
          carRegistration: carRegToSave,
          additionalRoles: (member.additionalRoles || [])
            .filter((role) => role && typeof role === "object" && role.role)
            .map((role) => ({
              isEssential: !!role.isEssential,
              role: role.role,
              additionalFee: parseFloat(role.additionalFee || 0),
            })),
          deputies: (member.deputies || []).filter(
            (d) => d && typeof d === "object" && (d.email || d.firstName)
          ),
        };
      });
      return newLineup;
    });
  };

  // Utility to normalize each lineup's ceremonySets and acousticPerformanceOptions
const normalizeLineup = (lineup) => ({
  ...lineup,
  ceremonySets:
    lineup.ceremonySets && !(lineup.ceremonySets instanceof Map)
      ? new Map(
          Object.entries(lineup.ceremonySets || {}).map(([key, val]) => [
            key,
            {
              ...val,
              instruments: Array.isArray(val.instruments) ? val.instruments : [],
            },
          ])
        )
      : new Map(),

  bandMembers: (lineup.bandMembers || []).map((member) => {
    const ENUMS = new Set(["", "NO_CAR", "UNKNOWN", "HAS_CAR"]);
    const raw = (member.carRegistration || "").trim();

    // If the stored value is a real plate (non-enum), flip UI into HAS_CAR mode
    if (raw && !ENUMS.has(raw)) {
      return {
        ...member,
        carRegistration: "HAS_CAR",
        carRegistrationValue: raw.toUpperCase(),
        additionalRoles: (member.additionalRoles || [])
          .filter((role) => role && typeof role === "object" && role.role)
          .map((role) => ({
            isEssential: !!role.isEssential,
            role: role.role,
            additionalFee: parseFloat(role.additionalFee || 0),
          })),
        deputies: (member.deputies || []).filter(
          (d) => d && typeof d === "object" && (d.email || d.firstName)
        ),
      };
    }

    // Otherwise keep existing enum/value behaviour
    const carRegToSave =
      member.carRegistration === "HAS_CAR"
        ? member.carRegistrationValue
        : member.carRegistration;

    return {
      ...member,
      carRegistration: member.carRegistration, // keep mode as-is (enum)
      carRegistrationValue:
        member.carRegistration === "HAS_CAR"
          ? (member.carRegistrationValue || "").toUpperCase()
          : member.carRegistrationValue || "",
      additionalRoles: (member.additionalRoles || [])
        .filter((role) => role && typeof role === "object" && role.role)
        .map((role) => ({
          isEssential: !!role.isEssential,
          role: role.role,
          additionalFee: parseFloat(role.additionalFee || 0),
        })),
      deputies: (member.deputies || []).filter(
        (d) => d && typeof d === "object" && (d.email || d.firstName)
      ),
    };
  }),

  acousticPerformanceOptions: lineup.acousticPerformanceOptions || {
    solo: { fullyAcoustic: [], withPA: [], withPAAndTracks: [] },
    duo: { fullyAcoustic: [], withPA: [], withPAAndTracks: [] },
    trio: { fullyAcoustic: [], withPA: [], withPAAndTracks: [] },
    fourPiece: { fullyAcoustic: [], withPA: [], withPAAndTracks: [] },
  },
});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setTscName(initialData.tscName || "");
      setImages(initialData.images || []);
      setCoverImage(initialData.coverImage || []);
      setProfileImage(initialData.profileImage || []);
      setVideos(initialData.videos || []);
      setTscVideos(initialData.tscVideos || []);
      setMp3s(
        (initialData.mp3s || []).map((mp3, i) => ({
          id: mp3.id || mp3.url || `loaded-${i}`, // ensure all have an id
          title: mp3.title || "",
          url: mp3.url,
        }))
      );
      setDescription(initialData.description || "");
      setTscDescription(initialData.tscDescription || "");
      setBio(initialData.bio || "");
      setTscBio(initialData.tscBio || "");
      setGenre(initialData.genre || []);
      setRepertoire(initialData.repertoire || []);
      setCustomRepertoire(initialData.customRepertoire || "");
      setSelectedSongs(initialData.selectedSongs || []);
      setNumberOfSets(initialData.numberOfSets || []);
      setLengthOfSets(initialData.lengthOfSets || []);
      setMinimumIntervalLength(initialData.minimumIntervalLength || []);
      setPaSystem(initialData.paSystem || {});
      setSetlist(initialData.setlist || {});
      setOffRepertoireRequests(initialData.offRepertoireRequests || []);
      setLightingSystem(initialData.lightingSystem || {});
      setPatCert(initialData.patCert || false);
      setPli(initialData.pli || false);
      setPliAmount(initialData.pliAmount || "");
      setPliExpiry(initialData.pliExpiry || "");
      setPatExpiry(initialData.patExpiry || "");
      setPliFile(initialData.pliFile || "");
      setPatFile(initialData.patFile || "");
      setRiskAssessment(initialData.riskAssessment || "");
      setVatRegistered(initialData.vatRegistered || false);
      setLineups((initialData.lineups || []).map(normalizeLineup));
      setReviews(initialData.reviews || []);
      setUseCountyTravelFee(initialData.useCountyTravelFee ?? true);
      setCountyFees(initialData.countyFees || {});
      setCostPerMile(initialData.costPerMile || "");
      setUseMUTravelRates(initialData.useMUTravelRates || false);
      setUseMURates(initialData.useMURates || false);
      setExtras(initialData.extras || {});
      setDiscountToClient(initialData.discountToClient || "");
      setIsPercentage(initialData.isPercentage || false);
       setInitializedFromData(true);
      console.log("✅ Hydrated form from initialData");
    }
  }, [initialData]);

  useEffect(() => {
    const fetchAct = async () => {
      if (!id) return; // Only run for edit mode
      if (initialData) return; // If parent already provided data, don't refetch
      try {
        const res = await axios.get(`${backendUrl}/api/musician/acts/get/${id}`);
        const data = res.data;

        console.log("🎯 Full data from DB:", data);
        console.log("🔦 lightingSystem from DB:", data.lightingSystem);
        // Log the required values after fetching data
        console.log("🧾 pliAmount from DB:", data.pliAmount);
        console.log("📁 pliFile from DB:", data.pliFile);
        console.log("📁 patFile from DB:", data.patFile);
        console.log("🧪 patCert from DB:", data.patCert);
        console.log("📜 pli from DB:", data.pli);

        // Populate state from response (only include what's needed)
        setName(data.name || "");
        setTscName(data.tscName || "");
        setImages(data.images || []);
        setCoverImage(data.coverImage || []);
        setProfileImage(data.profileImage || []);
        setVideos(data.videos || []);
        setTscVideos(data.tscVideos || []);
        setMp3s(data.mp3s || []);
        setDescription(data.description || "");
        setTscDescription(data.tscDescription || "");
        setBio(data.bio || "");
        setTscBio(data.tscBio || "");
        setGenre(data.genre || []);
        setRepertoire(data.repertoire || []);
        setCustomRepertoire(data.customRepertoire || "");
        setSelectedSongs(data.selectedSongs || []);
        setNumberOfSets(data.numberOfSets || []);
        setLengthOfSets(data.lengthOfSets || []);
        setMinimumIntervalLength(data.minimumIntervalLength || []);
        setPaSystem(data.paSystem || "");
        setSetlist(data.setlist || "");
        setOffRepertoireRequests(data.offRepertoireRequests || []);
        setLightingSystem(data.lightingSystem || "");
        // Use ?? for proper normalization
        setPliAmount(data.pliAmount ?? "");
        setPliFile(data.pliFile ?? "");
        setPatFile(data.patFile ?? "");
        setPli(data.pli ?? false);
        setPatCert(data.patCert ?? false);
        setPatExpiry(data.patExpiry || "");
        setRiskAssessment(data.riskAssessment || "");
        setUsesGenericRiskAssessment(data.usesGenericRiskAssessment || false);
        setPliExpiry(data.pliExpiry || "");
        setLineups((data.lineups || []).map(normalizeLineup));
        setReviews(data.reviews || []);
        setUseCountyTravelFee(data.useCountyTravelFee ?? true);
        setCountyFees(data.countyFees || {});
        setCostPerMile(data.costPerMile || "");
        setUseMUTravelRates(data.useMUTravelRates || false);
        setUseMURates(data.useMURates || false);
        setExtras(data.extras || {});
        setDiscountToClient(data.discountToClient || "");
        setIsPercentage(data.isPercentage || false);
        setHydratedFromInitial(true);
      } catch (err) {
        console.error("Failed to fetch act for edit:", err);
      }
    };

    fetchAct();
  }, [id]);

    const hasAnyChanges = Object.keys(changedFields || {}).length > 0;

  const saveDraft = async () => {
    // ⛔ Do not autosave while in moderation mode
    if (isModeration) {
      console.log("🛑 Moderation mode: skipping saveDraft()");
      return;
    }

// Updated sanitizeLineups function to ensure ceremonySets is always a plain object,
// preserving all keys and instrument arrays as expected.
const sanitizeLineups = (lineups) => {
  return lineups.map((lineup) => ({
    ...lineup,
    acousticPerformanceOptions: lineup.acousticPerformanceOptions || {
      solo: {
        fullyAcoustic: [],
        withPA: [],
        withPAAndTracks: [],
      },
      duo: {
        fullyAcoustic: [],
        withPA: [],
        withPAAndTracks: [],
      },
      trio: {
        fullyAcoustic: [],
        withPA: [],
        withPAAndTracks: [],
      },
      fourPiece: {
        fullyAcoustic: [],
        withPA: [],
        withPAAndTracks: [],
      },
    },
    ceremonySets:
      lineup.ceremonySets instanceof Map
        ? Object.fromEntries(lineup.ceremonySets)
        : lineup.ceremonySets || {},
    bandMembers: (lineup.bandMembers || []).map((member) => {
      const carRegToSave =
        member.carRegistration === "HAS_CAR"
          ? member.carRegistrationValue
          : member.carRegistration;

      return {
        ...member,
        carRegistration: carRegToSave,
        additionalRoles: (member.additionalRoles || [])
          .filter((role) => role && typeof role === "object" && role.role)
          .map((role) => ({
            isEssential: !!role.isEssential,
            role: role.role,
            additionalFee: parseFloat(role.additionalFee || 0),
          })),
        deputies: (member.deputies || []).filter(
          (d) => d && typeof d === "object" && (d.email || d.firstName)
        ),
      };
    }),
  }));
};

    const formattedExtras = Object.entries(extras).reduce((acc, [key, value]) => {
      if (typeof value === "object") {
        acc[key] = {
          price: Number(value.price) || 0,
          complimentary: !!value.complimentary,
        };
      } else {
        acc[key] = {
          price: Number(value) || 0,
          complimentary: false,
        };
      }
      return acc;
    }, {});

    try {
      let existingDraftId = initialData?._id || actId || localStorage.getItem("currentDraftActId");

      console.log("💾 Attempting to save draft. initialData:", initialData);
      console.log("📌 existingDraftId:", existingDraftId);

      const payload = {
        name,
        _id: existingDraftId,
        tscName,
        images: sanitizeMediaArray(images),
        coverImage: sanitizeMediaArray(coverImage),
        profileImage: sanitizeMediaArray(profileImage),
        videos: sanitizeMediaArray(videos),
        mp3s: sanitizeMediaArray(mp3s),
        tscVideos: sanitizeMediaArray(tscVideos),
        description,
        tscDescription,
        bio,
        tscBio,
        genre,
        repertoire,
        customRepertoire,
        selectedSongs,
        numberOfSets,
        lengthOfSets,
        minimumIntervalLength,
        paSystem: typeof paSystem === "string" ? paSystem : "",
        lightingSystem: typeof lightingSystem === "string" ? lightingSystem : "",
        patCert,
        pli,
        pliAmount,
        pliExpiry,
        patExpiry,
        pliFile,
        patFile,
        riskAssessment,
        vatRegistered,
        lineups: sanitizeLineups(lineups),
        reviews,
        useCountyTravelFee,
        countyFees,
        costPerMile,
        useMUTravelRates,
        useMURates,
        extras: formattedExtras,
        discountToClient,
        isPercentage,
        status: (
          initialData?.status === "live"
            ? "Approved, changes pending"
            : initialData?.status === "pending"
            ? "pending"
            : "draft"
        ),
      };

      ["pliFile", "patFile", "riskAssessment"].forEach((key) => {
        if (typeof payload[key] !== "string") payload[key] = "";
      });

      const method = existingDraftId ? "put" : "post";
      const url = existingDraftId
        ? `${backendUrl}/api/musician/act-v2/update/${existingDraftId}`
        : `${backendUrl}/api/musician/act-v2/create`;

      console.log("📤 Payload being sent:", payload);
      console.log("📝 Saving draft using method:", method);

      const res = await axios[method](url, payload);
      console.log("📬 Server responded with:", res.data);

      if (!existingDraftId && res.data._id) {
        console.log("🆕 New draft created:", res.data._id);
        setActId(res.data._id);
        localStorage.setItem("currentDraftActId", res.data._id);
      } else {
        console.log("♻️ Reused existing draft _id:", existingDraftId);
      }
    } catch (err) {
      console.error("❌ Draft save error:", err);
    }
  };
  
  // 👇 Add this to useEffect on mount to restore saved draft ID
  useEffect(() => {
    const draftIdFromStorage = localStorage.getItem("currentDraftActId");
    if (!actId && draftIdFromStorage) {
      setActId(draftIdFromStorage);
    }
  }, []);

    useEffect(() => {
    // 🚧 HARD GUARDS to stop empty overwrite:
    // 1) If this is a moderation open, never autosave
    if (isModeration) {
      console.log("⛔ Autosave skipped: moderation mode");
      return;
    }

    // 2) In edit mode, wait until we've hydrated from DB
    if (mode === "edit" && !initializedFromData) {
      console.log("⛔ Autosave skipped: waiting for initialData hydration");
      return;
    }

    // 3) In edit mode, don’t autosave if nothing has changed yet
    if (mode === "edit" && !hasAnyChanges) {
      console.log("⛔ Autosave skipped: no changes yet");
      return;
    }

    // 4) Optional: if we’re still fetching id for drafts, skip
    if (mode === "edit" && !id && !initialData?._id) {
      console.log("⛔ Autosave skipped: missing act id in edit mode");
      return;
    }

    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);

    autosaveTimer.current = setTimeout(() => {
      console.log("💾 Autosaving draft…");
      saveDraft();
    }, 5000);

    return () => clearTimeout(autosaveTimer.current);
  }, [
    name,
    tscName,
    images,
    coverImage,
    profileImage,
    videos,
    tscVideos,
    mp3s,
    description,
    tscDescription,
    bio,
    tscBio,
    genre,
    repertoire,
    customRepertoire,
    selectedSongs,
    numberOfSets,
    lengthOfSets,
    minimumIntervalLength,
    paSystem,
    lightingSystem,
    patCert,
    pli,
    pliAmount,
    pliExpiry,
    patExpiry,
    pliFile,
    patFile,
    setlist,

    offRepertoireRequests,
    riskAssessment,
    vatRegistered,
    lineups,
    reviews,
    useCountyTravelFee,
    countyFees,
    costPerMile,
    useMUTravelRates,
    useMURates,
    extras,
    discountToClient,
    isPercentage,
  ]);

  const goNext = () => {
    if (step < totalSteps - 1) setStep(step + 1);
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    // Use updated sanitizeLineups implementation
  
    const formattedExtras = Object.entries(extras).reduce((acc, [key, value]) => {
      if (typeof value === "object") {
        acc[key] = {
          price: Number(value.price) || 0,
          complimentary: !!value.complimentary,
        };
      } else {
        acc[key] = {
          price: Number(value) || 0,
          complimentary: false,
        };
      }
      return acc;
    }, {});
  
 
  
    const resolvedId = initialData?._id || actId || localStorage.getItem("currentDraftActId");
  
    try {
console.log("[DeputiesInput] genres flowing down:", { actGenres: genre });
      const payload = {
        name,
        _id: resolvedId,
        tscName,
        images: sanitizeMediaArray(images),
        coverImage: sanitizeMediaArray(coverImage),
        profileImage: sanitizeMediaArray(profileImage),
        videos: sanitizeMediaArray(videos),
        mp3s: sanitizeMediaArray(mp3s),
        tscVideos: sanitizeMediaArray(tscVideos),
        description,
        tscDescription,
        bio,
        tscBio,
        genre,
        repertoire,
        customRepertoire,
        selectedSongs,
        numberOfSets,
        lengthOfSets,
        minimumIntervalLength,
        paSystem: typeof paSystem === "string" ? paSystem : "",
        lightingSystem: typeof lightingSystem === "string" ? lightingSystem : "",
        setlist: typeof setlist === "string" ? setlist : "",

        offRepertoireRequests,
        patCert,
        pli,
        pliAmount,
        pliExpiry,
        patExpiry,
        pliFile,
        patFile,
        riskAssessment,
        vatRegistered,
        lineups: sanitizeLineups(lineups),
        reviews,
        useCountyTravelFee,
        countyFees,
        costPerMile,
        useMUTravelRates,
        useMURates,
        extras: formattedExtras,
        discountToClient,
        isPercentage,
        status: (
          initialData?.status === "live"
            ? "Approved, changes pending"
            : initialData?.status === "pending"
            ? "pending"
            : "draft"
        ),
        submit: true,
        
      };
  
      ["pliFile", "patFile", "riskAssessment"].forEach((key) => {
        if (typeof payload[key] !== "string") payload[key] = "";
      });
  
      if (resolvedId) {
        await axios.put(`${backendUrl}/api/musician/act-v2/update/${resolvedId}`, payload);
      } else {
        await axios.post(`${backendUrl}/api/musician/act-v2/create`, payload);
      }
  
      toast.success("Act submitted for review", { autoClose: 2000 });
      localStorage.removeItem("currentDraftActId");
      setTimeout(() => navigate("/musicians-dashboard"), 2000);
    } catch (err) {
      console.error("Submission failed:", err);
      toast.error("Failed to submit act. Check console.");
    }
  };

  const extractedInstruments = Array.from(
    new Set(
      lineups
        .flatMap((lineup) =>
          lineup.bandMembers?.map((member) => member.instrument || "") || []
        )
        .filter(Boolean)
    )
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{modeToUse === "edit" ? "Edit Act" : "Add New Act"}</h1>

      {/* Step Indicator */}
      <div className="flex items-center gap-4 mb-6">
        {steps.map((label, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-2 ${
              idx === step ? "font-bold text-black" : "text-gray-400"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                idx === step ? "bg-black text-white" : "border-gray-300"
              }`}
            >
              {idx + 1}
            </div>
            <span className="hidden md:block">{label}</span>
          </div>
        ))}
      </div>

      {lastSaved && (
        <p className="text-sm text-gray-500 mb-2 text-right">
          Last saved at {lastSaved}
        </p>
      )}

      {/* Step Content */}
      <div className="min-h-[300px] bg-white border rounded p-6 shadow-sm">
        <p className="text-gray-500">
          Step {step + 1}: <span className="font-semibold">{steps[step]}</span>
        </p>
        <div className="mt-4">
          {step === 0 && (
            <StepOne
              {...{
                name,
                setName,
                tscName,
                setTscName,
                images,
                coverImage,
                setCoverImage,
                profileImage,
                setProfileImage,
                setImages,
                videos,
                setVideos,
                mp3s,
                setMp3s,
                description,
                setDescription,
                tscDescription,
                setTscDescription,
                bio,
                setBio,
                setTscVideos,
                tscVideos,
                tscBio,
                setTscBio,
                isChanged,
                markChanged,
                mode: modeToUse,
                isAgent,
                userEmail,
                userRole,
              }}
            />
          )}
          {step === 1 && (
            <StepTwo
              {...{
                genre,
                setGenre,
                repertoire,
                setRepertoire,
                customRepertoire,
                setCustomRepertoire,
                selectedSongs,
                setSelectedSongs,
                isChanged,
                markChanged,
                mode: modeToUse,
                isAgent,
                email: userEmail,
                userRole,
              }}
            />
          )}
          {step === 2 && (
            <StepThree
              {...{
                numberOfSets,
                setNumberOfSets,
                lengthOfSets,
                setLengthOfSets,
                minimumIntervalLength,
                setMinimumIntervalLength,
                paSystem,
                setPaSystem,
                setlist,
                offRepertoireRequests,
                setOffRepertoireRequests,
                setSetlist,
                
                lightingSystem,
                setLightingSystem,
                patCert,
                setPatCert,
                patExpiry,
                setPatExpiry,
                pli,
                setPli,
                pliAmount,
                setPliAmount,
                pliExpiry,
                setPliExpiry,
                pliFile,
                setPliFile,
                patFile,
                setPatFile,
                riskAssessment,
                setRiskAssessment,
                usesGenericRiskAssessment,
                setUsesGenericRiskAssessment,
                vatRegistered,
                setVatRegistered,
                isChanged,
                markChanged,
              }}
            />
          )}
          {step === 3 && (
  <StepFour
    {...{
      lineups,
      setLineups,
      isChanged,
      markChanged,
      selectedSongs,
      actGenres: genre,   // 👈 add this
    }}
  />
)}
          {step === 4 && (
            <StepFive
              {...{
                useCountyTravelFee,
                setUseCountyTravelFee,
                countyFees,
                setCountyFees,
                costPerMile,
                setCostPerMile,
                useMUTravelRates,
                setUseMUTravelRates,
                isChanged,
                markChanged,
                lineups,
                setLineups,
              }}
            />
          )}
          {step === 5 && (
           <StepSix
  {...{
    useMURates,
    setUseMURates,
    extras,
    setExtras,
    isChanged,
    markChanged,
    lineups,
    setLineups, 
  }}
/>
          )}
          {step === 6 && (
            <StepSeven
              discountToClient={discountToClient}
              setDiscountToClient={setDiscountToClient}
              isPercentage={isPercentage}
              setIsPercentage={setIsPercentage}
              onSubmit={handleSubmit}
              isChanged={isChanged}
              markChanged={markChanged}
              reviews={reviews}
              setReviews={setReviews}
            />
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <button
          disabled={step === 0}
          onClick={goBack}
          className="px-4 py-2 border border-gray-400 rounded disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={step === totalSteps - 1 ? handleSubmit : goNext}
          className="px-4 py-2 bg-black text-white rounded hover:bg-[#ff6667] hover:text-black"
        >
          {step === totalSteps - 1 ? "Submit" : "Next"}
        </button>
      </div>
    </div>
  );
};

export default AddAct2StepperForm;
