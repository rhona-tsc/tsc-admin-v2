import React, { useRef, useState, useEffect } from "react";
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
import SignatureCanvas from "react-signature-canvas";

const DeputyForm = ({ token, userRole, firstName, lastName, email, phone }) => {  const sigCanvas = useRef({});
  const [step, setStep] = useState(1);
  const totalSteps = 6;

  const [formData, setFormData] = useState({
    role: "musician",
    email: "",
    tagLine: "",
    basicInfo: {
      firstName: "",
      lastName: "",

      phone: "",
    },
    address: {
      line1: "",
      line2: "",
      town: "",
      county: "",
      postcode: "",
      country: "",
    },
    bio: "",
    status: "pending",
    academic_credentials: [
      {
        course: "",
        institution: "",
        years: "",
        education_level: "",
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
    instrumentation: [
      {
        instrument: "",
        skill_level: "",
      },
    ],
    drums: {
        acoustic: false,
        electric: false,
        percussion: false,
        cajon: false,
  },
  roaming: [
    {
      instrument: "",
      wireless_mic_or_jack: false,
      wireless_in_ear: false,
    }
  ],
    vocals: {
      type: "",
      gender: "",
      range: "",
      rap: "",
      genres: [],
    },
    other_skills: [],
    logistics: [],
    pa_equipment: {
      wireless_vocal_mics: 0,
      wired_vocal_mics: 0,
      wireless_vocal_adapters: 0,
      extra_wired_instrument_mics: 0,
      wireless_horn_mics: 0,
      drum_mic_kit: 0,
      wireless_speech_mics: 0,
      wired_speech_mics: 0,
      longest_xlr: "",
      longest_extension_cable: "",
      wired_in_ear_packs: 0,
      wireless_in_ear_packs: 0,
      in_ear_monitors: 0,
      floor_monitors: 0,
      mic_stands: 0,
      di_boxes: 0,
      wireless_guitar_jacks: 0,
      uplights: { quantity: 0, wattage: 0 },
      t_bars: {
        quantity: 0,
        wattage: 0,
      },
      led_disco_ball: {
        quantity: 0,
        wattage: 0,
      },
      light_bars: {
        quantity: 0,
        wattage: 0,
      },
      
    },
    equipment_spec: {
      mixing_desks: [
        {
          name: "",
          wattage: 0,
        },
      ],
      pa_speakers: [
        {
          name: "",
          wattage: 0,
        },
      ],
      monitors: [
        {
          name: "",
          wattage: 0,
        },
      ],
      other_lighting: [
        {
          name: "",
          quantity: 0,
          wattage: 0,
        },
      ],
    

    bank_account: {
      sort_code: "",
      account_number: "",
      account_name: "",
      account_type: "",
    },
    profilePicture: null,
    coverHeroImage: null,

    digitalWardrobeBlackTie: [],
    digitalWardrobeFormal: [],
    digitalWardrobeSmartCasual: [],
    digitalWardrobeSessionAllBlack: [],
    additionalImages: [],

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
    tscApprovedOriginalBandVideoLinks:
      [ 
        {
          url: "",
          title: "",
        },
      ],
    coverMp3s: [ 
      {
        mp3: "",
        fileUrl: "",
      },
    ],
    originalMp3s: [ 
      {
        mp3: "",
        fileUrl: "",
      },
    ],
    customRepertoire: "",
    repertoire: [],
    selectedSongs: [
      {
        title: "",
        artist: "",
        genre: "",
        year: "",
      },
    ],
    pat: false,
    patExpiry: "",
    patFile: "",
    pli: false,
    pliAmount: 0,
    pliExpiry: "",
    pliFile: "",

    deputy_contract_agreed: false,
    deputy_contract_signed: "",
    dateRegistered: new Date(),
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        firstName: firstName,
        lastName: lastName,
        phone: phone,
      },
      email: email,
    }));
  }, [firstName, lastName, phone, email]);

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
    if (!formData.deputy_contract_signed?.startsWith("data:image")) {
      toast(
        <CustomToast
          type="error"
          message="Please sign the contract before submitting."
        />
      );
      return;
    }
    if (!formData.email || !formData.email.includes("@")) {
      toast(
        <CustomToast
          type="error"
          message="Please enter a valid email address."
        />
      );
      return;
    }
    try {
      const form = new FormData();

      for (const key in formData) {
        if (key === "profilePicture" && formData[key]) {
          form.append("profilePicture", formData[key]);
        } else if (
          typeof formData[key] === "object" &&
          !(formData[key] instanceof File) &&
          formData[key] !== null
        ) {
          form.append(key, JSON.stringify(formData[key]));
        } else if (formData[key] !== undefined) {
          form.append(key, formData[key]);
        }
      }

         for (const key in formData) {
        if (key === "coverHeroImage" && formData[key]) {
          form.append("overHeroImage", formData[key]);
        } else if (
          typeof formData[key] === "object" &&
          !(formData[key] instanceof File) &&
          formData[key] !== null
        ) {
          form.append(key, JSON.stringify(formData[key]));
        } else if (formData[key] !== undefined) {
          form.append(key, formData[key]);
        }
      }

      const fd = new FormData();

// SINGLE files
if (formData.profilePicture instanceof Blob) {
  fd.append('profilePicture', formData.profilePicture);
}
if (formData.coverHeroImage instanceof Blob) {
  fd.append('coverHeroImage', formData.coverHeroImage);
}

// MULTI image fields — append one-by-one under the SAME name
(formData.digitalWardrobeBlackTie || []).forEach(f => {
  if (f instanceof File) fd.append('digitalWardrobeBlackTie', f);
});
(formData.digitalWardrobeFormal || []).forEach(f => {
  if (f instanceof File) fd.append('digitalWardrobeFormal', f);
});
(formData.digitalWardrobeSmartCasual || []).forEach(f => {
  if (f instanceof File) fd.append('digitalWardrobeSmartCasual', f);
});
(formData.digitalWardrobeSessionAllBlack || []).forEach(f => {
  if (f instanceof File) fd.append('digitalWardrobeSessionAllBlack', f);
});
(formData.additionalImages || []).forEach(f => {
  if (f instanceof File) fd.append('additionalImages', f);
});

// MP3s (expecting {file, title})
(formData.coverMp3s || []).forEach(({file, title}) => {
  if (file instanceof File) {
    fd.append('coverMp3s', file);
  }
});
(formData.originalMp3s || []).forEach(({file, title}) => {
  if (file instanceof File) {
    fd.append('originalMp3s', file);
  }
});

// JSON-ish fields: stringify objects/arrays
fd.append('basicInfo', JSON.stringify(formData.basicInfo || {}));
fd.append('address', JSON.stringify(formData.address || {}));
// ...repeat for other object/array fields you send

// 🔎 DEBUG: list exactly what will hit Multer
console.group('📤 FormData being sent to /api/musician/register-deputy');
for (const [k, v] of fd.entries()) {
  console.log(k, v instanceof File ? `(File) ${v.name}` : v);
}
console.groupEnd();

// POST
await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/musician/register-deputy`, fd, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

      const response = await axios.post(
        `${backendUrl}/api/musician/register-deputy`,
        form,
        {
          headers: {
            token,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast(
          <CustomToast
            type="success"
            message="Deputy registered successfully!"
          />
        );

        // Trigger email contract after registration
        await axios.post(
          `${backendUrl}/api/email-contract`,
          { formData },
          {
            headers: { token },
          }
        );

        toast(<CustomToast type="success" message="Contract emailed!" />);
      } else {
        toast(<CustomToast type="error" message={response.data.message} />);
      }
    } catch (err) {
      toast(<CustomToast type="error" message="Registration failed." />);
      console.error(err);
      if (err.name === "ValidationError") {
        console.error("❌ Mongoose validation error:", err.errors);
      }
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
            firstName={firstName}
            userRole={userRole}
          />
        );
      case 2:
        return <DeputyStepTwo {...stepProps} />;
      case 3:
        return <DeputyStepThree {...stepProps} />;
      case 4:
        return <DeputyStepFour {...stepProps} userRole={userRole} />;
      case 5:
        return <DeputyStepFive {...stepProps} />;
      case 6:
        return <DeputyStepSix {...stepProps} />;
      default:
        return null;
    }
  };

  const clearSignature = () => {
    sigCanvas.current.clear();
    setFormData({ deputy_contract_signed: "" });
  };

  const handleEnd = () => {
    if (!sigCanvas.current.isEmpty()) {
      const signatureData = sigCanvas.current
        .getTrimmedCanvas()
        .toDataURL("image/png");
      setFormData((prev) => ({
        ...prev,
        deputy_contract_signed: signatureData,
      }));
    }
  };

  return (
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
            <div className="mb-6">
              <label className="block mb-2 font-semibold">Signature</label>
              <div className="mb-4 flex items-center gap-4">
                <div className="border rounded w-96 h-40">
                  <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{
                      width: 384,
                      height: 160,
                      className: "signature-canvas",
                    }}
                    onEnd={handleEnd}
                  />
                </div>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Clear
                </button>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.deputy_contract_agreed || false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      deputy_contract_agreed: e.target.checked,
                    }))
                  }
                />
                I agree to the terms and conditions outlined above.
              </label>
            </div>
            <div className="flex justify-between mt-6">
              <button
                className="px-4 py-2 bg-black hover:bg-[#ff6667] text-white max-h-10 "
                onClick={handleBack}
              >
                Back
              </button>
              <button
                className="px-4 py-2 bg-black hover:bg-[#ff6667] text-white max-h-10 "
                onClick={handleSubmit}
              >
                Submit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DeputyForm;
