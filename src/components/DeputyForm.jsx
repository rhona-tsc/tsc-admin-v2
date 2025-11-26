import mongoose from "mongoose";

const musicianSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["musician", "agent"],
      default: "musician",
    },

    tagLine: { type: String, maxlength: 160 },
    email: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    phone: { type: String, index: true },
    phoneNormalized: { type: String, index: true },
    whatsappOptIn: { type: Boolean, default: false },
    password: { type: String },

    basicInfo: {
      firstName: { type: String },
      lastName: { type: String },
      phone: { type: String },
      email: { type: String },
    },

    address: {
      line1: { type: String, default: "" },
      line2: { type: String, default: "" },
      town: { type: String, default: "" },
      county: { type: String, default: "" },
      postcode: { type: String, default: "" },
      country: { type: String, default: "" },
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "Approved, changes pending", null],
      default: "pending",
      required: false,
      set: v => v === "" ? null : v
    },

    academic_credentials: [
      {
        course: { type: String, default: "" },
        institution: { type: String, default: "" },
        years: { type: String, default: "" },
        education_level: { type: String, default: "" },
      },
    ],

    awards: [
      { description: { type: String, default: "" }, years: { type: String, default: "" } },
    ],

    function_bands_performed_with: [{ function_band_name: String, function_band_leader_email: String }],
    original_bands_performed_with: [{ original_band_name: String, original_band_leader_email: String }],
    sessions: [{ artist: String, session_type: String }],
    social_media_links: [{ platform: String, url: String }],

    instrumentation: [
      {
        instrument: { type: String, default: "" },
        skill_level: { type: String, enum: ["Expert", "Intermediate", "Advanced", null], default: null, required: false, set: v => v === "" ? null : v }
      }
    ],

    vocals: {
      type: { type: [String], default: [], required: false, set: v => v === "" ? [] : v },
      gender: { type: String, enum: ["Male", "Female", "Non-Binary", null], required: false, default: null, set: v => v === "" ? null : v },
      range: { type: String, enum: ["Soprano","Mezzo-Soprano","Alto","Tenor","Baritone","Bass","Not sure", null], required: false, default: null, set: v => v === "" ? null : v },
      rap: { type: String, required: false, default: "" },
      genres: { type: [String], default: [], required: false, set: v => Array.isArray(v) ? v : [] }
    },

    vocalMics: { wireless_vocal_mics: String, wired_vocal_mics: String, wireless_vocal_adapters: String },
    inEarMonitoring: { wired_in_ear_packs: String, wireless_in_ear_packs: String, in_ear_monitors: String },
    instrumentMics: { extra_wired_instrument_mics: String, wireless_horn_mics: String, drum_mic_kit: String },
    speechMics: { wireless_speech_mics: String, wired_speech_mics: String },

    paSpeakerSpecs: [{ name: String, quantity: String, wattage: Number }],
    mixingDesk: [{ name: String, quantity: String, wattage: Number }],
    floorMonitorSpecs: [{ name: String, quantity: String, wattage: Number }],
    backline: [{ name: String, quantity: String, wattage: Number }],
    djGearRequired: [{ name: String, quantity: String, wattage: Number }],
    instrumentSpecs: [{ name: String, wattage: Number }],
    djEquipment: [{ name: String, quantity: String, wattage: Number }],
    digitalWardrobeBlackTie: [{ type: String, default: "" }],
    digitalWardrobeFormal: [{ type: String, default: "" }],
    digitalWardrobeSmartCasual: [{ type: String, default: "" }],
    digitalWardrobeSessionAllBlack: [{ type: String, default: "" }],
    additionalImages: [{ type: String, default: "" }],

    coverMp3s: [{ title: String, url: String }],
    originalMp3s: [{ title: String, url: String }],
    repertoire: [{ title: String, artist: String, year: String, genre: String }],
    selectedSongs: [{ title: String, artist: String, genre: String, year: String }],

    pat: { type: Boolean, default: false },
    patExpiry: { type: Date, default: null },
    patFile: { type: String, default: null },
    pli: { type: Boolean, default: false },
    pliExpiry: { type: Date, default: null },
    pliFile: { type: String, default: null },
    pliAmount: { type: Number, default: null },

    deputy_contract_signed: { type: String, default: null, required: false, set: v => v === "" ? null : v },

    // ✅ NEW MISSING SECTION — ***added only, not removed***
    photos: {
      profilePhoto: {
        type: String,
        required: false,
        default: null,
        set: v => v === "" ? null : v
      },
      coverHeroPhoto: {
        type: String,
        required: false,
        default: null,
        set: v => v === "" ? null : v
      }
    },

    dateRegistered: { type: Date, default: Date.now }
  },
  { minimize: false, strict: true }
);

// Keep indexes intact (you asked not to delete anything)
musicianSchema.index({ status: 1 });
musicianSchema.index({ other_skills: 1 });

// Model
const musicianModel =
  mongoose.models.musician || mongoose.model("musician", musicianSchema);

// Export
export default musicianModel;