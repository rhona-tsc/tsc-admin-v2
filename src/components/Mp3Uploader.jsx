import React, { useRef, useRef as useRefAlias } from "react";

const Mp3Uploader = ({ label, mp3s, setMp3s }) => {
  const inputRef = useRef();
  const uploadingSetRef = useRefAlias(new Set()); // tracks `${name}-${size}` currently uploading

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
    const files = [...e.dataTransfer.files].filter((f) => f.type === "audio/mpeg");
    log("Dropped files:", files.map((f) => f.name));
    await handleUpload(files);
  };

  const handleUpload = async (files) => {
    for (const file of files) {
      const fileKey = makeFileKey(file);

      // prevent duplicate concurrent uploads of the same file
      if (uploadingSetRef.current.has(fileKey)) {
        log("⛔️ Skipping (already uploading):", fileKey);
        continue;
      }
      uploadingSetRef.current.add(fileKey);

      try {
        // If it’s already in state, skip before uploading (cheap check)
        let shouldSkip = false;
        setMp3s((prev) => {
          const skip = alreadyInList(prev, { file });
          if (skip) shouldSkip = true;
          return prev;
        });
        if (shouldSkip) {
          log("⛔️ Skipping (already in list):", fileKey);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "musicians");

        // You can keep /video/upload for mp3s; Cloudinary treats audio under video resource type.
        const res = await fetch(
          "https://api.cloudinary.com/v1_1/dvcgr3fyd/video/upload",
          { method: "POST", body: formData }
        );
        const data = await res.json();

        if (!res.ok || !data.secure_url) {
          log("❌ Upload failed response:", data);
          continue;
        }

        log(`✅ Uploaded ${file.name} →`, data.secure_url);

        // Functional update with de-dupe guard
        setMp3s((prev) => {
          if (alreadyInList(prev, { url: data.secure_url, file })) {
            log("⛔️ Not adding (duplicate after upload):", fileKey);
            return prev;
          }
          const next = [
            ...prev,
            {
              title: file.name.replace(/\.mp3$/i, ""),
              url: data.secure_url,
              __fileKey: fileKey, // hidden key to aid future de-duping
            },
          ];
          log("🎶 Updated mp3s state:", next);
          return next;
        });
      } catch (err) {
        log("❌ Upload error:", err);
      } finally {
        uploadingSetRef.current.delete(fileKey);
      }
    }
  };

  const handleFileChange = (e) => {
    const files = [...(e.target.files || [])];
    handleUpload(files);
    // allow re-selecting the same file later
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
      className="border-dashed border-2 p-4 rounded-lg text-center cursor-pointer"
      onClick={() => inputRef.current?.click()}
    >
      <input
        type="file"
        accept="audio/mpeg"
        multiple
        ref={inputRef}
        className="hidden"
        onChange={handleFileChange}
      />
      <p>Drag & drop your MP3s here or click to upload</p>

      <ul className="mt-4">
        {mp3s.map((mp3, index) => (
          <li key={mp3.__fileKey || `${mp3.url}-${index}`} className="flex items-center gap-2 mb-2">
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