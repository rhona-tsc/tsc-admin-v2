import React, { useState } from "react";
import Cropper from "react-easy-crop";
import Modal from "react-modal";
import { useDropzone } from "react-dropzone";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { v4 as uuidv4 } from "uuid";

// ⬇️ use the circular version below
import getCroppedImg from "..//utils/getCroppedImgCircle";

const MAX_IMAGES = 1;

const MusicianProfileImageUpload = ({
  profileImage,
  setProfileImage,
  tscName,
  genres,
  bandMembers,
  lineupSize,
  additionalKeywords = [],
}) => {
  const [isCompressing, setIsCompressing] = useState(false);

  // Crop modal state and helpers
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const showCropModal = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const completeCrop = async () => {
    try {
      setIsCompressing(true);

      // ✅ Export circular PNG (transparent corners), 1024×1024
      const croppedFile = await getCroppedImg(imageToCrop, croppedAreaPixels, 1024);

      // Upload to Cloudinary (unsigned)
      const formData = new FormData();
      formData.append("file", croppedFile);
      formData.append("upload_preset", "musicians");

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dvcgr3fyd/image/upload",
        { method: "POST", body: formData }
      );
      const data = await response.json();

      setProfileImage([
        { id: uuidv4(), url: data.secure_url, title: "Main Act Profile Picture" },
      ]);

      setCropModalOpen(false);
      setImageToCrop(null);
    } catch (e) {
      console.error("Crop/upload failed", e);
    } finally {
      setIsCompressing(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (!acceptedFiles?.length) return;
      if (profileImage?.length >= MAX_IMAGES) return;
      showCropModal(acceptedFiles[0]);
    },
  });

  const moveImage = (dragIndex, hoverIndex) => {
    const updated = [...(profileImage || [])];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(hoverIndex, 0, moved);
    setProfileImage(updated);
  };

  const removeImage = (id) => {
    setProfileImage((prev) => (prev || []).filter((img) => img.id !== id));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="col-span-3">
        <p className="mb-2 font-semibold">Musician Profile Image</p>

        {isCompressing && (
          <div className="text-sm text-gray-600 mb-2 animate-pulse">
            Processing image, please wait...
          </div>
        )}

        <div
          {...getRootProps()}
          className="border-2 border-dashed p-6 rounded-lg text-center cursor-pointer hover:bg-gray-100 transition"
        >
          <input {...getInputProps()} />
          <p>Drag &amp; drop or click to upload</p>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 mb-4">
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

      <Modal
        isOpen={cropModalOpen}
        onRequestClose={() => setCropModalOpen(false)}
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
              // ⭕️ circle crop UI, square aspect
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
            />
          )}
        </div>
        <div className="flex justify-end gap-4 mt-4">
          <button
            onClick={() => setCropModalOpen(false)}
            className="px-4 py-2 bg-gray-300 rounded"
          >
            Cancel
          </button>
          <button
            onClick={completeCrop}
            className="px-4 py-2 bg-black text-white rounded"
          >
            Confirm Crop
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
        // ⭕️ round preview
        className="w-24 h-24 object-cover rounded-full border shadow-sm"
      />
      <button
        type="button"
        onClick={() => removeImage(image.id)}
        className="absolute top-0 right-0 bg-black text-white p-1 text-xs rounded hover:bg-red-500"
      >
        ✖
      </button>
    </div>
  );
};

export default MusicianProfileImageUpload;