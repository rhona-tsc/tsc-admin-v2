import React, { useState, useEffect, useRef } from "react";
import DragAndDropImageUploader from "./DragAndDropImageUploader";
import ImageCropModal from "./ImageCropModal";
import { assets } from "../assets/assets";
import Mp3Uploader from "./Mp3Uploader";
import renameAndCompressImage from "../pages/utils/renameAndCompressDeputyImage";

const DeputyStepOne = ({
  formData = {},
  setFormData = () => {},
  userRole,
  isUploadingImages = false,
  setIsUploadingImages = () => {},
  isUploadingMp3s = false,
  setIsUploadingMp3s = () => {},
}) => {
  console.log("🟦 DeputyStepOne RENDER", { formData });

  const { address = {} } = formData;

  // -------------------------------------
  // LOCAL STATE
  // -------------------------------------
  const [modalOpen, setModalOpen] = useState(false);
  const [tempImage, setTempImage] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const [coverModalOpen, setCoverModalOpen] = useState(false);
  const [tempCoverImage, setTempCoverImage] = useState("");
  const [coverHeroPreviewUrl, setCoverHeroPreviewUrl] = useState("");

  const [userFirstName] = useState(localStorage.getItem("userFirstName") || "");

  // MP3 local state
  const [originalMp3s, setOriginalMp3s] = useState([]);
  const [coverMp3s, setCoverMp3s] = useState([]);

  const asArray = (v) => {
  if (Array.isArray(v)) return v;
  if (!v) return [];
  // allow single string url / single object to still show
  return [v];
};

const asUrlArray = (v) => {
  const arr = asArray(v);
  // keep only strings (image urls)
  return arr.filter((x) => typeof x === "string" && x.trim());
};

const asVideoLinksArray = (v) => {
  const arr = asArray(v);
  // normalize to [{title,url}]
  return arr
    .map((x) => ({
      title: (x?.title || "").trim(),
      url: (x?.url || "").trim(),
    }))
    .filter((x) => x.url);
};

const asMp3Array = (v) => {
  const arr = asArray(v);
  // normalize to [{title,url}]
  return arr
    .map((x) =>
      typeof x === "string" ? { title: "", url: x } : { title: x?.title || "", url: x?.url || "" }
    )
    .filter((x) => x.url);
};

  // -------------------------------------
  // PREFILL MP3s WHEN EDITING
  // -------------------------------------
  useEffect(() => {
    console.log("🎵 PREFILL MP3s FROM formData:", {
      original: formData.originalMp3s,
      cover: formData.coverMp3s,
    });

setOriginalMp3s(asMp3Array(formData.originalMp3s));
setCoverMp3s(asMp3Array(formData.coverMp3s));
  }, [formData.originalMp3s, formData.coverMp3s]);

  // -------------------------------------
  // ADDRESS UPDATE
  // -------------------------------------
  const updateAddress = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };


  const blobToFile = (blob, filename) => {
  if (!blob) return null;
  if (blob instanceof File) return blob;
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
};

  // -------------------------------------
  // PROFILE IMAGE
  // -------------------------------------
  // Restore: On file select, show crop modal and preview, upload only after crop confirm
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(""); // Clear preview so it doesn't show old image
    const reader = new FileReader();
    reader.onload = () => {
      setTempImage(reader.result);
      setModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

 const handleSaveCroppedImage = async (blob) => {
  setIsUploadingImages(true);
  try {
    const file = blobToFile(blob, `profile-${Date.now()}.jpg`);
    const [url] = await renameAndCompressImage({
      images: [file],
      address: formData.address || {},
    });

    setFormData((prev) => {
      const updated = {
        ...prev,
        profilePicture: url, // ✅ for your current UI
        profilePhoto: url,   // ✅ matches musicianModel.js
      };

      try {
        const safe = JSON.parse(
          JSON.stringify(updated, (key, value) => {
            if (value instanceof File) return undefined;
            if (value instanceof Blob) return undefined;
            if (typeof value === "function") return undefined;
            if (value === window) return undefined;
            return value;
          })
        );
        localStorage.setItem("deputyAutosave", JSON.stringify(safe));
      } catch (e) {
        console.error("❌ Autosave failed after crop:", e);
      }

      return updated;
    });

    setPreviewUrl(url);
    setModalOpen(false);
  } catch (err) {
    console.error("Failed to upload cropped profile picture", err);
    alert("Failed to upload cropped profile picture. Please try again.");
  } finally {
    setIsUploadingImages(false);
  }
};

  // -------------------------------------
  // COVER HERO IMAGE
  // -------------------------------------
  // Restore: On file select, show crop modal and preview, upload only after crop confirm
  const handleCoverHeroChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverHeroPreviewUrl(""); // Clear preview so it doesn't show old image
    const reader = new FileReader();
    reader.onload = () => {
      setTempCoverImage(reader.result);
      setCoverModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

const handleSaveCoverCroppedImage = async (blob) => {
  setIsUploadingImages(true);
  try {
    const file = blobToFile(blob, `cover-hero-${Date.now()}.jpg`);
    const [url] = await renameAndCompressImage({
      images: [file],
      address: formData.address || {},
    });

    setFormData((prev) => {
      const updated = { ...prev, coverHeroImage: url };

      try {
        const safe = JSON.parse(
          JSON.stringify(updated, (key, value) => {
            if (value instanceof File) return undefined;
            if (value instanceof Blob) return undefined;
            if (typeof value === "function") return undefined;
            if (value === window) return undefined;
            return value;
          })
        );
        localStorage.setItem("deputyAutosave", JSON.stringify(safe));
      } catch (e) {
        console.error("❌ Autosave failed after crop:", e);
      }

      return updated;
    });

    setCoverHeroPreviewUrl(url);
    setCoverModalOpen(false);
  } catch (err) {
    console.error("Failed to upload cropped cover hero image", err);
    alert("Failed to upload cropped cover hero image. Please try again.");
  } finally {
    setIsUploadingImages(false);
  }
};

  // Helper for wardrobe/additional images
  const handleWardrobeImageUpload = async (updated, wardrobeKey) => {
    setIsUploadingImages(true);
    const previous = formData[wardrobeKey] || [];
    const uploaded = await Promise.all(
      (updated || []).map(async (img) => {
        if (typeof img === "string") return img;
        const [url] = await renameAndCompressImage({ images: [img], address: formData.address });
        return url;
      })
    );
    const deleted = previous.filter((f) => !uploaded.includes(f) && typeof f === "string");
    setFormData((prev) => ({
      ...prev,
      [wardrobeKey]: uploaded,
      deletedImages: [...(prev.deletedImages || []), ...deleted],
    }));
    setIsUploadingImages(false);
  };

  // -------------------------------------
  // PREFILL PREVIEW FOR EDITING
  // -------------------------------------
  useEffect(() => {
    console.log("🟧 Running PREVIEW PREFILL effect");

    // Profile pic preview
    if (!previewUrl && formData.profilePicture) {
      if (formData.profilePicture instanceof Blob) {
        const url = URL.createObjectURL(formData.profilePicture);
        setPreviewUrl(url);
      } else if (typeof formData.profilePicture === "string") {
        setPreviewUrl(formData.profilePicture);
      }
    }

    // Cover hero preview
    if (!coverHeroPreviewUrl && formData.coverHeroImage) {
      if (formData.coverHeroImage instanceof Blob) {
        const url = URL.createObjectURL(formData.coverHeroImage);
        setCoverHeroPreviewUrl(url);
      } else if (typeof formData.coverHeroImage === "string") {
        setCoverHeroPreviewUrl(formData.coverHeroImage);
      }
    }
  }, [formData]);

  // -------------------------------------
  // CLEANUP URLs
  // -------------------------------------
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (coverHeroPreviewUrl) URL.revokeObjectURL(coverHeroPreviewUrl);
    };
  }, [previewUrl, coverHeroPreviewUrl]);

  // -------------------------------------
  // MP3 SETTERS WITH LOGS
  // -------------------------------------
  const handleSetOriginalMp3s = (updated) => {
    console.log("🎧 Updated original MP3s:", updated);
    setOriginalMp3s(updated);

    setFormData((prev) => ({
      ...prev,
      originalMp3s: updated,
    }));
  };

  const handleSetCoverMp3s = (updated) => {
    console.log("🎤 Updated cover MP3s:", updated);
    setCoverMp3s(updated);

    setFormData((prev) => ({
      ...prev,
      coverMp3s: updated,
    }));
  };
  
  const profileSrc =
  previewUrl ||
  (typeof formData.profilePicture === "string" && formData.profilePicture) ||
  (typeof formData.profilePhoto === "string" && formData.profilePhoto) ||
  "";

  const coverHeroSrc =
  coverHeroPreviewUrl ||
  (typeof formData.coverHeroImage === "string" && formData.coverHeroImage) ||
  "";
  

  // ===================================================================
  // UI
  // ===================================================================
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-semibold text-xl">Welcome {userFirstName}!</h2>

      <p>Let's gather all the information needed to get you matched with the best gigs!</p>

      <div className="flex gap-8 mt-4">
        {/* -------------------------------------------------------
            PROFILE PICTURE
        -------------------------------------------------------- */}
       <div className="flex flex-col gap-2 w-1/3">
    <label className="block font-semibold mb-1">Profile Picture</label>

    <label
      htmlFor="profilePictureUpload"
      className="bg-black text-white px-3 py-2 rounded cursor-pointer w-full text-center hover:bg-[#ff6667]"
    >
      {(formData.profilePicture || formData.profilePhoto)
        ? "Change Profile Picture"
        : "Choose Profile Picture"}
    </label>

    <input
      id="profilePictureUpload"
      type="file"
      accept="image/*"
      onChange={handleImageChange}
      className="hidden"
    />

    {profileSrc ? (
      <img
        src={profileSrc}
        alt="Profile"
        className="mt-2 w-32 h-32 object-cover rounded-full mx-auto"
      />
    ) : (
      <img
        src={assets.profile_placeholder}
        alt="Placeholder"
        className="mt-2 w-32 h-32 object-cover rounded-full mx-auto"
      />
    )}
  </div>

        {/* -------------------------------------------------------
            COVER HERO IMAGE
        -------------------------------------------------------- */}
        <div className="flex flex-col gap-2 w-1/3">
          <label className="block font-semibold mb-1">Cover Hero Image</label>

          <label
            htmlFor="coverHeroUpload"
            className="bg-black text-white px-3 py-2 rounded cursor-pointer w-full text-center hover:bg-[#ff6667]"
          >
{coverHeroSrc ? "Change Cover Image" : "Choose Cover Image"}
          </label>

          <input
            id="coverHeroUpload"
            name="coverHeroImage"
            type="file"
            accept="image/*"
            onChange={handleCoverHeroChange}
            className="hidden"
          />

       {coverHeroSrc ? (
  <img
    src={coverHeroSrc}
    alt="Cover Hero"
    className="mt-2 w-full aspect-video object-cover rounded-md border"
  />
) : (
  <img
    src={assets.cover_placeholder}
    alt="Cover Placeholder"
    className="mt-2 w-full aspect-video object-cover rounded-md border"
  />
)}
        </div>

        {/* Address Section */}
        <div className="flex flex-col gap-3 w-2/3">
          <h2 className="font-semibold text-lg mb-2">Your Address</h2>

          <input
            type="text"
            placeholder="Street Address"
            value={address.line1 || ""}
            onChange={(e) => updateAddress("line1", e.target.value)}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          />

          <input
            type="text"
            placeholder="Address Line 2 (Optional)"
            value={address.line2 || ""}
            onChange={(e) => updateAddress("line2", e.target.value)}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          />

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Town/City"
              value={address.town || ""}
              onChange={(e) => updateAddress("town", e.target.value)}
              className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            />
            <input
              type="text"
              placeholder="County"
              value={address.county || ""}
              onChange={(e) => updateAddress("county", e.target.value)}
              className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            />
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Postcode"
              value={address.postcode || ""}
              onChange={(e) => updateAddress("postcode", e.target.value)}
              className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            />
            <select
              value={address.country || ""}
              onChange={(e) => updateAddress("country", e.target.value)}
              className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            >
              <option value="">Select a country</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Afghanistan">Afghanistan</option>
              <option value="Albania">Albania</option>
              <option value="Algeria">Algeria</option>
              <option value="Andorra">Andorra</option>
              <option value="Angola">Angola</option>
              <option value="Argentina">Argentina</option>
              <option value="Armenia">Armenia</option>
              <option value="Australia">Australia</option>
              <option value="Austria">Austria</option>
              <option value="Azerbaijan">Azerbaijan</option>
              <option value="Bahamas">Bahamas</option>
              <option value="Bahrain">Bahrain</option>
              <option value="Bangladesh">Bangladesh</option>
              <option value="Barbados">Barbados</option>
              <option value="Belarus">Belarus</option>
              <option value="Belgium">Belgium</option>
              <option value="Belize">Belize</option>
              <option value="Benin">Benin</option>
              <option value="Bhutan">Bhutan</option>
              <option value="Bolivia">Bolivia</option>
              <option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
              <option value="Botswana">Botswana</option>
              <option value="Brazil">Brazil</option>
              <option value="Brunei">Brunei</option>
              <option value="Bulgaria">Bulgaria</option>
              <option value="Burkina Faso">Burkina Faso</option>
              <option value="Burundi">Burundi</option>
              <option value="Cambodia">Cambodia</option>
              <option value="Cameroon">Cameroon</option>
              <option value="Canada">Canada</option>
              <option value="Cape Verde">Cape Verde</option>
              <option value="Central African Republic">Central African Republic</option>
              <option value="Chad">Chad</option>
              <option value="Chile">Chile</option>
              <option value="China">China</option>
              <option value="Colombia">Colombia</option>
              <option value="Comoros">Comoros</option>
              <option value="Costa Rica">Costa Rica</option>
              <option value="Croatia">Croatia</option>
              <option value="Cuba">Cuba</option>
              <option value="Cyprus">Cyprus</option>
              <option value="Czech Republic">Czech Republic</option>
              <option value="Democratic Republic of the Congo">Democratic Republic of the Congo</option>
              <option value="Denmark">Denmark</option>
              <option value="Djibouti">Djibouti</option>
              <option value="Dominica">Dominica</option>
              <option value="Dominican Republic">Dominican Republic</option>
              <option value="Ecuador">Ecuador</option>
              <option value="Egypt">Egypt</option>
              <option value="El Salvador">El Salvador</option>
              <option value="Equatorial Guinea">Equatorial Guinea</option>
              <option value="Eritrea">Eritrea</option>
              <option value="Estonia">Estonia</option>
              <option value="Eswatini">Eswatini</option>
              <option value="Ethiopia">Ethiopia</option>
              <option value="Fiji">Fiji</option>
              <option value="Finland">Finland</option>
              <option value="France">France</option>
              <option value="Gabon">Gabon</option>
              <option value="Gambia">Gambia</option>
              <option value="Georgia">Georgia</option>
              <option value="Germany">Germany</option>
              <option value="Ghana">Ghana</option>
              <option value="Greece">Greece</option>
              <option value="Grenada">Grenada</option>
              <option value="Guatemala">Guatemala</option>
              <option value="Guinea">Guinea</option>
              <option value="Guinea-Bissau">Guinea-Bissau</option>
              <option value="Guyana">Guyana</option>
              <option value="Haiti">Haiti</option>
              <option value="Honduras">Honduras</option>
              <option value="Hungary">Hungary</option>
              <option value="Iceland">Iceland</option>
              <option value="India">India</option>
              <option value="Indonesia">Indonesia</option>
              <option value="Iran">Iran</option>
              <option value="Iraq">Iraq</option>
              <option value="Ireland">Ireland</option>
              <option value="Israel">Israel</option>
              <option value="Italy">Italy</option>
              <option value="Ivory Coast">Ivory Coast</option>
              <option value="Jamaica">Jamaica</option>
              <option value="Japan">Japan</option>
              <option value="Jordan">Jordan</option>
              <option value="Kazakhstan">Kazakhstan</option>
              <option value="Kenya">Kenya</option>
              <option value="Kiribati">Kiribati</option>
              <option value="Kuwait">Kuwait</option>
              <option value="Kyrgyzstan">Kyrgyzstan</option>
              <option value="Laos">Laos</option>
              <option value="Latvia">Latvia</option>
              <option value="Lebanon">Lebanon</option>
              <option value="Lesotho">Lesotho</option>
              <option value="Liberia">Liberia</option>
              <option value="Libya">Libya</option>
              <option value="Liechtenstein">Liechtenstein</option>
              <option value="Lithuania">Lithuania</option>
              <option value="Luxembourg">Luxembourg</option>
              <option value="Madagascar">Madagascar</option>
              <option value="Malawi">Malawi</option>
              <option value="Malaysia">Malaysia</option>
              <option value="Maldives">Maldives</option>
              <option value="Mali">Mali</option>
              <option value="Malta">Malta</option>
              <option value="Marshall Islands">Marshall Islands</option>
              <option value="Mauritania">Mauritania</option>
              <option value="Mauritius">Mauritius</option>
              <option value="Mexico">Mexico</option>
              <option value="Micronesia">Micronesia</option>
              <option value="Moldova">Moldova</option>
              <option value="Monaco">Monaco</option>
              <option value="Mongolia">Mongolia</option>
              <option value="Montenegro">Montenegro</option>
              <option value="Morocco">Morocco</option>
              <option value="Mozambique">Mozambique</option>
              <option value="Myanmar">Myanmar</option>
              <option value="Namibia">Namibia</option>
              <option value="Nauru">Nauru</option>
              <option value="Nepal">Nepal</option>
              <option value="Netherlands">Netherlands</option>
              <option value="New Zealand">New Zealand</option>
              <option value="Nicaragua">Nicaragua</option>
              <option value="Niger">Niger</option>
              <option value="Nigeria">Nigeria</option>
              <option value="North Korea">North Korea</option>
              <option value="North Macedonia">North Macedonia</option>
              <option value="Norway">Norway</option>
              <option value="Oman">Oman</option>
              <option value="Pakistan">Pakistan</option>
              <option value="Palau">Palau</option>
              <option value="Palestine">Palestine</option>
              <option value="Panama">Panama</option>
              <option value="Papua New Guinea">Papua New Guinea</option>
              <option value="Paraguay">Paraguay</option>
              <option value="Peru">Peru</option>
              <option value="Philippines">Philippines</option>
              <option value="Poland">Poland</option>
              <option value="Portugal">Portugal</option>
              <option value="Qatar">Qatar</option>
              <option value="Republic of the Congo">Republic of the Congo</option>
              <option value="Romania">Romania</option>
              <option value="Russia">Russia</option>
              <option value="Rwanda">Rwanda</option>
              <option value="Saint Kitts and Nevis">Saint Kitts and Nevis</option>
              <option value="Saint Lucia">Saint Lucia</option>
              <option value="Saint Vincent and the Grenadines">Saint Vincent and the Grenadines</option>
              <option value="Samoa">Samoa</option>
              <option value="San Marino">San Marino</option>
              <option value="Sao Tome and Principe">Sao Tome and Principe</option>
              <option value="Saudi Arabia">Saudi Arabia</option>
              <option value="Senegal">Senegal</option>
              <option value="Serbia">Serbia</option>
              <option value="Seychelles">Seychelles</option>
              <option value="Sierra Leone">Sierra Leone</option>
              <option value="Singapore">Singapore</option>
              <option value="Slovakia">Slovakia</option>
              <option value="Slovenia">Slovenia</option>
              <option value="Solomon Islands">Solomon Islands</option>
              <option value="Somalia">Somalia</option>
              <option value="South Africa">South Africa</option>
              <option value="South Korea">South Korea</option>
              <option value="South Sudan">South Sudan</option>
              <option value="Spain">Spain</option>
              <option value="Sri Lanka">Sri Lanka</option>
              <option value="Sudan">Sudan</option>
              <option value="Suriname">Suriname</option>
              <option value="Sweden">Sweden</option>
              <option value="Switzerland">Switzerland</option>
              <option value="Syria">Syria</option>
              <option value="Taiwan">Taiwan</option>
              <option value="Tajikistan">Tajikistan</option>
              <option value="Tanzania">Tanzania</option>
              <option value="Thailand">Thailand</option>
              <option value="Timor-Leste">Timor-Leste</option>
              <option value="Togo">Togo</option>
              <option value="Tonga">Tonga</option>
              <option value="Trinidad and Tobago">Trinidad and Tobago</option>
              <option value="Tunisia">Tunisia</option>
              <option value="Turkey">Turkey</option>
              <option value="Turkmenistan">Turkmenistan</option>
              <option value="Tuvalu">Tuvalu</option>
              <option value="Uganda">Uganda</option>
              <option value="Ukraine">Ukraine</option>
              <option value="United Arab Emirates">United Arab Emirates</option>
              <option value="United States">United States</option>
              <option value="Uruguay">Uruguay</option>
              <option value="Uzbekistan">Uzbekistan</option>
              <option value="Vanuatu">Vanuatu</option>
              <option value="Vatican City">Vatican City</option>
              <option value="Venezuela">Venezuela</option>
              <option value="Vietnam">Vietnam</option>
              <option value="Yemen">Yemen</option>
              <option value="Zambia">Zambia</option>
              <option value="Zimbabwe">Zimbabwe</option>
            </select>
          </div>
        </div>
      </div>

      {/* Digital Wardrobe Section */}
      <div className="mt-4 space-y-2">
        <label className="block font-semibold mb-1">Digital Wardrobe</label>
        <p>
          Kindly add photos that showcase you in the following standard gig attire,
          i.e. Black Tie, Formal, Smart-Casual, and Session Black
        </p>

        {/* BLACK TIE */}
        <div>
          <label className="block font-semibold mb-1">
            Black Tie Attire (i.e. elegant long dresses, tuxedos with bow tie, etc.)
          </label>
          <p className={`text-sm ${isUploadingImages ? "text-gray-500 animate-pulse" : "text-gray-500"}`}>
            {isUploadingImages ? "Uploading your images..." : ""}
          </p>

          <DragAndDropImageUploader
            label="Black Tie Attire"
            files={asUrlArray(formData.digitalWardrobeBlackTie)}
            setFiles={async (updatedFn) => {
              const previous = formData.digitalWardrobeBlackTie || [];
              const updated = typeof updatedFn === "function" ? updatedFn(previous) : updatedFn;
              await handleWardrobeImageUpload(updated, "digitalWardrobeBlackTie");
            }}
          />
        </div>

        {/* FORMAL */}
        <div>
          <label className="block font-semibold mb-1">Formal Attire</label>
          <p className={`text-sm ${isUploadingImages ? "text-gray-500 animate-pulse" : "text-gray-500"}`}>
            {isUploadingImages ? "Uploading your images..." : ""}
          </p>

          <DragAndDropImageUploader
            label="Formal Attire"
            files={asUrlArray(formData.digitalWardrobeFormal)}
            setFiles={async (updatedFn) => {
              const previous = formData.digitalWardrobeFormal || [];
              const updated = typeof updatedFn === "function" ? updatedFn(previous) : updatedFn;
              await handleWardrobeImageUpload(updated, "digitalWardrobeFormal");
            }}
          />
        </div>

        {/* SMART CASUAL */}
        <div>
          <label className="block font-semibold mb-1">Smart Casual Attire</label>
          <p className={`text-sm ${isUploadingImages ? "text-gray-500 animate-pulse" : "text-gray-500"}`}>
            {isUploadingImages ? "Uploading your images..." : ""}
          </p>

          <DragAndDropImageUploader
            label="Smart Casual Attire"
            files={asUrlArray(formData.digitalWardrobeSmartCasual)}
            setFiles={async (updatedFn) => {
              const previous = formData.digitalWardrobeSmartCasual || [];
              const updated = typeof updatedFn === "function" ? updatedFn(previous) : updatedFn;
              await handleWardrobeImageUpload(updated, "digitalWardrobeSmartCasual");
            }}
          />
        </div>

        {/* Session All Black */}
        <div>
          <label className="block font-semibold mb-1">Session All Black</label>
          <p className={`text-sm ${isUploadingImages ? "text-gray-500 animate-pulse" : "text-gray-500"}`}>
            {isUploadingImages ? "Uploading your images..." : ""}
          </p>
          <DragAndDropImageUploader
            label="Session All Black"
            files={asUrlArray(formData.digitalWardrobeSessionAllBlack)}
            setFiles={async (updatedFn) => {
              const previous = formData.digitalWardrobeSessionAllBlack || [];
              const updated = typeof updatedFn === "function" ? updatedFn(previous) : updatedFn;
              await handleWardrobeImageUpload(updated, "digitalWardrobeSessionAllBlack");
            }}
          />
        </div>
      </div>

      {/* Additional Images */}
      <div>
        <label className="block font-semibold">Additional Images</label>
        <p className="text-sm text-gray-500">Please include any action shots or professional studio shots of you</p>
        <p className={`text-sm ${isUploadingImages ? "text-gray-500 animate-pulse" : "text-gray-500"}`}>
          {isUploadingImages ? "Uploading your images..." : ""}
        </p>

        <DragAndDropImageUploader
          label="Additional Images"
          files={formData.additionalImages}
          setFiles={async (updatedFn) => {
            const previous = formData.additionalImages || [];
            const updated = typeof updatedFn === "function" ? updatedFn(previous) : updatedFn;
            await handleWardrobeImageUpload(updated, "additionalImages");
          }}
        />
      </div>

      {/* Function Band Video Links */}
      <div className="mt-4">
        <label className="block font-semibold mb-1">Function Band Video Links</label>
        <p className="text-sm text-gray-500">
          Add links to your cover band videos here. Please note unbranded footage is preferred. If branded footage is
          supplied we may not include this in your profile, or we may edit the video to remove branding.
        </p>

        <SortableVideoLinkList
