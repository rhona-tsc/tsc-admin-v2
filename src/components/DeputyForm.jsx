import { useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import React, { useState, useEffect } from "react";
import DeputyStepOne from "./DeputyStepOne";
import DeputyStepTwo from "./DeputyStepTwo";
import DeputyStepThree from "./DeputyStepThree";
import DeputyStepFour from "./DeputyStepFour";
import DeputyStepFive from "./DeputyStepFive";
import DeputyStepSix from "./DeputyStepSix";
import { toast } from "react-toastify";
import CustomToast from "./CustomToast";
import axios from "axios";
import { backendUrl } from "../App";

import imageCompression from "browser-image-compression";
import renameAndCompressImage from "../pages/utils/renameAndCompressDeputyImage";

const DeputyForm = ({ token, userRole, firstName, lastName, email, phone, userId }) => {
      console.log(
    "🎸 LIVE DeputyForm Loaded — VERSION: DeputyForm", 
    "2025-11-22 17:45",
    "— location:", 
    import.meta.url
  );

  const [step, setStep] = useState(1);
  const { id } = useParams(); // /edit-deputy/:id

  // this is the id we’ll use when we need it in children (e.g. Step 4)
  const deputyId = id || userId || localStorage.getItem("musicianId") || null;

  const totalSteps = 6;
  // Uploading state indicators
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isUploadingMp3s, setIsUploadingMp3s] = useState(false);
  const [submissionInProgress, setSubmissionInProgress] = useState(false);
  const [showSubmittingPopup, setShowSubmittingPopup] = useState(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState("");


  const [formData, setFormData] = useState({
    role: userRole,
    basicInfo: {
      firstName: firstName,
      lastName: lastName,
      phone: phone,
      email: email,
    },
    address: {
      line1: "",
      line2: "",
      town: "",
      county: "",
      postcode: "",
      country: "",
    },
    profilePicture: null,
    coverHeroImage: null,
    bio: "",
    tscApprovedBio: "",
    tagLine: "",
    status: "pending",
    academic_credentials: [
      {
        course: "",
        institution: "",
        years: "",
        education_level: "",
      },
    ],
    cableLogistics: [
      {
        length: "",
        quantity: "",
      },
    ],
    extensionCableLogistics: [
      {
        length: "",
        quantity: "",
      },
    ],
    uplights: [
      {
        quantity: "",
        wattage: "",
      },
    ],
    tbars: [
      {
        quantity: "",
        wattage: "",
      },
    ],
    lightBars: [
      {
        quantity: "",
        wattage: "",
      },
    ],
    discoBall: [
      {
        quantity: "",
        wattage: "",
      },
    ],
    otherLighting: [
      {
        name: "",
        quantity: "",
        wattage: "",
      },
    ],
    paSpeakerSpecs: [
      {
        name: "",
        quantity: "",
        wattage: "",
      },
    ],
    backline: [
      {
        name: "",
        quantity: "",
        wattage: "",
      },
    ],
    mixingDesk: [
      {
        name: "",
        quantity: "",
        wattage: "",
      },
    ],
    floorMonitorSpecs: [
      {
        name: "",
        quantity: "",
        wattage: "",
      },
    ],
    djEquipment: [
      {
        name: "",
        quantity: "",
        wattage: "",
      },
    ],
    djEquipmentCategories: [
      {
        hasDjTable: false,
        hasDjBooth: false,
        hasMixingConsole: false,
        hasCdjs: false,
        hasVinylDecks: false,
      },
    ],
    agreementCheckboxes: [
      {
        termsAndConditions: false,
        privacyPolicy: false,
      },
    ],
    djGearRequired: [
      {
        name: "",
        quantity: "",
        wattage: "",
      },
    ],

    awards: [
      {
        description: "",
        years: "",
      },
    ],
    function_bands_performed_with: [
      {
        function_band_name: "",
        function_band_leader_email: "",
      },
    ],
    original_bands_performed_with: [
      {
        original_band_name: "",
        original_band_leader_email: "",
      },
    ],
    sessions: [
      {
        artist: "",
        session_type: "",
      },
    ],
    social_media_links: [
      {
        platform: "",
        url: "",
      },
    ],

    coverMp3s: [],
    originalMp3s: [],
    functionBandVideoLinks: [
      {
        url: "",
        title: "",
      },
    ],
    tscApprovedFunctionBandVideoLinks: [
      {
        url: "",
        title: "",
      },
    ],
    originalBandVideoLinks: [
      {
        url: "",
        title: "",
      },
    ],
    tscApprovedOriginalBandVideoLinks: [
      {
        url: "",
        title: "",
      },
    ],
    instrumentation: [
      {
        instrument: "",
        skill_level: "",
      },
    ],
    vocals: {
      type: "",
      gender: "",
      range: "",
      rap: "",
      genres: [],
    },
    repertoire: [],
    selectedSongs: [
      {
        title: "",
        artist: "",
        genre: "",
        year: "",
      },
    ],
    other_skills: [],
    logistics: [],
    vocalMics: {
      wireless_vocal_mics: "",
      wired_vocal_mics: "",
      wireless_vocal_adapters: "",
    },
    inEarMonitoring: {
      wired_in_ear_packs: "",
      wireless_in_ear_packs: "",
      in_ear_monitors: "",
    },
    additionalEquipment: {
      mic_stands: "",
      di_boxes: "",
      wireless_guitar_jacks: "",
    },
    instrumentMics: {
      extra_wired_instrument_mics: "",
      wireless_horn_mics: "",
      drum_mic_kit: "",
    },
    speechMics: {
      wireless_speech_mic: "",
      wired_speech_mic: "",
    },
    instrumentSpecs: [
      {
        name: "",
        wattage: "",
      },
    ],
signature: [],
    djing: {
      has_mixing_console: false,
      has_dj_table: false,
      has_dj_booth: false,
      has_mixing_decks: false,
    },
    //   drums: {
    //     acoustic: false,
    //     electric: false,
    //     percussion: false,
    //     cajon: false,
    //   },
    //   roaming: [
    //     {
    //       instrument: "",
    //       wireless_mic_or_jack: false,
    //       wireless_in_ear: false,
    //     },
    //   ],

    digitalWardrobeBlackTie: [],
    digitalWardrobeFormal: [],
    digitalWardrobeSmartCasual: [],
    digitalWardrobeSessionAllBlack: [],
    additionalImages: [],
    bank_account: {
      sort_code: "",
      account_number: "",
      account_name: "",
      account_type: "",
    },
    deputy_contract_agreed: "",
    deputy_contract_signed: "",
    dateRegistered: new Date(),
  });

  const [tscApprovedBio, setTscApprovedBio] = useState(formData?.tscApprovedBio || "");

  // 🧷 AUTOSAVE — hydrate saved form on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("deputyAutosave");
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
        console.log("🔄 Restored autosaved data");
      }
    } catch (e) {
      console.error("❌ Failed to restore autosave:", e);
    }
  }, []);

