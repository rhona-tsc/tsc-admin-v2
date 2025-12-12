// src/components/DragAndDropImageUploader.jsx
import React, { useRef, useEffect } from "react";
import assets from "../assets/assets";

const DragAndDropImageUploader = ({ label, files, setFiles }) => {
  const inputRef = useRef();

  // Log rendering with files

  const handleFiles = (incomingFiles) => {
    console.log("Incoming files:", incomingFiles);
    console.log("Files array after formatting:", Array.from(incomingFiles || []));
    const newFiles = Array.from(incomingFiles || []);
    setFiles(prev => {
      const resolvedPrev = typeof prev === "function" ? prev([]) : prev;
      const updated = Array.isArray(resolvedPrev) ? [...resolvedPrev, ...newFiles] : [...newFiles];
      console.log("Updated files state:", updated);
      return updated;
    });
  };

  const handleDeleteImage = (indexToRemove) => {
    setFiles(prev => (prev || []).filter((_, index) => index !== indexToRemove));
  };

  return (
    <div
      onDrop={(e) => {
        e.preventDefault();
        console.log("Dropped files:", e.dataTransfer.files);
        handleFiles(e.dataTransfer.files);
      }}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-gray-400 p-4 rounded text-center cursor-pointer bg-gray-50"
      onClick={(e) => {
        if (e.target.closest("button")) return;
        inputRef.current.click();
      }}
    >
      <p className="text-sm text-gray-500">{label} — Click or drag and drop images here</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          console.log("Selected files:", e.target.files);
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {Array.isArray(files) && files.length > 0 && (
        <div className="flex flex-wrap mt-2 gap-2">
          {files.map((file, idx) => {
            // Only use string URLs for preview, since upload is immediate
            const preview = typeof file === "string" ? file : undefined;
            return (
              <div key={idx} className="relative w-20 h-20">
                {preview ? (
                  <img src={preview} alt={`preview-${idx}`} className="w-full h-full object-cover rounded" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded">No preview</div>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteImage(idx)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-white bg-opacity-75 hover:bg-opacity-100 shadow"
                  title="Remove image"
                >
                  <img src={assets.black_bin_icon} alt="Delete" className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DragAndDropImageUploader;