links={asVideoLinksArray(formData.functionBandVideoLinks)}
          setLinks={(updated) => {
            console.log("🎥 [VID-FUNCTION] UPDATE", {
              previous: formData.functionBandVideoLinks,
              updated,
            });

            setFormData((prev) => ({
              ...prev,
              functionBandVideoLinks: updated,
            }));
          }}
          placeholderPrefix="Function"
        />

        {userRole?.includes?.("agent") && (
          <SortableVideoLinkList
links={asVideoLinksArray(formData.tscApprovedFunctionBandVideoLinks)}
            setLinks={(updated) => {
              console.log("🎥 [VID-FUNCTION-TSC] UPDATE", {
                previous: formData.tscApprovedFunctionBandVideoLinks,
                updated,
              });

              setFormData((prev) => ({
                ...prev,
                tscApprovedFunctionBandVideoLinks: updated,
              }));
            }}
            placeholderPrefix="tscApprovedFunction"
          />
        )}
      </div>

      {/* Original Band Video Links */}
      <div className="mt-4">
        <label className="block font-semibold mb-1">Original Band Video Links</label>
        <p className="text-sm text-gray-500">Add links to your original band videos here.</p>

        <SortableVideoLinkList
links={asVideoLinksArray(formData.originalBandVideoLinks)}
          setLinks={(updated) => {
            console.log("🎥 [VID-ORIGINAL] UPDATE", {
              previous: formData.originalBandVideoLinks,
              updated,
            });

            setFormData((prev) => ({
              ...prev,
              originalBandVideoLinks: updated,
            }));
          }}
          placeholderPrefix="Original"
        />

        {userRole?.includes?.("agent") && (
          <SortableVideoLinkList
            links={formData.tscApprovedOriginalBandVideoLinks || []}
            setLinks={(updated) => {
              console.log("🎥 [VID-ORIGINAL-TSC] UPDATE", {
                previous: formData.tscApprovedOriginalBandVideoLinks,
                updated,
              });

              setFormData((prev) => ({
                ...prev,
                tscApprovedOriginalBandVideoLinks: updated,
              }));
            }}
            placeholderPrefix="tscApprovedOriginal"
          />
        )}
      </div>

      {/* COVER MP3s */}
      <div className="mt-4">
        <label className="block font-semibold mb-1">Cover MP3s</label>
        <p className="text-sm text-gray-500">Add your cover recordings here.</p>

        {isUploadingMp3s && <p className="text-xs text-gray-500 italic">Uploading MP3s...</p>}

        <Mp3Uploader
          label="Cover MP3s"
          mp3s={coverMp3s}
          setMp3s={(updated) => {
            if (typeof updated === "function") {
              setCoverMp3s((prev) => {
                const result = updated(prev);
                handleSetCoverMp3s(result);
                return result;
              });
            } else {
              handleSetCoverMp3s(updated);
            }
          }}
        />
      </div>

      {/* ORIGINAL MP3s */}
      <div className="mt-4">
        <label className="block font-semibold mb-1">Original MP3s</label>
        <p className="text-sm text-gray-500">Add your original recordings here.</p>

        {isUploadingMp3s && <p className="text-xs text-gray-500 italic">Uploading MP3s...</p>}

        <Mp3Uploader
          label="Original MP3s"
          mp3s={originalMp3s}
          setMp3s={(updated) => {
            if (typeof updated === "function") {
              setOriginalMp3s((prev) => {
                const result = updated(prev);
                handleSetOriginalMp3s(result);
                return result;
              });
            } else {
              handleSetOriginalMp3s(updated);
            }
          }}
        />
      </div>

      {/* IMAGE CROPPER MODALS */}
      <ImageCropModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveCroppedImage} imageSrc={tempImage} />
      <ImageCropModal
        isOpen={coverModalOpen}
        onClose={() => setCoverModalOpen(false)}
        onSave={handleSaveCoverCroppedImage}
        imageSrc={tempCoverImage}
        aspect={16 / 9}
      />
    </div>
  );
};