useEffect(() => {
  setFormData((prev) => ({
    ...prev,
    tscApprovedBio: tscApprovedBio || "",
  }));
}, [tscApprovedBio, setFormData]);

  const { id } = useParams();

  // keep formData in sync with the editor
  useEffect(() => {
    setFormData((prev) => ({ ...prev, tscApprovedBio }));
  }, [tscApprovedBio]);

useEffect(() => {
  const fetchDeputy = async () => {
    try {
      const url = `${backendUrl}/api/moderation/deputy/${id}`;
      console.log("🔎 Fetching deputy via:", url);

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      console.log("Deputy fetched:", res.data);

      const deputy = res.data?.deputy || res.data?.musician || null;
      if (!deputy) {
        console.warn("⚠️ No deputy object on response");
        return;
      }

      // Normalise some common nested bits
      const basicInfoFromDb = deputy.basicInfo || {
        firstName: deputy.firstName,
        lastName: deputy.lastName,
        phone: deputy.phone,
        email: deputy.email,
      };

      const addressFromDb = deputy.address || {};
      const bankFromDb = deputy.bank_account || {};

      setFormData((prev) => ({
        ...prev,
        // top-level primitive/array fields from DB win
        ...deputy,

        // but make sure nested structures exist
        basicInfo: {
          ...prev.basicInfo,
          ...basicInfoFromDb,
        },
        address: {
          ...prev.address,
          ...addressFromDb,
        },
        bank_account: {
          ...prev.bank_account,
          ...bankFromDb,
        },

        // keep existing dateRegistered if present, otherwise DB’s, otherwise now
        dateRegistered:
          deputy.dateRegistered || prev.dateRegistered || new Date(),

        // ensure these are arrays so your steps don't blow up
        academic_credentials: deputy.academic_credentials || prev.academic_credentials,
        function_bands_performed_with:
          deputy.function_bands_performed_with || prev.function_bands_performed_with,
        original_bands_performed_with:
          deputy.original_bands_performed_with || prev.original_bands_performed_with,
        sessions: deputy.sessions || prev.sessions,
        social_media_links: deputy.social_media_links || prev.social_media_links,
        instrumentation: deputy.instrumentation || prev.instrumentation,
        repertoire: deputy.repertoire || prev.repertoire,
        selectedSongs: deputy.selectedSongs || prev.selectedSongs,
        other_skills: deputy.other_skills || prev.other_skills,
        logistics: deputy.logistics || prev.logistics,
        digitalWardrobeBlackTie:
          deputy.digitalWardrobeBlackTie || prev.digitalWardrobeBlackTie,
        digitalWardrobeFormal:
          deputy.digitalWardrobeFormal || prev.digitalWardrobeFormal,
        digitalWardrobeSmartCasual:
          deputy.digitalWardrobeSmartCasual || prev.digitalWardrobeSmartCasual,
        digitalWardrobeSessionAllBlack:
          deputy.digitalWardrobeSessionAllBlack ||
          prev.digitalWardrobeSessionAllBlack,
        additionalImages: deputy.additionalImages || prev.additionalImages,

        // contract bits
        deputy_contract_signed:
          deputy.deputy_contract_signed || prev.deputy_contract_signed || "",
        deputy_contract_agreed:
          deputy.deputy_contract_agreed ?? prev.deputy_contract_agreed,
      }));

      // Hydrate TSC-approved bio editor
      setTscApprovedBio(
        deputy.tscApprovedBio || deputy.bio || ""
      );

      // If there's already a signature, treat it as drawn
      if (deputy.deputy_contract_signed) {
        setHasDrawnSignature(true);
      }

      // Cache the musician id locally so Sidebar can reuse it if needed
      if (deputy._id) {
        localStorage.setItem("musicianId", deputy._id);
      }
    } catch (err) {
      console.error("❌ Failed to fetch deputy:", err);
    }
  };

  if (id) fetchDeputy();
}, [id, token]);



  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        firstName: firstName,
        lastName: lastName,
        phone: phone,
      },
    }));
  }, [firstName, lastName, phone]);

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleChange = (updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async () => {
    setSubmissionInProgress(true);
    setShowSubmittingPopup(true);
    const popupMinTime = new Promise((resolve) => setTimeout(resolve, 3000));

    const { deletedImages = [] } = formData;
    for (const url of deletedImages) {
      try {
        await axios.post("/api/delete-image", { url });
      } catch (err) {
        console.error("Failed to delete image:", url, err);
      }
    }

    try {
      const form = new FormData();

      form.append("basicInfo", JSON.stringify(formData.basicInfo));
      form.append("email", formData.basicInfo?.email || "");

      form.append("role", formData.role);
      form.append("address", JSON.stringify(formData.address));
      if (formData.profilePicture instanceof Blob) {
        const file = new File([formData.profilePicture], "profile.jpg", {
          type: "image/jpeg",
        });
        setIsUploadingImages(true);
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
        });
        setIsUploadingImages(false);
        form.append("profilePicture", compressed);
        if (typeof formData.profilePicture === "string") {
          form.append("profilePicture", formData.profilePicture);
        }
      }
      if (formData.coverHeroImage instanceof Blob) {
        const file = new File([formData.coverHeroImage], "coverImage.jpg", {
          type: "image/jpeg",
        });
        setIsUploadingImages(true);
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
        });
        setIsUploadingImages(false);
        form.append("coverHeroImage", compressed);
        if (typeof formData.coverHeroImage === "string") {
          form.append("coverHeroImage", formData.coverHeroImage);
        }
      }
      // Universal keywords for image SEO (same as MP3 additionalKeywords)
      const imageKeywords = [
        "wedding bands",
        "wedding music bands",
        "wedding bands uk",
        "bands for hire",
        "wedding entertainment",
        "party bands for hire",
        "entertainment hire",
        "function band",
        "wedding party band",
        "wedding reception music",
        "hire a band",
        "band agency",
        "recommendations for wedding band",
        "unique wedding entertainment",
        "fun wedding entertainment",
        "wedding reception entertainment ideas",
        "party entertainment ideas for adults",
        "how much do bands cost to hire",
        "wedding entertainment ideas",
        "wedding entertainment ideas uk",
        "entertainers for hire",
      ];

      // Surround image compression/upload with isUploadingImages
      setIsUploadingImages(true);
      // Black Tie
      const compressedAndUploadedBlackTie = await renameAndCompressImage({
        images: formData.digitalWardrobeBlackTie.filter(
          (img) => typeof img !== "string"
        ),
        address: formData.address,
        additionalKeywords: [...imageKeywords],
      });
      const allBlackTie = [
        ...formData.digitalWardrobeBlackTie.filter(
          (img) => typeof img === "string"
        ),
        ...compressedAndUploadedBlackTie.filter(Boolean),
      ];
      allBlackTie.forEach((url) => form.append("digitalWardrobeBlackTie", url));

      // Formal
      const compressedAndUploadedFormal = await renameAndCompressImage({
        images: formData.digitalWardrobeFormal.filter(
          (img) => typeof img !== "string"
        ),
        address: formData.address,
        additionalKeywords: [...imageKeywords],
      });
      const allFormal = [
        ...formData.digitalWardrobeFormal.filter(
          (img) => typeof img === "string"
        ),
        ...compressedAndUploadedFormal.filter(Boolean),
      ];
      allFormal.forEach((url) => form.append("digitalWardrobeFormal", url));

      // Smart Casual
      const compressedAndUploadedSmartCasual = await renameAndCompressImage({
        images: formData.digitalWardrobeSmartCasual.filter(
          (img) => typeof img !== "string"
        ),
        address: formData.address,
        additionalKeywords: [...imageKeywords],
      });
      const allSmartCasual = [
        ...formData.digitalWardrobeSmartCasual.filter(
          (img) => typeof img === "string"
        ),
        ...compressedAndUploadedSmartCasual.filter(Boolean),
      ];
      allSmartCasual.forEach((url) =>
        form.append("digitalWardrobeSmartCasual", url)
      );

      // Session All Black
      const compressedAndUploadedAllBlack = await renameAndCompressImage({
        images: formData.digitalWardrobeSessionAllBlack.filter(
          (img) => typeof img !== "string"
        ),
        address: formData.address,
        additionalKeywords: [...imageKeywords],
      });
      const allAllBlack = [
        ...formData.digitalWardrobeSessionAllBlack.filter(
          (img) => typeof img === "string"
        ),
        ...compressedAndUploadedAllBlack.filter(Boolean),
      ];
      allAllBlack
        .filter(
          (url) =>
            typeof url === "string" &&
            url.trim() !== "" &&
            url.startsWith("http")
        )
        .forEach((url) => form.append("digitalWardrobeSessionAllBlack", url));
      // Additional Images
      const compressedAndUploadedAdditional = await renameAndCompressImage({
        images: formData.additionalImages.filter(
          (img) => typeof img !== "string"
        ),
        address: formData.address,
        additionalKeywords: [...imageKeywords],
      });
      const allAdditional = [
        ...formData.additionalImages.filter((img) => typeof img === "string"),
        ...compressedAndUploadedAdditional.filter(Boolean),
      ];
      allAdditional.forEach((url) => form.append("additionalImages", url));
      setIsUploadingImages(false);


      form.append(
        "function_bands_performed_with",
        JSON.stringify(formData.function_bands_performed_with)
      );
      form.append(
        "original_bands_performed_with",
        JSON.stringify(formData.original_bands_performed_with)
      );
      form.append("sessions", JSON.stringify(formData.sessions));
      form.append(
        "social_media_links",
        JSON.stringify(formData.social_media_links)
      );

      form.append(
        "functionBandVideoLinks",
        JSON.stringify(formData.functionBandVideoLinks)
      );
      form.append(
        "tscApprovedFunctionBandVideoLinks",
        JSON.stringify(formData.tscApprovedFunctionBandVideoLinks)
      );
      form.append(
        "originalBandVideoLinks",
        JSON.stringify(formData.originalBandVideoLinks)
      );
      form.append(
        "tscApprovedOriginalBandVideoLinks",
        JSON.stringify(formData.tscApprovedOriginalBandVideoLinks)
      );
      // Surround MP3 upload with isUploadingMp3s
      setIsUploadingMp3s(true);
      form.append("originalMp3s", JSON.stringify(formData.originalMp3s || []));
      form.append("coverMp3s", JSON.stringify(formData.coverMp3s || []));

      setIsUploadingMp3s(false);
      form.append("tagLine", formData.tagLine);
      form.append("bio", formData.bio);
      form.append("tscApprovedBio", formData.tscApprovedBio);

      form.append(
        "academic_credentials",
        JSON.stringify(formData.academic_credentials)
      );
      form.append("cableLogistics", JSON.stringify(formData.cableLogistics));
      form.append(
        "extensionCableLogistics",
        JSON.stringify(formData.extensionCableLogistics)
      );
      form.append("uplights", JSON.stringify(formData.uplights));
      form.append("tbars", JSON.stringify(formData.tbars));
      form.append("lightBars", JSON.stringify(formData.lightBars));
      form.append("discoBall", JSON.stringify(formData.discoBall));
      form.append("otherLighting", JSON.stringify(formData.otherLighting));
      form.append("paSpeakerSpecs", JSON.stringify(formData.paSpeakerSpecs));
      form.append("mixingDesk", JSON.stringify(formData.mixingDesk));
      form.append(
        "floorMonitorSpecs",
        JSON.stringify(formData.floorMonitorSpecs)
      );
      form.append("djEquipment", JSON.stringify(formData.djEquipment));
      form.append(
        "djEquipmentCategories",
        JSON.stringify(formData.djEquipmentCategories)
      );
      form.append(
        "agreementCheckboxes",
        JSON.stringify(formData.agreementCheckboxes)
      );
      form.append("djGearRequired", JSON.stringify(formData.djGearRequired));
 

