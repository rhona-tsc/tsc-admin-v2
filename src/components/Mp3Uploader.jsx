import React, { useRef, useState } from "react";

const Mp3Uploader = ({ label, mp3s, setMp3s }) => {
  const inputRef = useRef();
  const uploadingSetRef = useRef(new Set()); // tracks `${name}-${size}`
  const [isUploading, setIsUploading] = useState(false);

  const log = (...args) => console.log(`🎧 [Mp3Uploader:${label}]`, ...args);

  const makeFileKey = (file) => `${file.name}::${file.size}`;

  const alreadyInList = (prev, { url, file }) => {
    const key = file ? makeFileKey(file) : null;
    return prev.some(
      (m) =>
        m.url === url ||
        (key && (m.__fileKey === key || m.title === file.name.replace(/\.mp3$/i, "")))
    );
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    if (isUploading) return; // prevent overlap

    const files = [...e.dataTransfer.files].filter((f) => f.type === "audio/mpeg");
    log("Dropped files:", files.map((f) => f.name));
    handleUpload(files);
  };

  const handleUpload = async (files) => {
    if (!files.length) return;

    setIsUploading(true);

    for (const file of files) {
      const fileKey = makeFileKey(file);

      if (uploadingSetRef.current.has(fileKey)) {
        log("⛔️ Skipping (already uploading):", fileKey);
        continue;
      }
      uploadingSetRef.current.add(fileKey);

      try {
        let shouldSkip = false;
        setMp3s((prev) => {
          const skip = alreadyInList(prev, { file });
          if (skip) shouldSkip = true;
          return prev;
        });
        if (shouldSkip) continue;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "musicians");

        const res = await fetch(
          "https://api.cloudinary.com/v1_1/dvcgr3fyd/video/upload",
          { method: "POST", body: formData }
        );
        const data = await res.json();

        if (!res.ok || !data.secure_url) {
          log("❌ Upload failed:", data);
          continue;
        }

        log(`✅ Uploaded ${file.name}`);

        setMp3s((prev) => {
          if (alreadyInList(prev, { url: data.secure_url, file })) return prev;

          return [
            ...prev,
            {
              title: file.name.replace(/\.mp3$/i, ""),
              url: data.secure_url,
              __fileKey: fileKey,
            },
          ];
        });
      } catch (err) {
        log("❌ Upload error:", err);
      } finally {
        uploadingSetRef.current.delete(fileKey);
      }
    }

    setIsUploading(false);
  };

  const handleFileChange = (e) => {
    const files = [...(e.target.files || [])];
    handleUpload(files);
    e.target.value = "";
  };

  const handleDelete = (index) => {
    setMp3s((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTitleChange = (index, newTitle) => {
    setMp3s((prev) =>
      prev.map((mp3, i) => (i === index ? { ...mp3, title: newTitle } : mp3))
    );
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className={`border-dashed border-2 p-4 rounded-lg text-center cursor-pointer relative ${
        isUploading ? "opacity-60 pointer-events-none" : ""
      }`}
      onClick={() => !isUploading && inputRef.current?.click()}
    >
      {/* Hidden File Input */}
      <input
        type="file"
        accept="audio/mpeg"
        multiple
        ref={inputRef}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Upload Area Text */}
      <p className="text-gray-600">
        {isUploading ? "Uploading your MP3s..." : "Drag & drop your MP3s here or click to upload"}
      </p>

      {/* 🔄 Global Spinner */}
      {isUploading && (
        <div className="flex justify-center mt-3">
          <div className="h-6 w-6 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
        </div>
      )}

      {/* List of Uploaded MP3s */}
      <ul className="mt-4">
        {mp3s.map((mp3, index) => (
          <li
            key={mp3.__fileKey || `${mp3.url}-${index}`}
            className="flex items-center gap-2 mb-2"
          >
            <input
              type="text"
              value={mp3.title}
              onChange={(e) => handleTitleChange(index, e.target.value)}
              className="border px-2 py-1 w-full"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(index);
              }}
              className="text-red-500 font-bold"
            >
              ✖
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Mp3Uploader;