export default DeputyStepOne;

/* ================================
   Helpers below (same file)
================================ */

function SortableList({ files, setFiles, previewAltPrefix }) {
  const dragItem = useRef();
  const dragOverItem = useRef();

  const handleDragStart = (idx) => {
    dragItem.current = idx;
  };
  const handleDragEnter = (idx) => {
    dragOverItem.current = idx;
  };
  const handleDragEnd = () => {
    const _files = [...files];
    const dragged = _files.splice(dragItem.current, 1)[0];
    _files.splice(dragOverItem.current, 0, dragged);
    dragItem.current = null;
    dragOverItem.current = null;
    setFiles(_files);
  };
  const handleDelete = (idx) => {
    const _files = [...files];
    _files.splice(idx, 1);
    setFiles(_files);
  };

  return (
    <div className="flex gap-2 mt-2 flex-wrap">
      {files.map((file, idx) => {
        const url = file instanceof File ? URL.createObjectURL(file) : file;
        return (
          <div
            key={idx}
            className="relative cursor-move"
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragEnter={() => handleDragEnter(idx)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
          >
            <img
              src={url}
              alt={`${previewAltPrefix} ${idx + 1}`}
              className="w-20 h-20 object-cover rounded"
              onLoad={(e) => {
                if (file instanceof File) URL.revokeObjectURL(e.target.src);
              }}
            />
            <button
              type="button"
              className="absolute top-0 right-0 bg-white text-black border border-gray-300 rounded-full w-5 h-5 flex items-center justify-center text-xs"
              onClick={() => handleDelete(idx)}
              tabIndex={-1}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}

function SortableFileList({ files, setFiles }) {
  const dragItem = useRef();
  const dragOverItem = useRef();

  const normalizeFiles = (filesArr) =>
    filesArr.map((f) => {
      if (typeof f === "object" && f?.file instanceof File) return f;
      if (f instanceof File) return { file: f, title: "" };
      return { file: null, title: "" };
    });

  files = normalizeFiles(files);

  const handleDragStart = (idx) => {
    dragItem.current = idx;
  };
  const handleDragEnter = (idx) => {
    dragOverItem.current = idx;
  };
  const handleDragEnd = () => {
    const _files = [...files];
    const dragged = _files.splice(dragItem.current, 1)[0];
    _files.splice(dragOverItem.current, 0, dragged);
    dragItem.current = null;
    dragOverItem.current = null;
    setFiles(_files);
  };
  const handleDelete = (idx) => {
    const _files = [...files];
    _files.splice(idx, 1);
    setFiles(_files);
  };

  return (
    <ul className="mt-2 text-sm space-y-1">
      {files.map((entry, idx) => {
        const { file, title } = entry;
        return (
          <li
            key={idx}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragEnter={() => handleDragEnter(idx)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className="flex items-center gap-2 border border-gray-200 px-2 py-1 rounded bg-white"
          >
            <img src={assets.reordering_icon} alt="Reorder" className="w-4 h-4 cursor-move" />
            <input
              type="text"
              className="border border-gray-300 rounded py-1 px-2 text-xs w-40"
              placeholder="Title"
              value={title || ""}
              onChange={(e) => {
                const updated = [...files];
                updated[idx] = { ...updated[idx], title: e.target.value };
                setFiles(updated);
              }}
            />
            <span className="truncate max-w-xs">{file?.name || "No file selected"}</span>
            <button type="button" onClick={() => handleDelete(idx)} className="text-sm text-red-500">
              ✕
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function SortableVideoLinkList({ links, setLinks, placeholderPrefix }) {
  const dragItem = useRef();
  const dragOverItem = useRef();

  const handleDragStart = (idx) => {
    dragItem.current = idx;
  };
  const handleDragEnter = (idx) => {
    dragOverItem.current = idx;
  };
  const handleDragEnd = () => {
    const _links = [...links];
    const dragged = _links.splice(dragItem.current, 1)[0];
    _links.splice(dragOverItem.current, 0, dragged);
    dragItem.current = null;
    dragOverItem.current = null;
    setLinks(_links);
  };
  const handleDelete = (idx) => {
    const _links = [...links];
    _links.splice(idx, 1);
    setLinks(_links);
  };
  const handleAdd = () => {
    setLinks([...(links || []), { url: "", title: "" }]);
  };
  const handleChange = (idx, field, value) => {
    const updated = [...links];
    updated[idx] = { ...updated[idx], [field]: value };
    setLinks(updated);
  };



  return (
    <div>
      {(links || []).map((link, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2 mb-2"
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragEnter={() => handleDragEnter(idx)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => e.preventDefault()}
        >
          <img src={assets.reordering_icon} alt="Reorder" className="w-4 h-4 cursor-move" />
          <input
            type="text"
            placeholder="Title"
            value={link.title || ""}
            onChange={(e) => handleChange(idx, "title", e.target.value)}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-1/2"
          />
          <input
            type="text"
            placeholder={`${placeholderPrefix} Video URL`}
            value={link.url || ""}
            onChange={(e) => handleChange(idx, "url", e.target.value)}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          />
          <button type="button" className="text-sm text-red-500" onClick={() => handleDelete(idx)}>
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="text-sm text-blue-600 underline" onClick={handleAdd}>
        + Add Link
      </button>
    </div>
  );
}