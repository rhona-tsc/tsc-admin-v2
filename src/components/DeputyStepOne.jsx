import React, { useState, useEffect, useRef } from "react";
import DragAndDropImageUploader from "./DragAndDropImageUploader";
import ImageCropModal from "./ImageCropModal";
import { assets } from "../assets/assets";
import Mp3Uploader from "./Mp3Uploader";

const DeputyStepOne = ({
  formData = {},
  setFormData = () => {},
  userRole,
  isUploadingImages = false,
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

  // -------------------------------------
  // PREFILL MP3s WHEN EDITING
  // -------------------------------------
  useEffect(() => {
    console.log("🎵 PREFILL MP3s FROM formData:", {
      original: formData.originalMp3s,
      cover: formData.coverMp3s,
    });

    setOriginalMp3s(formData.originalMp3s || []);
    setCoverMp3s(formData.coverMp3s || []);
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

  // -------------------------------------
  // PROFILE IMAGE
  // -------------------------------------
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("🟨 PROFILE PIC selected:", {
      name: file.name,
      type: file.type,
      sizeKB: Math.round(file.size / 1024),
    });

    const reader = new FileReader();
    reader.onload = () => {
      setTempImage(reader.result);
      setModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCroppedImage = (blob) => {
    console.log("🟨 PROFILE PIC cropped:", blob);

    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);

    setFormData((prev) => ({
      ...prev,
      profilePicture: blob,
    }));
  };

  // -------------------------------------
  // COVER HERO IMAGE
  // -------------------------------------
  const handleCoverHeroChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("🟧 COVER HERO selected:", {
      name: file.name,
      type: file.type,
      sizeKB: Math.round(file.size / 1024),
    });

    const reader = new FileReader();
    reader.onload = () => {
      setTempCoverImage(reader.result);
      setCoverModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCoverCroppedImage = (blob) => {
    console.log("🟧 COVER HERO cropped:", blob);

    const url = URL.createObjectURL(blob);
    setCoverHeroPreviewUrl(url);

    setFormData((prev) => ({
      ...prev,
      coverHeroImage: blob,
    }));
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
            {formData.profilePicture ? "Change Profile Picture" : "Choose Profile Picture"}
          </label>

          <input
            id="profilePictureUpload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />

          {previewUrl ||
          (typeof formData.profilePicture === "string" && formData.profilePicture) ? (
            <img
              src={previewUrl || formData.profilePicture}
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
            {formData.coverHeroImage ? "Change Cover Image" : "Choose Cover Image"}
          </label>

          <input
            id="coverHeroUpload"
            name="coverHeroImage"
            type="file"
            accept="image/*"
            onChange={handleCoverHeroChange}
            className="hidden"
          />

          {(() => {
            const hasFile =
              !!coverHeroPreviewUrl ||
              (typeof formData.coverHeroImage === "string" && !!formData.coverHeroImage);

            console.log("🖼️ Cover Hero preview render:", {
              hasFile,
              coverHeroPreviewUrl,
              formDataCoverHero: formData.coverHeroImage,
            });

            return hasFile ? (
              <img
                src={coverHeroPreviewUrl || formData.coverHeroImage}
                alt="Cover Hero"
                className="mt-2 w-full aspect-video object-cover rounded-md border"
              />
            ) : (
              <img
                src={assets.cover_placeholder}
                alt="Cover Placeholder"
                className="mt-2 w-full aspect-video object-cover rounded-md border"
              />
            );
          })()}
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
              {/* … keep the full country list as you had it … */}
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
            files={formData.digitalWardrobeBlackTie}
            setFiles={(updatedFn) => {
              setFormData((prev) => {
                const previous = prev.digitalWardrobeBlackTie || [];
                const updated = typeof updatedFn === "function" ? updatedFn(previous) : updatedFn;

                const deleted = previous.filter(
                  (f) => !updated.includes(f) && typeof f === "string"
                );

                console.log("🖼️ [DW4-BLACKTIE] UPDATE", { previous, updated, deleted });

                return {
                  ...prev,
                  digitalWardrobeBlackTie: updated,
                  deletedImages: [...(prev.deletedImages || []), ...deleted],
                };
              });
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
            files={formData.digitalWardrobeFormal}
            setFiles={(updatedFn) => {
              setFormData((prev) => {
                const previous = prev.digitalWardrobeFormal || [];
                const updated = typeof updatedFn === "function" ? updatedFn(previous) : updatedFn;

                const deleted = previous.filter(
                  (f) => !updated.includes(f) && typeof f === "string"
                );

                console.log("🖼️ [DW4-FORMAL] UPDATE", { previous, updated, deleted });

                return {
                  ...prev,
                  digitalWardrobeFormal: updated,
                  deletedImages: [...(prev.deletedImages || []), ...deleted],
                };
              });
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
            files={formData.digitalWardrobeSmartCasual}
            setFiles={(updatedFn) => {
              setFormData((prev) => {
                const previous = prev.digitalWardrobeSmartCasual || [];
                const updated = typeof updatedFn === "function" ? updatedFn(previous) : updatedFn;

                const deleted = previous.filter(
                  (f) => !updated.includes(f) && typeof f === "string"
                );

                console.log("🖼️ [DW4-SMARTCASUAL] UPDATE", { previous, updated, deleted });

                return {
                  ...prev,
                  digitalWardrobeSmartCasual: updated,
                  deletedImages: [...(prev.deletedImages || []), ...deleted],
                };
              });
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
            files={formData.digitalWardrobeSessionAllBlack}
            setFiles={(updatedFn) => {
              setFormData((prev) => {
                const previous = prev.digitalWardrobeSessionAllBlack || [];
                const updated = typeof updatedFn === "function" ? updatedFn(previous) : updatedFn;
                const deleted = previous.filter((f) => !updated.includes(f) && typeof f === "string");
                const filtered = (updated || []).filter(
                  (f) => f && (typeof f === "string" || f instanceof File)
                );
                const unique = Array.from(
                  new Set(filtered.map((f) => (typeof f === "string" ? f : f.name)))
                ).map((name) => filtered.find((f) => (typeof f === "string" ? f : f.name) === name));
                return {
                  ...prev,
                  digitalWardrobeSessionAllBlack: unique,
                  deletedImages: [...(prev.deletedImages || []), ...deleted],
                };
              });
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
          setFiles={(updatedFn) => {
            setFormData((prev) => {
              const previous = prev.additionalImages || [];
              const updated = typeof updatedFn === "function" ? updatedFn(previous) : updatedFn;

              const deleted = previous.filter((f) => !updated.includes(f) && typeof f === "string");

              console.log("🖼️ [DW4-ADDITIONAL] UPDATE", { previous, updated, deleted });

              return {
                ...prev,
                additionalImages: updated,
                deletedImages: [...(prev.deletedImages || []), ...deleted],
              };
            });
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
          links={formData.functionBandVideoLinks || []}
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
            links={formData.tscApprovedFunctionBandVideoLinks || []}
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
          links={formData.originalBandVideoLinks || []}
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