// ✅ FIX vocals — ensure it's a valid JSON object, NOT stringified
const vocalsPayload = {
  type: formData.vocals?.type || [],
  gender: formData.vocals?.gender || "",
  range: formData.vocals?.range || "",
  rap: formData.vocals?.rap === true || formData.vocals?.rap === "true",
  genres: Array.isArray(formData.vocals?.genres) ? formData.vocals.genres : []
};

form.append("vocals", JSON.stringify(vocalsPayload));
      form.append("backline", JSON.stringify(formData.backline));

      form.append("awards", JSON.stringify(formData.awards));
      form.append("repertoire", JSON.stringify(formData.repertoire));
      form.append("selectedSongs", JSON.stringify(formData.selectedSongs));
      form.append("other_skills", JSON.stringify(formData.other_skills));
      form.append("logistics", JSON.stringify(formData.logistics));
      form.append("vocalMics", JSON.stringify(formData.vocalMics));
      form.append("inEarMonitoring", JSON.stringify(formData.inEarMonitoring));
      form.append(
        "additionalEquipment",
        JSON.stringify(formData.additionalEquipment)
      );
      form.append("instrumentMics", JSON.stringify(formData.instrumentMics));
      form.append("speechMics", JSON.stringify(formData.speechMics));
      form.append("instrumentSpecs", JSON.stringify(formData.instrumentSpecs));

      form.append("instrumentation", JSON.stringify(formData.instrumentation));

      form.append("djing", JSON.stringify(formData.djing));
      form.append("bank_account", JSON.stringify(formData.bank_account));
      form.append(
        "deputy_contract_agreed",
        JSON.stringify(formData.deputy_contract_agreed)
      ); // ✅ stringified
