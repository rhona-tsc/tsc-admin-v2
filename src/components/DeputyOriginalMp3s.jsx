import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { v4 as uuidv4 } from "uuid";

const DeputyOriginalMp3s = ({ mp3s = [], setMp3s, isUploading, setIsUploading }) => {
  const onDrop = async (acceptedFiles) => {
    // 1. Immediately inside the `onDrop` function
    console.log("📥 Files dropped:", acceptedFiles.map(f => f.name));
    setIsUploading(true);

    const uploadPromises = acceptedFiles.map(async (file) => {
      // 2. Just before the `fetch` call
      console.log("⬆️ Uploading file to Cloudinary:", file.name);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "musicians");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dvcgr3fyd/video/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();
      // 3. After the `await response.json()` line
      console.log("✅ Cloudinary response:", data);

      return {
        id: uuidv4(),
        file,
        title: file.name.replace(/\.[^/.]+$/, ""),
        url: data.secure_url || "",
      };
    });

    const uploadedMp3s = await Promise.all(uploadPromises);
    setMp3s((prev) => {
      const newMp3s = [...(Array.isArray(prev) ? prev : []), ...uploadedMp3s];
      // 4. After `setMp3s(...)` is called
      console.log("🎵 Uploaded MP3s set in state:", uploadedMp3s);
      return newMp3s;
    });
    setIsUploading(false);
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "audio/mpeg": [".mp3"],
      "audio/wav": [".wav"],
      "audio/aac": [".aac"],
      "audio/ogg": [".ogg"],
      "audio/x-aiff": [".aiff"],
      "audio/flac": [".flac"],
    },
    onDrop,
  });

  const updateTitle = (id, newTitle) => {
    setMp3s((prev) => prev.map((mp3) => (mp3.id === id ? { ...mp3, title: newTitle } : mp3)));
  };

  const removeMp3 = (id) => {
    setMp3s((prev) => Array.isArray(prev) ? prev.filter((mp3) => mp3.id !== id) : []);
  };

  const moveMp3 = (dragIndex, hoverIndex) => {
    const updated = [...mp3s];
    const [dragged] = updated.splice(dragIndex, 1);
    updated.splice(hoverIndex, 0, dragged);
    setMp3s(updated);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-full">
        <p className="mb-2 font-semibold">MP3s</p>

        <div {...getRootProps()} className="border-2 border-dashed p-6 rounded-lg text-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer">
          <input {...getInputProps()} />
          <p className="text-sm text-gray-500">
            {isUploading ? (
              <span className="animate-pulse">Uploading your music...</span>
            ) : (
              "Drag & drop your original MP3s here, or click to browse"
            )}
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {Array.isArray(mp3s) && mp3s.map((mp3, index) => (
            <Mp3Item
              key={mp3.id}
              index={index}
              mp3={mp3}
              updateTitle={updateTitle}
              removeMp3={() => removeMp3(mp3.id)}
              moveMp3={moveMp3}
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
};

const Mp3Item = ({ mp3, index, updateTitle, removeMp3, moveMp3 }) => {
  const [{ isDragging }, dragRef] = useDrag({
    type: "MP3",
    item: { index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [, dropRef] = useDrop({
    accept: "MP3",
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveMp3(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => dragRef(dropRef(node))}
      className={`flex items-center gap-4 p-2 bg-gray-100 rounded transition ${isDragging ? "opacity-50" : "opacity-100"}`}
    >
      <input
        type="text"
        value={mp3.title || ""}
        onChange={(e) => updateTitle(mp3.id, e.target.value)}
        className="flex-1 px-2 py-1 border rounded"
        placeholder="Track title..."
      />
      <span className="text-xs text-gray-500">
        {mp3?.file?.name || mp3?.url?.split("/").pop() || "Untitled"}
      </span>
      <button type="button" className="bg-black text-white hover:bg-[#ff6667] text-sm px-2 py-1 rounded" onClick={removeMp3}>
        ✖
      </button>
    </div>
  );
};

export default DeputyOriginalMp3s;