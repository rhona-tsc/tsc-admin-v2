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

const DeputyForm = ({ token, userRole, firstName, lastName, email, phone }) => {
  const [step, setStep] = useState(1);
    const { id: routeId } = useParams(); // /edit-deputy/:id
  const deputyId =
    routeId ??
    localStorage.getItem("userId") ??
    null;

    useEffect(() => {
    // if we have a route id, fetch that profile
    if (routeId) {
      // fetch and setMusician(...)
    }
  }, [routeId]);

  const totalSteps = 6;
  // Uploading state indicators
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isUploadingMp3s, setIsUploadingMp3s] = useState(false);
  const [submissionInProgress, setSubmissionInProgress] = useState(false);
  const [showSubmittingPopup, setShowSubmittingPopup] = useState(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);


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
    paAndBackline: [
      {
        name: "",
        quantity: 0,
        wattage: 0,
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
    digitalWardrobeSessionBlack: [],

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
        const res = await axios.get(
          `${backendUrl}/api/moderation/deputy/${id}`
        );
        if (res.data.success) {
          const deputy = res.data.deputy;

          // Ensure nested fields are at least empty objects
          setFormData((prev) => ({
            ...prev,
            ...deputy,
            basicInfo: {
              firstName: deputy.firstName || "",
              lastName: deputy.lastName || "",
              email: deputy.email || "",
              phone: deputy.phone || "",
              ...deputy.basicInfo,
            },
            address: {
              ...prev.address,
              ...(deputy.address || {}),
            },
            coverMp3s: (deputy.coverMp3s || []).map((mp3) => ({
              ...mp3,
              file: null,
              id: mp3.id || mp3.url || uuidv4(),
            })),
            originalMp3s: (deputy.originalMp3s || []).map((mp3) => ({
              ...mp3,
              file: null,
              id: mp3.id || mp3.url || uuidv4(),
            })),
            functionBandVideoLinks: deputy.functionBandVideoLinks || [],
            tscApprovedFunctionBandVideoLinks:
              deputy.tscApprovedFunctionBandVideoLinks || [],
            originalBandVideoLinks: deputy.originalBandVideoLinks || [],
            tscApprovedOriginalBandVideoLinks:
              deputy.tscApprovedOriginalBandVideoLinks || [],
            digitalWardrobeBlackTie: deputy.digitalWardrobeBlackTie || [],
            digitalWardrobeFormal: deputy.digitalWardrobeFormal || [],
            digitalWardrobeSmartCasual: deputy.digitalWardrobeSmartCasual || [],
            digitalWardrobeSessionAllBlack:
              deputy.digitalWardrobeSessionAllBlack || [],
            additionalImages: deputy.additionalImages || [],
            
            status: deputy.status || "pending",
            academic_credentials: deputy.academic_credentials || [
              {
                course: "",
                institution: "",
                years: "",
                education_level: "",
              },
            ],
            cableLogistics: deputy.cableLogistics || [
              {
                length: "",
                quantity: "",
              },
            ],
            extensionCableLogistics: deputy.extensionCableLogistics || [
              {
                length: "",
                quantity: "",
              },
            ],
            uplights: deputy.uplights || [
              {
                quantity: "",
                wattage: "",
              },
            ],
            tbars: deputy.tbars || [
              {
                quantity: "",
                wattage: "",
              },
            ],
            lightBars: deputy.lightBars || [
              {
                quantity: "",
                wattage: "",
              },
            ],
            discoBall: deputy.discoBall || [
              {
                quantity: "",
                wattage: "",
              },
            ],
            otherLighting: deputy.otherLighting || [
              {
                name: "",
                quantity: "",
                wattage: "",
              },
            ],
            paSpeakerSpecs: deputy.paSpeakerSpecs || [
              {
                name: "",
                quantity: "",
                wattage: "",
              },
            ],
            mixingDesk: deputy.mixingDesk || [
              {
                name: "",
                quantity: "",
                wattage: "",
              },
            ],
            floorMonitorSpecs: deputy.floorMonitorSpecs || [
              {
                name: "",
                quantity: "",
                wattage: "",
              },
            ],
            backline: deputy.backline || [
              {
                name: "",
                quantity: "",
                wattage: "",
              },
            ],
            djEquipment: deputy.djEquipment || [
              {
                name: "",
                quantity: "",
                wattage: "",
              },
            ],
            djGearRequired: deputy.djGearRequired || [
              {
                name: "",
                quantity: "",
                wattage: "",
              },
            ],
            djEquipmentCategories: deputy.djEquipmentCategories || [
              {
                hasDjTable: false,
                hasDjBooth: false,
                hasMixingConsole: false,
                hasCdjs: false,
                hasVinylDecks: false,
              },
            ],
            agreementCheckboxes: deputy.agreementCheckboxes || [
              {
                termsAndConditions: false,
                privacyPolicy: false,
              },
            ],
            paAndBackline: deputy.paAndBackline || [
              {
                name: "",
                quantity: 0,
                wattage: 0,
              },
            ],
            awards: deputy.awards || [
              {
                description: "",
                years: "",
              },
            ],
            function_bands_performed_with:
              deputy.function_bands_performed_with || [
                {
                  function_band_name: "",
                  function_band_leader_email: "",
                },
              ],
            original_bands_performed_with:
              deputy.original_bands_performed_with || [
                {
                  original_band_name: "",
                  original_band_leader_email: "",
                },
              ],
            sessions: deputy.sessions || [
              {
                artist: "",
                session_type: "",
              },
            ],
            social_media_links: deputy.social_media_links || [
              {
                platform: "",
                url: "",
              },
            ],
            instrumentation: deputy.instrumentation || [
              {
                instrument: "",
                skill_level: "",
              },
            ],
            vocals: deputy.vocals || {
              type: "",
              gender: "",
              range: "",
              rap: "",
              genres: [],
            },
            repertoire: deputy.repertoire || [],
            selectedSongs: deputy.selectedSongs || [
              {
                title: "",
                artist: "",
                genre: "",
                year: "",
              },
            ],
            other_skills: deputy.other_skills || [],
            logistics: deputy.logistics || [],
            vocalMics: deputy.vocalMics || {
              wireless_vocal_mics: "",
              wired_vocal_mics: "",
              wireless_vocal_adapters: "",
            },
            inEarMonitoring: deputy.inEarMonitoring || {
              wired_in_ear_packs: "",
              wireless_in_ear_packs: "",
              in_ear_monitors: "",
            },
            additionalEquipment: deputy.additionalEquipment || {
              mic_stands: "",
              di_boxes: "",
              wireless_guitar_jacks: "",
            },
            instrumentMics: deputy.instrumentMics || {
              extra_wired_instrument_mics: "",
              wireless_horn_mics: "",
              drum_mic_kit: "",
            },
            speechMics: deputy.speechMics || {
              wireless_speech_mic: "",
              wired_speech_mic: "",
            },
            instrumentSpecs: deputy.instrumentSpecs || {
              name: "",
              wattage: "",
            },
            djing: deputy.djing || {
              has_mixing_console: false,
              has_dj_table: false,
              has_dj_booth: false,
              has_mixing_decks: false,
            },
            bank_account: deputy.bank_account || {
              sort_code: "",
              account_number: "",
              account_name: "",
              account_type: "",
            },
            deputy_contract_agreed: deputy.deputy_contract_agreed || false,
            deputy_contract_signed:
              typeof deputy.deputy_contract_signed === "string"
                ? deputy.deputy_contract_signed
                : "",
            dateRegistered: new Date(deputy.dateRegistered) || new Date(),
          }));

          setTscApprovedBio(deputy.tscApprovedBio || "")

          console.log("✅ Fetched deputy populated into formData:", deputy);
        }
      } catch (error) {
        console.error("❌ Failed to fetch deputy:", error);
      }
    };

    if (id) fetchDeputy();
  }, [id, backendUrl]);




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
    if (step < totalSteps) setStep(step + 1);
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
        "status",
        typeof formData.status === "string" ? formData.status : "pending"
      );

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
      form.append("paAndBackline", JSON.stringify(formData.paAndBackline));
      form.append("backline", JSON.stringify(formData.backline));

      form.append("awards", JSON.stringify(formData.awards));
      form.append("vocals", JSON.stringify(formData.vocals));
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
      form.append("dateRegistered", formData.dateRegistered.toISOString());
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
            "digitalWardrobeSessionBlack",
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
            "paAndBackline",
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
      console.group("📤 FormData -> /api/musician/register-deputy");
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
        `${backendUrl}/api/musician/register-deputy`,
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
        formData.deletedImages = [];

        // Show a different toast depending on whether updating or creating
        if (id) {
          toast(
            <CustomToast
              type="success"
              message="Deputy submission updated successfully!"
            />
          );
        } else {
          toast(
            <CustomToast type="success" message="Submitted for approval!" />
          );
        }

        // Save deputy status in localStorage and redirect to homepage
        localStorage.setItem("deputyStatus", formData.status || "pending");

        // Wait 1 second before redirecting to allow toast to show
        setTimeout(() => {
          window.location.href = "http://localhost:5173/";
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
    const stepProps = { formData, setFormData: handleChange };
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
  {...stepProps}
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
