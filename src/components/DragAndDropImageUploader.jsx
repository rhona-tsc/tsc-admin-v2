// src/components/DragAndDropImageUploader.jsx
import React, { useEffect, useMemo, useRef } from "react";
import { assets } from "../assets/assets";

const isFile = (value) =>
  typeof File !== "undefined" && value instanceof File;

const DragAndDropImageUploader = ({ label, files = [], setFiles }) => {
  const inputRef = useRef(null);

  const safeFiles = Array.isArray(files) ? files : [];

  const previews = useMemo(() => {
    return safeFiles.map((file) => {
      if (typeof file === "string") {
        return { kind: "url", src: file };
      }

      if (isFile(file)) {
        return { kind: "file", src: URL.createObjectURL(file) };
      }

      return { kind: "none", src: "" };
    });
  }, [safeFiles]);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => {
        if (preview.kind === "file" && preview.src) {
          try {
            URL.revokeObjectURL(preview.src);
          } catch {
            // ignore cleanup errors
          }
        }
      });
    };
  }, [previews]);

  const handleFiles = (incomingFiles) => {
    const newFiles = Array.from(incomingFiles || []).filter(Boolean);

    setFiles((prev = []) => {
      const prevArr = Array.isArray(prev) ? prev : [];

      // optional dedupe for File objects by name/size/lastModified
      const existingKeys = new Set(
        prevArr.map((item) => {
          if (typeof item === "string") return `url:${item}`;
          if (isFile(item)) {
            return `file:${item.name}:${item.size}:${item.lastModified}`;
          }
          return String(item);
        })
      );

      const uniqueNewFiles = newFiles.filter((item) => {
        const key = isFile(item)
          ? `file:${item.name}:${item.size}:${item.lastModified}`
          : String(item);

        if (existingKeys.has(key)) return false;
        existingKeys.add(key);
        return true;
      });

      return [...prevArr, ...uniqueNewFiles];
    });
  };

  const handleDeleteImage = (indexToRemove) => {
    setFiles((prev = []) =>
      (Array.isArray(prev) ? prev : []).filter((_, i) => i !== indexToRemove)
    );
  };

  const openPicker = () => {
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
          {previews.map((preview, idx) => (
            <div key={idx} className="relative h-20 w-20">
              {preview.src ? (
                <img
                  src={preview.src}
                  alt={`preview-${idx}`}
                  className="h-full w-full rounded object-cover"
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
                <img
                  src={assets.black_bin_icon}
                  alt="Delete"
                  className="h-4 w-4"
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DragAndDropImageUploader;