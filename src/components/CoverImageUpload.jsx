import React, { useState } from "react";
import Cropper from "react-easy-crop";
import Modal from "react-modal";
import getCroppedImg from "../pages/utils/cropImage"; // utility to handle cropping
import { useDropzone } from "react-dropzone";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { v4 as uuidv4 } from "uuid";
import renameAndCompressImage from "../pages/utils/renameAndCompressImage"; 


const MAX_IMAGES = 1;

const CoverImageUpload = ({ coverImage, setCoverImage, tscName, genres, bandMembers, lineupSize, additionalKeywords = [] }) => {
  const [isCompressing, setIsCompressing] = useState(false);

  // Crop modal state and helpers
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const showCropModal = (file) => {
    console.log("📸 Selected file for cropping:", file);
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

const completeCrop = async () => {
  setIsCompressing(true);

  const croppedFile = await getCroppedImg(imageToCrop, croppedAreaPixels, 2756, 896);

  // 🆕 Upload to Cloudinary
  const formData = new FormData();
  formData.append("file", croppedFile);
  formData.append("upload_preset", "musicians"); // set this up in Cloudinary

  const response = await fetch("https://api.cloudinary.com/v1_1/dvcgr3fyd/image/upload", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  setCoverImage([{ id: uuidv4(), url: data.secure_url, title: "Main Cover" }]);

  setIsCompressing(false);
  setCropModalOpen(false);
  setImageToCrop(null);
};

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    onDrop: async (acceptedFiles) => {
      console.log("📂 Files dropped:", acceptedFiles);
      if (acceptedFiles.length > 0) {
        showCropModal(acceptedFiles[0]);
      }
    }
  });

  const moveImage = (dragIndex, hoverIndex) => {
    const updated = [...coverImage];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(hoverIndex, 0, moved);
    setCoverImage(updated);
  };

  const removeImage = (id) => {
    setCoverImage((prev) => prev.filter((img) => img.id !== id));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="col-span-3">
        <p className="mb-2 font-semibold">
          Landscape Cover Image
        </p>

        {isCompressing && (
          <div className="text-sm text-gray-600 mb-2 animate-pulse">
            Compressing image, please wait...
          </div>
        )}

        <div
          {...getRootProps()}
          className="border-2 border-dashed p-6 rounded-lg text-center cursor-pointer hover:bg-gray-100 transition"
        >
          <input {...getInputProps()} />
          <p>Drag & drop or click to upload</p>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {(coverImage || []).map((image, index) => (
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
  aspect={2756 / 896}
  onCropChange={setCrop}
  onZoomChange={setZoom}
  onCropComplete={(croppedArea, croppedAreaPixels) => {
    console.log("📸 Cropped area pixels:", croppedAreaPixels);
    setCroppedAreaPixels(croppedAreaPixels);
  }}
/>
          )}
        </div>
        <div className="flex justify-end gap-4 mt-4">
          <button onClick={() => setCropModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded">
            Cancel
          </button>
          <button onClick={completeCrop} className="px-4 py-2 bg-black text-white rounded">
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
        className="w-24 h-24 object-cover rounded border shadow-sm"
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

export default CoverImageUpload;