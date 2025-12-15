import { useParams, useLocation, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useMemo } from "react";
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
  const DASHBOARD_ROUTE = isModerationMode ? "/moderate-deputies" : "/dashboard"; // change if needed

const [showSuccessPopup, setShowSuccessPopup] = useState(false);
const [successPopupMessage, setSuccessPopupMessage] = useState("");

    // Handles final form submission for step 6
const handleSubmit = async () => {
  try {
    setSubmissionInProgress(true);

    // --- normalize agreement shape ---
    const rawAgree = (Array.isArray(formData.agreementCheckboxes) && formData.agreementCheckboxes[0]) || {};
    const agreementCheckboxes = [{
      termsAndConditions: Boolean(rawAgree.termsAndConditions),
      privacyPolicy: Boolean(rawAgree.privacyPolicy),
    }];

    // optional: also populate the simple boolean the backend supports
    const deputyContractAgreed =
      agreementCheckboxes[0].termsAndConditions && agreementCheckboxes[0].privacyPolicy;

    const fd = new FormData();

    // helper: JSON fields the backend safeParses
    const appendJSON = (key, value) => fd.append(key, JSON.stringify(value ?? null));

    // IMPORTANT: basicInfo must arrive (your backend derives email from it)
    appendJSON("basicInfo", formData.basicInfo);
    appendJSON("address", formData.address);
    appendJSON("bank_account", formData.bank_account);
    appendJSON("academic_credentials", formData.academic_credentials);
    appendJSON("agreementCheckboxes", agreementCheckboxes);

    appendJSON("vocalMics", formData.vocalMics);
    appendJSON("inEarMonitoring", formData.inEarMonitoring);
    appendJSON("instrumentMics", formData.instrumentMics);
    appendJSON("speechMics", formData.speechMics);
    appendJSON("instrumentation", formData.instrumentation);
    appendJSON("awards", formData.awards);
    appendJSON("sessions", formData.sessions);
    appendJSON("function_bands_performed_with", formData.function_bands_performed_with);
    appendJSON("original_bands_performed_with", formData.original_bands_performed_with);
    appendJSON("social_media_links", formData.social_media_links);
    appendJSON("selectedSongs", formData.selectedSongs);
    appendJSON("other_skills", formData.other_skills);
    appendJSON("logistics", formData.logistics);

    appendJSON("functionBandVideoLinks", formData.functionBandVideoLinks);
    appendJSON("tscApprovedFunctionBandVideoLinks", formData.tscApprovedFunctionBandVideoLinks);
    appendJSON("originalBandVideoLinks", formData.originalBandVideoLinks);
    appendJSON("tscApprovedOriginalBandVideoLinks", formData.tscApprovedOriginalBandVideoLinks);

    appendJSON("cableLogistics", formData.cableLogistics);
    appendJSON("extensionCableLogistics", formData.extensionCableLogistics);
    appendJSON("uplights", formData.uplights);
    appendJSON("tbars", formData.tbars);
    appendJSON("lightBars", formData.lightBars);
    appendJSON("discoBall", formData.discoBall);
    appendJSON("otherLighting", formData.otherLighting);
    appendJSON("paSpeakerSpecs", formData.paSpeakerSpecs);
    appendJSON("backline", formData.backline);
    appendJSON("mixingDesk", formData.mixingDesk);
    appendJSON("floorMonitorSpecs", formData.floorMonitorSpecs);
    appendJSON("djEquipment", formData.djEquipment);
    appendJSON("djEquipmentCategories", formData.djEquipmentCategories);
    appendJSON("djGearRequired", formData.djGearRequired);
    appendJSON("instrumentSpecs", formData.instrumentSpecs);

    appendJSON("vocals", formData.vocals);

    // simple string fields
    fd.append("role", formData.role || "");
    fd.append("status", formData.status || "pending");
    fd.append("bio", formData.bio || "");
    fd.append("tscApprovedBio", formData.tscApprovedBio || "");
    fd.append("tagLine", formData.tagLine || "");
    fd.append("customRepertoire", formData.customRepertoire || "");

    // contracts/signature
    fd.append("deputy_contract_signed", formData.deputy_contract_signed || "");
    fd.append("deputy_contract_agreed", String(deputyContractAgreed));

    // These 3 fields are NOT safeParsed on backend (you use urlArray directly),
    // so send them as repeated string fields (not JSON).
    (formData.digitalWardrobeBlackTie || []).forEach((u) => fd.append("digitalWardrobeBlackTie", u));
    (formData.digitalWardrobeFormal || []).forEach((u) => fd.append("digitalWardrobeFormal", u));
    (formData.digitalWardrobeSmartCasual || []).forEach((u) => fd.append("digitalWardrobeSmartCasual", u));
    (formData.digitalWardrobeSessionAllBlack || []).forEach((u) => fd.append("digitalWardrobeSessionAllBlack", u));
    (formData.additionalImages || []).forEach((u) => fd.append("additionalImages", u));

    // If you still have Files in state, append them so multer can see them:
    if (formData.profilePicture instanceof File) fd.append("profilePicture", formData.profilePicture);
    if (formData.coverHeroImage instanceof File) fd.append("coverHeroImage", formData.coverHeroImage);

    // MP3 files if present in your { file, title } objects
    (formData.coverMp3s || []).forEach((m) => {
      if (m?.file instanceof File) fd.append("coverMp3s", m.file);
    });
    (formData.originalMp3s || []).forEach((m) => {
      if (m?.file instanceof File) fd.append("originalMp3s", m.file);
    });

    const res = await axios.post(
      `${backendUrl}/api/musician/moderation/register-deputy`,
      fd,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.data?.success) {
      // Decide which message to show
      const msg = isEdit
        ? "✅ Your updates have been received."
        : "✅ Your application has been received.";

      setSuccessPopupMessage(msg);
      setShowSuccessPopup(true);

      // optional toast too
      toast(<CustomToast type="success" message={res.data?.message || "Submitted"} />);

      // Redirect after a short pause
      setTimeout(() => {
        setShowSuccessPopup(false);
        navigate(DASHBOARD_ROUTE);
      }, 1200);

      return;
    }

    toast(<CustomToast type="error" message={res.data?.message || "Failed to submit"} />);
  } catch (err) {
    console.error(err);
    const msg =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      "Failed to submit";
    toast(<CustomToast type="error" message={msg} />);
  } finally {
    setSubmissionInProgress(false);
    setShowSubmittingPopup(false);
  }
};


  /* --------------------------------- helpers -------------------------------- */
  const isObjectId = (s) => /^[0-9a-fA-F]{24}$/.test(s || "");
  const location = useLocation();
  const navigate = useNavigate();
  const isModerationMode =
    location.pathname.includes("moderate-deputy") || (userRole || "").toLowerCase() === "agent";

  const { id: routeId } = useParams();

  // derive a safe id to load
  const deputyId = useMemo(() => {
    if (isObjectId(routeId)) return routeId;
    const fromLS = localStorage.getItem("musicianId") || localStorage.getItem("userId");
    return isObjectId(fromLS) ? fromLS : null;
  }, [routeId]);

  console.log(
    "🎸 LIVE DeputyForm Loaded — VERSION: DeputyForm",
    "2025-12-02 12:00",
    "— module:",
    import.meta.url
  );

  const totalSteps = 6;
  // Persist step in localStorage
  const [step, setStep] = useState(() => {
    const savedStep = Number(localStorage.getItem("deputyStep"));
    return savedStep && savedStep >= 1 && savedStep <= totalSteps ? savedStep : 1;
  });
  // Add tscApprovedBio state for moderation/step 2
  const [tscApprovedBio, setTscApprovedBio] = useState("");
  const isEdit = Boolean(deputyId);

  // Uploading state indicators
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isUploadingMp3s, setIsUploadingMp3s] = useState(false);
  const [submissionInProgress, setSubmissionInProgress] = useState(false);
  const [showSubmittingPopup, setShowSubmittingPopup] = useState(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState("");

  // Track if autosave was restored to prevent overwrites
  const [hasRestoredAutosave, setHasRestoredAutosave] = useState(false);
  const [hasHydratedFromBackend, setHasHydratedFromBackend] = useState(false);

  /* ------------------------------ formData state ----------------------------- */
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
    customRepertoire: "",
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
  });

  // Backend hydration
  useEffect(() => {
    if (!deputyId) {
      console.warn("⚠️ No valid deputyId; skipping hydration");
      return;
    }

    (async () => {
      try {
        const url = `${backendUrl}/api/moderation/deputy/${deputyId}`;
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        const deputy = res.data?.deputy || res.data?.musician || null;

        if (!deputy) return;

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
          ...deputy,
            profilePicture: deputy.profilePicture || deputy.profilePhoto || prev.profilePicture,

          basicInfo: { ...prev.basicInfo, ...basicInfoFromDb },
          address: { ...prev.address, ...addressFromDb },
          bank_account: { ...prev.bank_account, ...bankFromDb },
          
          dateRegistered: deputy.dateRegistered || prev.dateRegistered || new Date(),
          academic_credentials: deputy.academic_credentials || prev.academic_credentials,
          function_bands_performed_with: deputy.function_bands_performed_with || prev.function_bands_performed_with,
          original_bands_performed_with: deputy.original_bands_performed_with || prev.original_bands_performed_with,
          sessions: deputy.sessions || prev.sessions,
          social_media_links: deputy.social_media_links || prev.social_media_links,
          instrumentation: deputy.instrumentation || prev.instrumentation,
          customRepertoire: deputy.customRepertoire || prev.customRepertoire,
          selectedSongs: deputy.selectedSongs || prev.selectedSongs,
          other_skills: deputy.other_skills || prev.other_skills,
          logistics: deputy.logistics || prev.logistics,
          digitalWardrobeBlackTie: deputy.digitalWardrobeBlackTie || prev.digitalWardrobeBlackTie,
          digitalWardrobeFormal: deputy.digitalWardrobeFormal || prev.digitalWardrobeFormal,
          digitalWardrobeSmartCasual: deputy.digitalWardrobeSmartCasual || prev.digitalWardrobeSmartCasual,
          digitalWardrobeSessionAllBlack: deputy.digitalWardrobeSessionAllBlack || prev.digitalWardrobeSessionAllBlack,
          additionalImages: deputy.additionalImages || prev.additionalImages,
          deputy_contract_signed: deputy.deputy_contract_signed || prev.deputy_contract_signed || "",
          deputy_contract_agreed: deputy.deputy_contract_agreed ?? prev.deputy_contract_agreed,
        }));

        setTscApprovedBio(deputy.tscApprovedBio || deputy.bio || "");
        if (deputy.deputy_contract_signed) setHasDrawnSignature(true);
        if (deputy._id) localStorage.setItem("musicianId", deputy._id);
        setHasHydratedFromBackend(true);
      } catch (err) {
        console.error("❌ Failed to fetch deputy:", err);
      }
    })();
  }, [deputyId, token]);

  // Autosave hydration
  useEffect(() => {
    if (hasHydratedFromBackend) return;
    try {
      const saved = localStorage.getItem("deputyAutosave");
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData((prev) => {
          // Deep merge for nested objects
          const merged = { ...prev };
          for (const key in parsed) {
            if (
              parsed[key] !== null &&
              parsed[key] !== undefined &&
              !(typeof parsed[key] === "string" && parsed[key].trim() === "")
            ) {
              // Never restore file fields from autosave
              if (["profilePicture", "coverHeroImage"].includes(key)) {
                merged[key] = null;
              } else if (
                typeof parsed[key] === "object" &&
                !Array.isArray(parsed[key]) &&
                parsed[key] !== null &&
                typeof merged[key] === "object" &&
                merged[key] !== null
              ) {
                if (key === "address") {
                  merged[key] = { ...prev.address, ...parsed.address };
                } else {
                  merged[key] = { ...merged[key], ...parsed[key] };
                }
              } else {
                merged[key] = parsed[key];
              }
            }
          }
          return merged;
        });
        setHasRestoredAutosave(true);
        console.log("🔄 Restored autosaved data (deep merge, no files):", parsed);
      }
    } catch (e) {
      console.error("❌ Failed to restore autosave:", e);
    }
  }, [firstName, lastName, phone, email, hasRestoredAutosave, hasHydratedFromBackend]);

  /* -------------------------------- nav helpers ------------------------------ */

  const handleNext = () => {
    if (step < totalSteps) {
      setStep((prev) => {
        const nextStep = prev + 1;
        localStorage.setItem("deputyStep", nextStep);
        return nextStep;
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => {
        const prevStep = prev - 1;
        localStorage.setItem("deputyStep", prevStep);
        return prevStep;
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Keep localStorage in sync if step changes elsewhere
  useEffect(() => {
    localStorage.setItem("deputyStep", step);
  }, [step]);

  /* --------------------------------- steps UI ------------------------------- */
  const renderStep = () => {
    const stepProps = { formData };
    switch (step) {
      case 1:
        return (
          <>
            {["profilePicture", "coverHeroImage"].some(
              (f) => formData[f] === null
            ) && (
              <div style={{ color: "#b45309", fontSize: 13, marginBottom: 8 }}>
                Note: File uploads (profile/cover images) cannot be restored from autosave. Please re-upload if needed after a refresh.
              </div>
            )}
          <DeputyStepOne
  formData={formData}
  setFormData={setFormData}
  userRole={userRole}
  isUploadingImages={isUploadingImages}
  setIsUploadingImages={setIsUploadingImages}   // ✅ ADD THIS
  isUploadingMp3s={isUploadingMp3s}
  setIsUploadingMp3s={setIsUploadingMp3s}
/>
          </>
        );
      case 2:
        return (
          <DeputyStepTwo
            formData={formData}
            setFormData={setFormData}
            userRole={userRole}
            tscApprovedBio={tscApprovedBio}
            setTscApprovedBio={setTscApprovedBio}
          />
        );
      case 3:
        return <DeputyStepThree formData={formData} setFormData={setFormData} userRole={userRole} {...stepProps} />;
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
        return <DeputyStepFive formData={formData} setFormData={setFormData} userRole={userRole} {...stepProps} />;
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
    if (isModerationMode) {
      setCanSubmit(true);
      return;
    }

    const rawAgreement = (Array.isArray(formData.agreementCheckboxes) && formData.agreementCheckboxes[0]) || {};
    const agreement = {
      termsAndConditions: Boolean(rawAgreement.termsAndConditions),
      privacyPolicy:
        typeof rawAgreement.privacyPolicy === "boolean"
          ? rawAgreement.privacyPolicy
          : Boolean(rawAgreement.privacyPolicy),
    };

    // Consider signature present if formData.signature is a non-empty array, non-empty string, or non-empty object (for signature pad libraries)
    let isSignaturePresent = false;
    // Debug: log signature value and type
    console.log('[DEBUG] formData.signature value:', formData.signature, 'type:', typeof formData.signature);
    if (Array.isArray(formData.signature)) {
      // If signature is an array, check if any element is a non-empty string (base64 or SVG path)
      isSignaturePresent = formData.signature.some(
        (item) => (typeof item === 'string' && item.trim().length > 0) || (typeof item === 'object' && Object.keys(item).length > 0)
      );
    } else if (typeof formData.signature === "string") {
      isSignaturePresent = formData.signature.trim().length > 0;
    } else if (formData.signature && typeof formData.signature === "object") {
      // Check for base64 or data property (common for signature pad)
      if (formData.signature.data && Array.isArray(formData.signature.data)) {
        isSignaturePresent = formData.signature.data.length > 0;
      } else if (formData.signature.base64 && typeof formData.signature.base64 === "string") {
        isSignaturePresent = formData.signature.base64.trim().length > 0;
      } else if (Object.keys(formData.signature).length > 0) {
        isSignaturePresent = true;
      }
    }
    const canSubmitNow = step === totalSteps && isSignaturePresent && agreement.termsAndConditions && agreement.privacyPolicy;

    // Debug output for submit enable logic
    console.log("[DEBUG] Submit enable logic:", {
      step,
      totalSteps,
      isSignaturePresent,
      termsAndConditions: agreement.termsAndConditions,
      privacyPolicy: agreement.privacyPolicy,
      canSubmitNow
    });

    setCanSubmit(canSubmitNow);
  }, [step, hasDrawnSignature, formData.agreementCheckboxes, isModerationMode]);

  console.log("🎼 SUBMITTING MP3S:");
  console.log("🎧 coverMp3s:", formData.coverMp3s);
  console.log("🎧 originalMp3s:", formData.originalMp3s);

  /* ----------------------- AUTOSAVE to localStorage (debounced) -------------- */
 useEffect(() => {
  const handler = setTimeout(() => {
    try {
      const safe = JSON.parse(
        JSON.stringify(formData, (key, value) => {
          if (value instanceof File) return undefined;
          if (value instanceof Blob) return undefined;
          if (typeof value === "function") return undefined;
          if (value === window) return undefined;
          return value;
        })
      );

      // strip any blobs that might sneak into wardrobes/images
      safe.digitalWardrobeBlackTie =
        safe.digitalWardrobeBlackTie?.filter((x) => typeof x === "string") || [];
      safe.digitalWardrobeFormal =
        safe.digitalWardrobeFormal?.filter((x) => typeof x === "string") || [];
      safe.digitalWardrobeSmartCasual =
        safe.digitalWardrobeSmartCasual?.filter((x) => typeof x === "string") || [];
      safe.digitalWardrobeSessionAllBlack =
        safe.digitalWardrobeSessionAllBlack?.filter((x) => typeof x === "string") || [];
      safe.additionalImages =
        safe.additionalImages?.filter((x) => typeof x === "string") || [];

      // local autosave
      localStorage.setItem("deputyAutosave", JSON.stringify(safe));

      // backend autosave (server archives previous)
      ;(async () => {
        try {
          if (!deputyId) return;

          const snapshotStr = JSON.stringify(safe);
          let hash = 0;
          for (let i = 0; i < snapshotStr.length; i++) {
            hash = (hash * 31 + snapshotStr.charCodeAt(i)) | 0;
          }

          await axios.post(
            `${backendUrl}/api/musician/autosave`,
            {
              musicianId: deputyId,
              formKey: "deputy",
              snapshot: safe,
              snapshotHash: String(hash),
              updatedAtIso: new Date().toISOString(),
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (e) {
          console.warn(
            "⚠️ Backend autosave failed (non-blocking):",
            e?.message || e
          );
        }
      })();

      const ts = new Date().toLocaleTimeString();
      setAutosaveStatus(`Autosaved at ${ts}`);
      console.log("💾 Autosaved deputy form:", safe);
    } catch (err) {
      console.error("❌ Autosave failed:", err);
    }
  }, 800);

  return () => clearTimeout(handler);
}, [formData, deputyId, token, backendUrl]);

  /* ---------------------------- DEBUG: track changes -------------------------- */
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

  /* ----------------------------- moderation actions -------------------------- */
  const handleSaveAndExitModeration = async () => {
    try {
      if (!deputyId) {
        toast(<CustomToast type="error" message="Missing deputy id" />);
        return;
      }

      // safe clone without Files/Blobs
      const safe = JSON.parse(
        JSON.stringify(formData, (k, v) => {
          if (v instanceof File || v instanceof Blob) return undefined;
          if (typeof v === "function") return undefined;
          return v;
        })
      );

      const res = await axios.patch(`${backendUrl}/api/musician/moderation/deputy/${deputyId}/save`, safe, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        toast(<CustomToast type="success" message="Changes saved" />);
        navigate("/moderate-deputies");
      } else {
        toast(<CustomToast type="error" message={res.data?.message || "Failed to save"} />);
      }
    } catch (err) {
      console.error(err);
      toast(<CustomToast type="error" message="Failed to save" />);
    }
  };

  const handleApproveDeputy = async () => {
    try {
      if (!deputyId) return;
      const res = await axios.post(
        `${backendUrl}/api/approve-deputy`,
        { id: deputyId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        toast(<CustomToast type="success" message={res.data.message || "Deputy approved"} />);
        navigate("/moderate-deputies");
      } else {
        toast(<CustomToast type="error" message={res.data?.message || "Failed to approve"} />);
      }
    } catch (err) {
      console.error(err);
      toast(<CustomToast type="error" message="Failed to approve" />);
    }
  };

  /* --------------------------------- render --------------------------------- */
  return (
    <>
      {submissionInProgress && (
        <div className="fixed inset-0 bg-white bg-opacity-80 flex justify-center items-center z-50">
          <div className="text-center">
            <p className="text-lg font-semibold mb-4">Submitting your registration...</p>
            <div className="w-64 bg-gray-200 rounded-full h-3">
              <div className="bg-black h-3 rounded-full animate-pulse" style={{ width: "100%" }}></div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow p-6 rounded w-full max-w-4xl mx-auto">
        <div className="text-sm text-gray-600 font-semibold mb-2 text-center">
          Step {step} of {totalSteps}
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-black transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>
        {autosaveStatus && <div className="text-xs text-gray-500 text-right mb-2 italic">{autosaveStatus}</div>}

        {renderStep()}

        <div className="flex flex-col min-h-[300px] justify-between mt-6">
          {step < totalSteps ? (
            // Steps 1–5: show Back/Next
            <div className="flex justify-between mt-6">
              {step > 1 ? (
                <button className="px-4 py-2 bg-black hover:bg-[#ff6667] text-white max-h-10" onClick={handleBack}>
                  Back
                </button>
              ) : (
                <div />
              )}

              <button className="px-4 py-2 bg-black hover:bg-[#ff6667] text-white max-h-10" onClick={handleNext}>
                Next
              </button>
            </div>
          ) : isModerationMode ? (
            // Step 6 (final): Moderation actions
            <div className="flex justify-between mt-6">
              <button className="px-4 py-2 bg-black hover:bg-[#ff6667] text-white max-h-10" onClick={handleBack}>
                Back
              </button>

              <div className="flex gap-2">
                <button className="px-4 py-2 border border-gray-400 rounded max-h-10" onClick={handleSaveAndExitModeration}>
                  Save &amp; Exit
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded max-h-10" onClick={handleApproveDeputy}>
                  Approve
                </button>
              </div>
            </div>
          ) : (
            // Step 6 (final): Submit
            <div className="flex justify-between mt-6">
              <button className="px-4 py-2 bg-black hover:bg-[#ff6667] text-white max-h-10" onClick={handleBack}>
                Back
              </button>
              <button
                className={`px-4 py-2 text-white max-h-10 ${canSubmit ? "bg-black hover:bg-[#ff6667]" : "bg-gray-400 cursor-not-allowed"}`}
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                Submit
              </button>
            </div>
          )}
        </div>

       {showSuccessPopup && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 shadow-lg text-center max-w-sm w-full">
      <p className="text-lg font-semibold">{successPopupMessage}</p>
      <p className="text-sm mt-2 text-gray-500">Redirecting you to your dashboard…</p>
    </div>
  </div>
)}
      </div>
    </>
  );
};

export default DeputyForm;
