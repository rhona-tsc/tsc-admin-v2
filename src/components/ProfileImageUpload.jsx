import React, { useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import Modal from "react-modal";
import { useDropzone } from "react-dropzone";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { v4 as uuidv4 } from "uuid";
import getCroppedImg from "../pages/utils/cropImage"; // must return a Blob
// import renameAndCompressImage from "../pages/utils/renameAndCompressImage"; // not used here

const MAX_IMAGES = 1;

const ProfileImageUpload = ({
  profileImage,
  setProfileImage,
  tscName,
  genres,
  bandMembers,
  lineupSize,
  additionalKeywords = [],
}) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null); // data URL
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Ensure react-modal is accessibility-safe
  useEffect(() => {
    try {
      Modal.setAppElement("#root");
    } catch {
      /* if no #root (tests), ignore */
    }
  }, []);

  const showCropModal = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCancel = () => {
    // Never crop on cancel
    setCropModalOpen(false);
    setImageToCrop(null);
    setCroppedAreaPixels(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const handleConfirm = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!imageToCrop || !croppedAreaPixels || isSaving) return;

    setIsSaving(true);
    setIsCompressing(true);
    try {
      // 1) Generate cropped blob (portrait 900x1200 – adjust if you like)
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels, 900, 1200);

      // 2) Wrap blob in a File so Cloudinary gets a filename
      const croppedFile = new File([croppedBlob], "profile-cropped.jpg", {
        type: croppedBlob.type || "image/jpeg",
      });

      // 3) Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", croppedFile);
      formData.append("upload_preset", "musicians");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dvcgr3fyd/image/upload",
        { method: "POST", body: formData }
      );
      const data = await res.json();

      if (!res.ok || !data.secure_url) {
        console.error("Cloudinary upload failed:", data);
        throw new Error(data?.error?.message || "Upload failed");
      }

      // 4) Replace/insert into list (enforce MAX_IMAGES = 1)
      const newEntry = {
        id: uuidv4(),
        url: data.secure_url,
        title: "Main Act Profile Picture",
      };
      setProfileImage((prev = []) => {
        const next = [newEntry, ...prev];
        return next.slice(0, MAX_IMAGES);
      });
    } catch (err) {
      console.error("🛑 Crop/upload error:", err);
      // Optional: toast error here
    } finally {
      setIsSaving(false);
      setIsCompressing(false);
      // Always close/reset after confirm
      setCropModalOpen(false);
      setImageToCrop(null);
      setCroppedAreaPixels(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles?.length) showCropModal(acceptedFiles[0]);
    },
  });

  const moveImage = (dragIndex, hoverIndex) => {
    setProfileImage((prev = []) => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(hoverIndex, 0, moved);
      return updated;
    });
  };

  const removeImage = (id) => {
    setProfileImage((prev = []) => prev.filter((img) => img.id !== id));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="col-span-3">
        <p className="mb-2 font-semibold">Act Profile Image</p>

        {isCompressing && (
          <div className="text-sm text-gray-600 mb-2 animate-pulse">
            Processing image…
          </div>
        )}

        <div
          {...getRootProps()}
          className="border-2 border-dashed p-6 rounded-lg text-center cursor-pointer hover:bg-gray-100 transition"
        >
          <input {...getInputProps()} />
          <p>Drag & drop or click to upload</p>
          <p className="text-xs text-gray-500 mt-1">JPG/PNG/WebP</p>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {(profileImage || []).map((image, index) => (
            <ImageItem
              key={image.id || index}
              index={index}
              image={image}
              moveImage={moveImage}
              removeImage={removeImage}
            />
          ))}
        </div>
      </div>

      {/* Crop Modal */}
      <Modal
        isOpen={cropModalOpen}
        onRequestClose={handleCancel}
        shouldCloseOnOverlayClick={false}
        contentLabel="Crop Image"
        className="fixed inset-0 bg-white p-6 overflow-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-50"
      >
        <div className="w-full h-[calc(100vh-200px)] relative bg-gray-100">
          {imageToCrop && (
            <Cropper
              image={imageToCrop}
              crop={crop}
              zoom={zoom}
              aspect={524 / 636} // ✅ portrait aspect you wanted
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(ignored, pixels) => setCroppedAreaPixels(pixels)}
              restrictPosition={true}
              cropShape="rect"
              showGrid={false}
            />
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
            disabled={isSaving}
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
            disabled={isSaving || !croppedAreaPixels}
          >
            {isSaving ? "Saving…" : "Confirm Crop"}
          </button>
        </div>
      </Modal>
    </DndProvider>
  );
};

const ImageItem = ({ image, index, moveImage, removeImage }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "IMAGE",
    item: { index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [, drop] = useDrop({
    accept: "IMAGE",
    hover: (dragged) => {
      if (dragged.index !== index) {
        moveImage(dragged.index, index);
        dragged.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`relative w-24 h-24 ${isDragging ? "opacity-50" : ""}`}
    >
      <img
        src={image.url}
        alt="preview"
        className="w-24 h-24 object-cover rounded border shadow-sm"
      />
      <button
        type="button"
        onClick={() => removeImage(image.id)}
        className="absolute top-0 right-0 bg-black text-white p-1 text-xs rounded hover:bg-red-500"
        aria-label="Remove image"
      >
        ✖
      </button>
    </div>
  );
};

export default ProfileImageUpload;