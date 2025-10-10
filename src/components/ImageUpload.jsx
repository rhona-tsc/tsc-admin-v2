import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { v4 as uuidv4 } from "uuid";
import renameAndCompressImage from "../pages/utils/renameAndCompressImage"; 


const MAX_IMAGES = 30;

const ImageUpload = ({ images, setImages, tscName, genres, bandMembers, lineupSize, additionalKeywords = [] }) => {
    const [isCompressing, setIsCompressing] = useState(false);


  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    onDrop: async (acceptedFiles) => {
      setIsCompressing(true);
    
      const newUrls = await renameAndCompressImage({
        images: acceptedFiles, 
        tscName,
        genres,
        bandMembers,
        lineupSize,
        additionalKeywords, 
      });

      setImages((prev) => {
        if (prev.length + newUrls.length > MAX_IMAGES) {
          alert(`You can only upload up to ${MAX_IMAGES} images.`);
          return prev;
        }
      
        const wrapped = newUrls.map((url) => ({
          id: uuidv4(),
          url,
        }));
      
        return [...prev, ...wrapped];
      });

      setIsCompressing(false);
    },
  });

  const moveImage = (dragIndex, hoverIndex) => {
    const updated = [...images];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(hoverIndex, 0, moved);
    setImages(updated);
  };

  const removeImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="col-span-3">
        <p className="mb-2 font-semibold">
          Images
        </p>

        {isCompressing && (
          <div className="text-sm text-gray-600 mb-2 animate-pulse">
            Compressing images, please wait...
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
          {(images || []).map((image, index) => (
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

export default ImageUpload;