// ImageCropModal.jsx
import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";

function getCroppedBlob(imageSrc, cropPixels, mime = "image/jpeg", quality = 0.92) {
  return new Promise(async (resolve, reject) => {
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
        cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height,
        0, 0, cropPixels.width, cropPixels.height
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
  aspect = 1,       // 👈 default square; pass 16/9 to get widescreen
  title = "Crop Image"
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_area, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    const blob = await getCroppedBlob(imageSrc, croppedAreaPixels, "image/jpeg");
    onSave?.(blob);
  };

  if (!isOpen) return null;

  // Make the viewport itself 16:9 (or whatever aspect you pass) so it doesn't look square
  const viewportStyle = {
    aspectRatio: aspect,          // modern browsers; keeps the box ratio
    width: "100%",
    maxWidth: "900px",
    background: "#111",
    position: "relative",
    borderRadius: "0.5rem",
    overflow: "hidden",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-5xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-white text-lg font-semibold">{title}</h3>
          <button
            type="button"
            className="px-3 py-1 rounded bg-white/10 text-white hover:bg-white/20"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div style={viewportStyle} className="mx-auto">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            aspect={aspect}             // 👈 enforce 16:9 (or whatever)
            cropShape="rect"
            showGrid={false}
            objectFit="contain"
            restrictPosition={true}
          />
        </div>

        <div className="mt-4 flex items-center gap-4">
          <label className="text-white text-sm">Zoom</label>
          <input
            className="flex-1"
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
          <button
            type="button"
            className="ml-auto px-4 py-2 rounded bg-black text-white hover:bg-[#ff6667]"
            onClick={handleSave}
          >
            Save Crop
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;