form.append(
  "dateRegistered",
  new Date(formData.dateRegistered).toISOString()
);      for (const key in formData) {
        if (
          [
            "profilePicture",
            "coverHeroImage",
            "basicInfo",
            "address",
            "role",
            "digitalWardrobeBlackTie",
            "digitalWardrobeFormal",
            "digitalWardrobeSmartCasual",
            "digitalWardrobeSessionAllBlack",
            "additionalImages",
            "functionBandVideoLinks",
            "tscApprovedFunctionBandVideoLinks",
            "originalBandVideoLinks",
            "tscApprovedOriginalBandVideoLinks",
            "coverMp3s",
            "originalMp3s",
            "bio",
            "tagLine",
            "tscApprovedBio",
            "backline",
            "academic_credentials",
            "cableLogistics",
            "extensionCableLogistics",
            "uplights",
            "tbars",
            "otherLighting",
            "discoBall",
            "djEquipment",
            "djEquipmentCategories",
            "agreementCheckboxes",
            "djGearRequired",
            "lightBars",
            "paSpeakerSpecs",
            "mixingDesk",
            "floorMonitorSpecs",
            "awards",
            "function_bands_performed_with",
            "original_bands_performed_with",
            "sessions",
            "social_media_links",
            "vocals",
            "repertoire",
            "selectedSongs",
            "other_skills",
            "logistics",
            "vocalMics",
            "inEarMonitoring",
            "additionalEquipment",
            "instrumentMics",
            "speechMics",
            "instrumentSpecs",
            "instrumentation",
            "lighting",
            "equipment_spec",
            "djing",
            "bank_account",
        
            "deputy_contract_signed",
            "deputy_contract_agreed",
            "dateRegistered",
          ].includes(key)
        )
          continue;

        if (
          typeof formData[key] === "object" &&
          !(formData[key] instanceof File) &&
          formData[key] !== null
        ) {
          form.append(key, JSON.stringify(formData[key]));
        } else if (formData[key] !== undefined) {
          form.append(key, formData[key]);
        }
      }

      console.log("🎵 Parsed originalMp3s:", formData.originalMp3s);
      form.append(
        "deputy_contract_signed",
        typeof formData.deputy_contract_signed === "string"
          ? formData.deputy_contract_signed
          : ""
      );

      // after you've appended everything to `form`
      console.group("📤 FormData -> /api/musician/moderation/register-deputy");
      for (const [k, v] of form.entries()) {
        if (v instanceof File || v instanceof Blob) {
          console.log(
            k,
            `(File) name=${v.name || "(blob)"} type=${
              v.type
            } sizeKB=${Math.round(v.size / 1024)}`
          );
        } else {
          console.log(k, v);
        }
      }
      console.groupEnd();

      const axiosResponsePromise = axios.post(
        `${backendUrl}/api/musician/moderation/register-deputy`,
        form,
        {
          headers: {
            token,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Wait for both to complete:
      const [response] = await Promise.all([
        axiosResponsePromise,
        popupMinTime,
      ]);

      // Now this will work safely:
      if (response?.data?.success) {
        const savedMusician = response.data.musician;
if (savedMusician?._id) {
  localStorage.setItem("musicianId", savedMusician._id);
  console.log("✅ Saved musicianId:", savedMusician._id);
}

        formData.deletedImages = [];

        // Show a different toast depending on whether updating or creating
        if (id) {
          toast(
            <CustomToast
              type="success"
              message="Profile submission updated successfully!"
            />
          );
        } else {
          toast(
            <CustomToast type="success" message="Profile submitted for approval!" />
          );
        }

        // Save deputy status in localStorage and redirect to homepage
        localStorage.setItem("deputyStatus", formData.status || "pending");

       // Decide redirect by environment
const redirectTo =
  import.meta.env.MODE === "production"
    ? `${import.meta.env.FRONTEND_URL}/musicians-dashboard`  // ✅ joins string safely
    : "http://localhost:5173";             // for local testing only

// Wait before redirecting to allow toast to appear
setTimeout(() => {
  window.location.href = redirectTo;
}, 2500);

      } else {
        toast(
          <CustomToast
            type="error"
            message={response?.data?.message || "Unknown error"}
          />
        );
      }
    } catch (err) {
      toast(<CustomToast type="error" message="Registration failed." />);
      console.error(err);
      if (err.name === "ValidationError") {
        console.error("❌ Mongoose validation error:", err.errors);
      }
    } finally {
      setSubmissionInProgress(false);
      setShowSubmittingPopup(false); // hide popup
    }
  };

  const renderStep = () => {
const stepProps = { formData }
    switch (step) {
      case 1:
        return (
          <DeputyStepOne
  formData={formData}
  setFormData={setFormData}     // REAL setter
  userRole={userRole}
  isUploadingImages={isUploadingImages}
  isUploadingMp3s={isUploadingMp3s}
  setIsUploadingMp3s={setIsUploadingMp3s}
/>
        );
      case 2:
        return (
        <DeputyStepTwo
      formData={formData}
      setFormData={setFormData}    // <-- the REAL setter
      userRole={userRole}
      tscApprovedBio={tscApprovedBio}
      setTscApprovedBio={setTscApprovedBio}
    />
        );
      case 3:
        return (
          <DeputyStepThree
            formData={formData}
            setFormData={setFormData}
            userRole={userRole}
            {...stepProps}
          />
        );
      case 4:
        return (
          <DeputyStepFour
            formData={formData}
            setFormData={setFormData}
            userRole={userRole}
            deputyId={deputyId}
            
            {...stepProps}
          />
        );
      case 5:
        return (
          <DeputyStepFive
            formData={formData}
            setFormData={setFormData}
            userRole={userRole}
            {...stepProps}
          />
        );
      case 6:
        return (
          <DeputyStepSix
            formData={formData}
            setFormData={setFormData}
            userRole={userRole}
            setHasDrawnSignature={setHasDrawnSignature}
            {...stepProps}
          />
        );
      default:
        return null;
    }
  };

  const [canSubmit, setCanSubmit] = useState(false);

  useEffect(() => {
    // Normalize agreement checkboxes and support legacy typo `provacyPolicy`
    const rawAgreement =
      (Array.isArray(formData.agreementCheckboxes) &&
        formData.agreementCheckboxes[0]) ||
      {};
    const agreement = {
      termsAndConditions: Boolean(rawAgreement.termsAndConditions),
      privacyPolicy:
        typeof rawAgreement.privacyPolicy === "boolean"
          ? rawAgreement.privacyPolicy
          : Boolean(rawAgreement.provacyPolicy),
    };

    const isSignaturePresent = hasDrawnSignature === true;

    const canSubmitNow =
      step === totalSteps &&
      isSignaturePresent &&
      agreement.termsAndConditions &&
      agreement.privacyPolicy;

    console.log("🔍 Recomputing canSubmit...");
    console.log("🔍 step:", step);
    console.log("🔍 hasDrawnSignature (state):", hasDrawnSignature);
    console.log("🔍 termsAndConditions:", agreement.termsAndConditions);
    console.log("🔍 privacyPolicy:", agreement.privacyPolicy);
    console.log("✅ canSubmit:", canSubmitNow);

    setCanSubmit(canSubmitNow);
  }, [step, hasDrawnSignature, formData.agreementCheckboxes]);

  console.log("🎼 SUBMITTING MP3S:");
  console.log("🎧 coverMp3s:", formData.coverMp3s);
  console.log("🎧 originalMp3s:", formData.originalMp3s);

  // 🧷 AUTOSAVE — save to localStorage every time formData changes (debounced)
  useEffect(() => {
    const handler = setTimeout(() => {
      try {
        // Safe deep clone (ignores Blobs, Files, Window, Functions, Cyclic refs)
        const safe = JSON.parse(
          JSON.stringify(formData, (key, value) => {
            if (value instanceof File) return undefined;
            if (value instanceof Blob) return undefined;
            if (typeof value === "function") return undefined;
            if (value === window) return undefined;
            return value;
          })
        );
        // remove Blobs from digital wardrobe / additionalImages
        safe.digitalWardrobeBlackTie = safe.digitalWardrobeBlackTie?.filter(x => typeof x === "string") || [];
        safe.digitalWardrobeFormal = safe.digitalWardrobeFormal?.filter(x => typeof x === "string") || [];
        safe.digitalWardrobeSmartCasual = safe.digitalWardrobeSmartCasual?.filter(x => typeof x === "string") || [];
        safe.digitalWardrobeSessionAllBlack = safe.digitalWardrobeSessionAllBlack?.filter(x => typeof x === "string") || [];
        safe.additionalImages = safe.additionalImages?.filter(x => typeof x === "string") || [];

        localStorage.setItem("deputyAutosave", JSON.stringify(safe));
        const ts = new Date().toLocaleTimeString();
        setAutosaveStatus(`Autosaved at ${ts}`);
        console.log("💾 Autosaved deputy form:", safe);
      } catch (err) {
        console.error("❌ Autosave failed:", err);
      }
    }, 800); // debounce 0.8s

    return () => clearTimeout(handler);
  }, [formData]);

  // 🔍 DEBUG: Track ALL formData changes live
useEffect(() => {
  const safe = JSON.parse(
    JSON.stringify(formData, (key, value) => {
      if (value instanceof File) return `[File:${value.name}]`;
      if (value instanceof Blob) return `[Blob]`;
      return value;
    })
  );

  console.log("🟦 DeputyForm — formData changed (safe):", safe);
}, [formData]);

  

  return (
    <>
      {submissionInProgress && (
        <div className="fixed inset-0 bg-white bg-opacity-80 flex justify-center items-center z-50">
          <div className="text-center">
            <p className="text-lg font-semibold mb-4">
              Submitting your registration...
            </p>
            <div className="w-64 bg-gray-200 rounded-full h-3">
              <div
                className="bg-black h-3 rounded-full animate-pulse"
                style={{ width: "100%" }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow p-6 rounded w-full max-w-4xl mx-auto">
        <div className="text-sm text-gray-600 font-semibold mb-2 text-center">
          Step {step} of {totalSteps}
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-black transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
        {autosaveStatus && (
          <div className="text-xs text-gray-500 text-right mb-2 italic">
            {autosaveStatus}
          </div>
        )}

        {renderStep()}

        <div className="flex flex-col min-h-[300px] justify-between mt-6">
          {step < totalSteps ? (
            <div className="flex justify-between">
              {step > 1 ? (
                <button
                  className="px-4 py-2 bg-black hover:bg-[#ff6667] text-white max-h-10 "
                  onClick={handleBack}
                >
                  Back
                </button>
              ) : (
                <div></div>
              )}
              <button
                className="px-4 py-2 bg-black hover:bg-[#ff6667] text-white max-h-10"
                onClick={handleNext}
              >
                Next
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-between mt-6">
                <button
                  className="px-4 py-2 bg-black hover:bg-[#ff6667] text-white max-h-10 "
                  onClick={handleBack}
                >
                  Back
                </button>
                <button
                  className={`px-4 py-2 text-white max-h-10 ${
                    canSubmit
                      ? "bg-black hover:bg-[#ff6667]"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                >
                  Submit
                </button>
              </div>
            </>
          )}
        </div>
        {showSubmittingPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg text-center">
              <p className="text-lg font-semibold">Submitting your form...</p>
              <p className="text-sm mt-2 text-gray-500">
                Please wait a moment.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DeputyForm;
