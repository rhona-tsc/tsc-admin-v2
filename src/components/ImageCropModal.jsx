// ImageCropModal.jsx
import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";

/**
 * Converts cropped section to a Blob
 */
function getCroppedBlob(imageSrc, cropPixels, mime = "image/jpeg", quality = 0.92) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = cropPixels.width;
      canvas.height = cropPixels.height;

      const ctx = canvas.getContext("2d");

      ctx.drawImage(
        image,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        cropPixels.width,
        cropPixels.height
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Canvas is empty"));
          resolve(blob);
        },
        mime,
        quality
      );
    };

    image.onerror = reject;
  });
}

const ImageCropModal = ({
  isOpen,
  onClose,
  onSave,
  imageSrc,
  aspect = 1, // default square
  title = "Crop Image",
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_area, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

const handleSave = async () => {
  if (!imageSrc || !croppedAreaPixels) return;
  
  const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
  
  onSave?.(blob);   // send cropped file back
  onClose?.();      // 👈 CLOSE MODAL AFTER SAVE
};

  if (!isOpen) return null;

  return (
    <div
      className="
        fixed inset-0 bg-black/60 z-[9999]
        flex items-center justify-center
        p-4
      "
      role="dialog"
      aria-modal="true"
    >
      {/* Modal container */}
      <div
        className="
          bg-white rounded-lg shadow-xl w-full 
          max-w-3xl max-h-[90vh] 
          overflow-hidden flex flex-col
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-black text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4">
          <div
            className="
              relative w-full 
              h-[50vh] sm:h-[60vh] 
              max-h-[60vh] bg-black rounded-md overflow-hidden
            "
          >
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              cropShape="rect"
              showGrid={false}
              objectFit="contain"
              restrictPosition={true}
            />
          </div>

          {/* Zoom slider */}
          <div className="mt-4 flex items-center gap-4">
            <label className="text-gray-700 text-sm">Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-black text-white hover:bg-[#ff6667]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;