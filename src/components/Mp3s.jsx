import React from "react";
import { useDropzone } from "react-dropzone";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { v4 as uuidv4 } from "uuid";

const Mp3s = ({ mp3s, setMp3s }) => {
  const onDrop = (acceptedFiles) => {
    const newMp3s = acceptedFiles.map((file) => ({
      id: uuidv4(),
      file,
      title: file.name.replace(/\.[^/.]+$/, ""), // Strip extension
    }));
    setMp3s((prev) => [...prev, ...newMp3s]);
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "audio/mpeg": [".mp3"],
      "audio/wav": [".wav"],
      "audio/x-wav": [".wav"],
      "audio/aac": [".aac"],
      "audio/ogg": [".ogg"],
      "audio/x-aiff": [".aiff"],
      "audio/flac": [".flac"],
    },    onDrop,
  });

  const updateTitle = (id, newTitle) => {
    setMp3s((prev) =>
      prev.map((mp3) => (mp3.id === id ? { ...mp3, title: newTitle } : mp3))
    );
  };

  const removeMp3 = (id) => {
    setMp3s((prev) => prev.filter((mp3) => mp3.id !== id));
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

        <div
          {...getRootProps()}
          className="border-2 border-dashed p-6 rounded-lg text-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer"
        >
          <input {...getInputProps()} />
          <p>Drag & drop MP3s here, or click to browse</p>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {mp3s.map((mp3, index) => (
            <Mp3Item
            key={mp3.id || mp3.url || index}
              index={index}
              mp3={mp3}
              updateTitle={updateTitle}
              removeMp3={removeMp3}
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
      className={`flex items-center gap-4 p-2 bg-gray-100 rounded transition ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <input
        type="text"
        value={mp3.title || ""}
        onChange={(e) => updateTitle(mp3.id || mp3.url || index, e.target.value)}
        className="flex-1 px-2 py-1 border rounded"
        placeholder="Track title..."
      />
      <span className="text-xs text-gray-500">
        {mp3?.file?.name || mp3?.url?.split("/").pop() || "Untitled"}
      </span>
      <button
        type="button"
        className="bg-black text-white hover:bg-[#ff6667] text-sm px-2 py-1 rounded"
        onClick={() => removeMp3(mp3.id || mp3.url || index)}
      >
        ✖
      </button>
    </div>
  );
};

export default Mp3s;