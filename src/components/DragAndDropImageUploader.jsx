// src/components/DragAndDropImageUploader.jsx
import React, { useMemo, useRef } from "react";
import assets from "../assets/assets";

const isFile = (v) => typeof File !== "undefined" && v instanceof File;

const DragAndDropImageUploader = ({ label, files = [], setFiles }) => {
  const inputRef = useRef(null);

  const safeFiles = Array.isArray(files) ? files : [];

  const previews = useMemo(() => {
    // build previews for both URLs and File objects
    return safeFiles.map((f) => {
      if (typeof f === "string") return { kind: "url", src: f };
      if (isFile(f)) return { kind: "file", src: URL.createObjectURL(f) };
      return { kind: "none", src: "" };
    });
    // NOTE: we revoke File previews in onLoad below
  }, [safeFiles]);

  const handleFiles = (incomingFiles) => {
    const newFiles = Array.from(incomingFiles || []).filter(Boolean);

    // IMPORTANT: parent expects we pass either an array OR an updater fn
    setFiles((prev = []) => {
      const prevArr = Array.isArray(prev) ? prev : [];
      return [...prevArr, ...newFiles];
    });
  };

  const handleDeleteImage = (indexToRemove) => {
    setFiles((prev = []) => (Array.isArray(prev) ? prev : []).filter((_, i) => i !== indexToRemove));
  };

  const openPicker = () => {
    // user gesture → safe
    inputRef.current?.click();
  };

  return (
    <div
      className="relative rounded border-2 border-dashed border-gray-400 bg-gray-50 p-4 text-center"
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleFiles(e.dataTransfer.files);
      }}
    >
      <p className="text-sm text-gray-500">
        {label} — Click to upload or drag and drop images here
      </p>

      <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={openPicker}
          className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white hover:bg-[#ff6667]"
        >
          Choose images
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {safeFiles.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {previews.map((p, idx) => (
            <div key={idx} className="relative h-20 w-20">
              {p.src ? (
                <img
                  src={p.src}
                  alt={`preview-${idx}`}
                  className="h-full w-full rounded object-cover"
                  onLoad={() => {
                    // revoke object URLs to avoid memory leaks
                    if (p.kind === "file") {
                      try { URL.revokeObjectURL(p.src); } catch {}
                    }
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded bg-gray-200 text-xs text-gray-600">
                  No preview
                </div>
              )}

              <button
                type="button"
                onClick={() => handleDeleteImage(idx)}
                className="absolute right-1 top-1 rounded-full bg-white/80 p-1 shadow hover:bg-white"
                title="Remove image"
              >
                <img src={assets.black_bin_icon} alt="Delete" className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DragAndDropImageUploader;