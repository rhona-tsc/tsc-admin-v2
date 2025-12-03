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

  const [step, setStep] = useState(1);
  const isEdit = Boolean(deputyId);
  const totalSteps = 6;

  // Uploading state indicators
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isUploadingMp3s, setIsUploadingMp3s] = useState(false);
  const [submissionInProgress, setSubmissionInProgress] = useState(false);
  const [showSubmittingPopup, setShowSubmittingPopup] = useState(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState("");

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

  /* ------------------------------ Debug helpers ----------------------------- */

const makeRequestId = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `req_${Date.now()}_${Math.random().toString(16).slice(2)}`);

const tryParseJSON = (s) => {
  if (typeof s !== "string") return s;
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
};

// Summarise FormData (parse JSON strings, replace files with meta)
const summarizeFormData = (fd) => {
  const out = {};
  for (const [k, v] of fd.entries()) {
    if (v instanceof File || v instanceof Blob) {
      out[k] = { _type: "file", name: v.name || "(blob)", type: v.type, sizeKB: Math.round((v.size || 0) / 1024) };
    } else {
      out[k] = tryParseJSON(v);
    }
  }
  return out;
};

// Minify big arrays/objects for logging
const preview = (obj, limits = {}) => {
  const {
    maxArray = 5,
    maxString = 400,
    elideKeys = [], // keys to skip entirely
  } = limits;

  const seen = new WeakSet();
  const shrink = (val) => {
    if (val && typeof val === "object") {
      if (seen.has(val)) return "[Circular]";
      seen.add(val);
    }
    if (Array.isArray(val)) {
      const head = val.slice(0, maxArray).map(shrink);
      const extra = val.length - head.length;
      return extra > 0 ? [...head, `…(+${extra})`] : head;
    }
    if (val && typeof val === "object") {
      const out = {};
      Object.keys(val).forEach((k) => {
        if (elideKeys.includes(k)) return;
        out[k] = shrink(val[k]);
      });
      return out;
    }
    if (typeof val === "string" && val.length > maxString) {
      return val.slice(0, maxString) + "…";
    }
    return val;
  };
  return shrink(obj);
};

  /* ------------------------- lift state changes to children ------------------ */
  useEffect(() => {
    console.log("📡 DeputyForm state sent to child step components:", formData);
  }, [formData]);

  const [tscApprovedBio, setTscApprovedBio] = useState(formData?.tscApprovedBio || "");

  /* --------------------------- hydrate from server --------------------------- */
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

      console.groupCollapsed("🔎 Hydration fetch — deputy", { deputyId, url });
      if (deputy) {
        const summary = preview(deputy, {
          maxArray: 3,
          maxString: 600,
          elideKeys: ["__v", "password", "salt"],
        });
        console.log("Fetched deputy summary:", summary);
        console.log("Raw keys:", Object.keys(deputy));
        // keep a handle in window for quick inspection:
        window.__lastDeputyFetched = deputy;
      } else {
        console.log("No deputy found in response.");
      }
      console.groupEnd();

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
        repertoire: deputy.repertoire || prev.repertoire,
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
    } catch (err) {
      console.error("❌ Failed to fetch deputy:", err);
    }
  })();
}, [deputyId, token]);

  /* ----------------------------- hydrate autosave ---------------------------- */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("deputyAutosave");
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({ ...prev, ...parsed }));
        console.log("🔄 Restored autosaved data");
      }
    } catch (e) {
      console.error("❌ Failed to restore autosave:", e);
    }
  }, []);

  /* --------------------- keep tscApprovedBio in sync to form ----------------- */
  useEffect(() => {
    setFormData((prev) => ({ ...prev, tscApprovedBio: tscApprovedBio || "" }));
  }, [tscApprovedBio]);

  /* ------------------ keep basic info in sync with top-level props ----------- */
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        email: email,
      },
    }));
  }, [firstName, lastName, phone, email]);

  /* -------------------------------- nav helpers ------------------------------ */
  const handleNext = () => {
    if (step < totalSteps) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleChange = (updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  /* -------------------------------- submission ------------------------------- */
  const handleSubmit = async () => {
    setSubmissionInProgress(true);
    setShowSubmittingPopup(true);
    const popupMinTime = new Promise((resolve) => setTimeout(resolve, 3000));


      // Create correlation id
  const requestId = makeRequestId();
  const sentAt = new Date().toISOString();

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

      form.append("_requestId", requestId);
    form.append("_sentAt", sentAt);
    form.append("_clientRoute", window.location.pathname);


      // basics
      form.append("basicInfo", JSON.stringify(formData.basicInfo));
      form.append("email", formData.basicInfo?.email || "");
      form.append("role", formData.role || "");
      form.append("address", JSON.stringify(formData.address || {}));

      // profile picture
      if (formData.profilePicture) {
        if (formData.profilePicture instanceof Blob || formData.profilePicture instanceof File) {
          setIsUploadingImages(true);
          const file =
            formData.profilePicture instanceof File
              ? formData.profilePicture
              : new File([formData.profilePicture], "profile.jpg", { type: "image/jpeg" });
          const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920 });
          form.append("profilePicture", compressed);
          setIsUploadingImages(false);
        } else if (typeof formData.profilePicture === "string") {
          form.append("profilePicture", formData.profilePicture);
        }
      }

      // cover hero image
      if (formData.coverHeroImage) {
        if (formData.coverHeroImage instanceof Blob || formData.coverHeroImage instanceof File) {
          setIsUploadingImages(true);
          const file =
            formData.coverHeroImage instanceof File
              ? formData.coverHeroImage
              : new File([formData.coverHeroImage], "coverImage.jpg", { type: "image/jpeg" });
          const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920 });
          form.append("coverHeroImage", compressed);
          setIsUploadingImages(false);
        } else if (typeof formData.coverHeroImage === "string") {
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

      // IMAGES — compress + rename + append URLs
      setIsUploadingImages(true);

      // Black Tie
      {
        const compressed = await renameAndCompressImage({
          images: (formData.digitalWardrobeBlackTie || []).filter((img) => typeof img !== "string"),
          address: formData.address,
          additionalKeywords: [...imageKeywords],
        });
        const all = [
          ...(formData.digitalWardrobeBlackTie || []).filter((img) => typeof img === "string"),
          ...compressed.filter(Boolean),
        ];
        all.forEach((url) => form.append("digitalWardrobeBlackTie", url));
      }

      // Formal
      {
        const compressed = await renameAndCompressImage({
          images: (formData.digitalWardrobeFormal || []).filter((img) => typeof img !== "string"),
          address: formData.address,
          additionalKeywords: [...imageKeywords],
        });
        const all = [
          ...(formData.digitalWardrobeFormal || []).filter((img) => typeof img === "string"),
          ...compressed.filter(Boolean),
        ];
        all.forEach((url) => form.append("digitalWardrobeFormal", url));
      }

      // Smart Casual
      {
        const compressed = await renameAndCompressImage({
          images: (formData.digitalWardrobeSmartCasual || []).filter((img) => typeof img !== "string"),
          address: formData.address,
          additionalKeywords: [...imageKeywords],
        });
        const all = [
          ...(formData.digitalWardrobeSmartCasual || []).filter((img) => typeof img === "string"),
          ...compressed.filter(Boolean),
        ];
        all.forEach((url) => form.append("digitalWardrobeSmartCasual", url));
      }

      // Session All Black
      {
        const compressed = await renameAndCompressImage({
          images: (formData.digitalWardrobeSessionAllBlack || []).filter((img) => typeof img !== "string"),
          address: formData.address,
          additionalKeywords: [...imageKeywords],
        });
        const all = [
          ...(formData.digitalWardrobeSessionAllBlack || []).filter((img) => typeof img === "string"),
          ...compressed.filter(Boolean),
        ]
          .filter((url) => typeof url === "string" && url.trim() !== "" && url.startsWith("http"));
        all.forEach((url) => form.append("digitalWardrobeSessionAllBlack", url));
      }

      // Additional Images
      {
        const compressed = await renameAndCompressImage({
          images: (formData.additionalImages || []).filter((img) => typeof img !== "string"),
          address: formData.address,
          additionalKeywords: [...imageKeywords],
        });
        const all = [
          ...(formData.additionalImages || []).filter((img) => typeof img === "string"),
          ...compressed.filter(Boolean),
        ];
        all.forEach((url) => form.append("additionalImages", url));
      }

      setIsUploadingImages(false);

      // arrays/objects
      form.append("function_bands_performed_with", JSON.stringify(formData.function_bands_performed_with || []));
      form.append("original_bands_performed_with", JSON.stringify(formData.original_bands_performed_with || []));
      form.append("sessions", JSON.stringify(formData.sessions || []));
      form.append("social_media_links", JSON.stringify(formData.social_media_links || []));
      form.append("functionBandVideoLinks", JSON.stringify(formData.functionBandVideoLinks || []));
      form.append("tscApprovedFunctionBandVideoLinks", JSON.stringify(formData.tscApprovedFunctionBandVideoLinks || []));
      form.append("originalBandVideoLinks", JSON.stringify(formData.originalBandVideoLinks || []));
      form.append("tscApprovedOriginalBandVideoLinks", JSON.stringify(formData.tscApprovedOriginalBandVideoLinks || []));

      // MP3s
      setIsUploadingMp3s(true);
      form.append("originalMp3s", JSON.stringify(formData.originalMp3s || []));
      form.append("coverMp3s", JSON.stringify(formData.coverMp3s || []));
      setIsUploadingMp3s(false);

      // bios
      form.append("tagLine", formData.tagLine || "");
      form.append("bio", formData.bio || "");
      form.append("tscApprovedBio", formData.tscApprovedBio || "");

      // more complex JSON
      form.append("academic_credentials", JSON.stringify(formData.academic_credentials || []));
      form.append("cableLogistics", JSON.stringify(formData.cableLogistics || []));
      form.append("extensionCableLogistics", JSON.stringify(formData.extensionCableLogistics || []));
      form.append("uplights", JSON.stringify(formData.uplights || []));
      form.append("tbars", JSON.stringify(formData.tbars || []));
      form.append("lightBars", JSON.stringify(formData.lightBars || []));
      form.append("discoBall", JSON.stringify(formData.discoBall || []));
      form.append("otherLighting", JSON.stringify(formData.otherLighting || []));
      form.append("paSpeakerSpecs", JSON.stringify(formData.paSpeakerSpecs || []));
      form.append("mixingDesk", JSON.stringify(formData.mixingDesk || []));
      form.append("floorMonitorSpecs", JSON.stringify(formData.floorMonitorSpecs || []));
      form.append("djEquipment", JSON.stringify(formData.djEquipment || []));
      form.append("djEquipmentCategories", JSON.stringify(formData.djEquipmentCategories || []));
      form.append("agreementCheckboxes", JSON.stringify(formData.agreementCheckboxes || []));
      form.append("djGearRequired", JSON.stringify(formData.djGearRequired || []));

      // vocals payload — ensure types are safe
      const vocalsPayload = {
        type: formData.vocals?.type || "",
        gender: formData.vocals?.gender || "",
        range: formData.vocals?.range || "",
        rap: formData.vocals?.rap === true || formData.vocals?.rap === "true",
        genres: Array.isArray(formData.vocals?.genres) ? formData.vocals.genres : [],
      };
      form.append("vocals", JSON.stringify(vocalsPayload));

      form.append("backline", JSON.stringify(formData.backline || []));
      form.append("awards", JSON.stringify(formData.awards || []));
      form.append("repertoire", JSON.stringify(formData.repertoire || []));
      form.append("selectedSongs", JSON.stringify(formData.selectedSongs || []));
      form.append("other_skills", JSON.stringify(formData.other_skills || []));
      form.append("logistics", JSON.stringify(formData.logistics || []));
      form.append("vocalMics", JSON.stringify(formData.vocalMics || {}));
      form.append("inEarMonitoring", JSON.stringify(formData.inEarMonitoring || {}));
      form.append("additionalEquipment", JSON.stringify(formData.additionalEquipment || {}));
      form.append("instrumentMics", JSON.stringify(formData.instrumentMics || {}));
      form.append("speechMics", JSON.stringify(formData.speechMics || {}));
      form.append("instrumentSpecs", JSON.stringify(formData.instrumentSpecs || []));
      form.append("instrumentation", JSON.stringify(formData.instrumentation || []));
      form.append("djing", JSON.stringify(formData.djing || {}));
      form.append("bank_account", JSON.stringify(formData.bank_account || {}));
      form.append("deputy_contract_agreed", JSON.stringify(formData.deputy_contract_agreed || ""));

      // dates
      form.append("dateRegistered", new Date(formData.dateRegistered).toISOString());

      // append any remaining primitive fields
      for (const key in formData) {
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

        if (typeof formData[key] === "object" && !(formData[key] instanceof File) && formData[key] !== null) {
          form.append(key, JSON.stringify(formData[key]));
        } else if (formData[key] !== undefined) {
          form.append(key, formData[key]);
        }
      }



      console.log("🎵 Parsed originalMp3s:", formData.originalMp3s);

      form.append(
        "deputy_contract_signed",
        typeof formData.deputy_contract_signed === "string" ? formData.deputy_contract_signed : ""
      );

      const outgoingSummary = summarizeFormData(form);
    console.group("🚀 SUBMIT DEPUTY — outgoing payload");
    console.log("requestId:", requestId);
    console.log("sentAt:", sentAt);
    console.log("endpoint:", `${backendUrl}/api/musician/moderation/register-deputy`);
    console.log("payload(summary):", preview(outgoingSummary, { maxArray: 4, maxString: 600 }));
    console.groupEnd();


      // debug payload
      console.group("📤 FormData -> /api/musician/moderation/register-deputy");
      for (const [k, v] of form.entries()) {
        if (v instanceof File || v instanceof Blob) {
          console.log(k, `(File) name=${v.name || "(blob)"} type=${v.type} sizeKB=${Math.round(v.size / 1024)}`);
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
            token, // backend expects `token` header in your stack
            Authorization: `Bearer ${token}`,
            "x-request-id": requestId,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const [response] = await Promise.all([axiosResponsePromise, popupMinTime]);


       console.group("📬 SERVER RESPONSE — register-deputy");
    console.log("requestId:", requestId);
    console.log("status:", response?.status);
    console.log("data:", response?.data);
    console.groupEnd();
    
      if (response?.data?.success) {
        const savedMusician = response.data.musician;
        if (savedMusician?._id) {
          localStorage.setItem("musicianId", savedMusician._id);
        }

        // clear deletedImages safely
        setFormData((prev) => ({ ...prev, deletedImages: [] }));

        if (isEdit) {
          toast(<CustomToast type="success" message="Profile submission updated successfully!" />);
        } else {
          toast(<CustomToast type="success" message="Profile submitted for approval!" />);
        }

        // Save deputy status
        localStorage.setItem("deputyStatus", formData.status || "pending");

        // Redirect
        const redirectTo =
          import.meta.env.MODE === "production"
            ? `${import.meta.env.VITE_FRONTEND_URL}/musicians-dashboard`
            : "http://localhost:5173/musicians-dashboard";

        setTimeout(() => {
          window.location.href = redirectTo; // SPA-safe fallback
          // navigate("/musicians-dashboard", { replace: true });
        }, 2500);
      } else {
        toast(<CustomToast type="error" message={response?.data?.message || "Unknown error"} />);
      }
    } catch (err) {
      toast(<CustomToast type="error" message="Registration failed." />);
      console.error(err);
      if (err.name === "ValidationError") {
        console.error("❌ Mongoose validation error:", err.errors);
      }
    } finally {
      setSubmissionInProgress(false);
      setShowSubmittingPopup(false);
    }
  };

  /* --------------------------------- steps UI ------------------------------- */
  const renderStep = () => {
    const stepProps = { formData };
    switch (step) {
      case 1:
        return (
          <DeputyStepOne
            formData={formData}
            setFormData={setFormData}
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

    const isSignaturePresent = hasDrawnSignature === true;
    const canSubmitNow = step === totalSteps && isSignaturePresent && agreement.termsAndConditions && agreement.privacyPolicy;

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
        safe.digitalWardrobeBlackTie = safe.digitalWardrobeBlackTie?.filter((x) => typeof x === "string") || [];
        safe.digitalWardrobeFormal = safe.digitalWardrobeFormal?.filter((x) => typeof x === "string") || [];
        safe.digitalWardrobeSmartCasual = safe.digitalWardrobeSmartCasual?.filter((x) => typeof x === "string") || [];
        safe.digitalWardrobeSessionAllBlack = safe.digitalWardrobeSessionAllBlack?.filter((x) => typeof x === "string") || [];
        safe.additionalImages = safe.additionalImages?.filter((x) => typeof x === "string") || [];

        localStorage.setItem("deputyAutosave", JSON.stringify(safe));
        const ts = new Date().toLocaleTimeString();
        setAutosaveStatus(`Autosaved at ${ts}`);
        console.log("💾 Autosaved deputy form:", safe);
      } catch (err) {
        console.error("❌ Autosave failed:", err);
      }
    }, 800);

    return () => clearTimeout(handler);
  }, [formData]);

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

        {showSubmittingPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg text-center">
              <p className="text-lg font-semibold">Submitting your form...</p>
              <p className="text-sm mt-2 text-gray-500">Please wait a moment.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DeputyForm;
