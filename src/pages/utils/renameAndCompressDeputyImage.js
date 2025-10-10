import imageCompression from "browser-image-compression";
import { v4 as uuidv4 } from "uuid";
import { keywordCategories } from "./keywordCategories";

const retryUpload = async (formData, retries = 2) => {
  const upload = async () => {
    const res = await fetch("https://api.cloudinary.com/v1_1/dvcgr3fyd/image/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
    return res.json();
  };

  for (let i = 0; i <= retries; i++) {
    try {
      return await upload();
    } catch (err) {
      if (i === retries) throw err;
      console.warn(`Retrying upload (${i + 1}/${retries})...`);
    }
  }
};

const generateSeoFileName = (file, address = "", additionalKeywords = []) => {
  const baseName = file.name.replace(/\.[^/.]+$/, "");
  const keywords = [baseName, ...additionalKeywords, address, uuidv4()].filter(Boolean).join("-");
  return `${keywords}.jpg`.toLowerCase().replace(/[^a-z0-9\-]/g, "");
};

const renameAndCompressImage = async ({ images = [], address = {}, additionalKeywords = [] }) => {
  const options = { maxSizeMB: 1, maxWidthOrHeight: 1920 };
  
  return await Promise.all(
    images.map(async (image) => {
      // ✅ If already uploaded (URL), skip compression and renaming
      if (typeof image === "string" && image.startsWith("http")) {
        return image;
      }

      // ✅ Ensure the image is a File or Blob
      if (!(image instanceof File || image instanceof Blob)) {
        console.error("❌ Invalid image type:", image);
        return null;
      }

      try {
        const compressed = await imageCompression(image, options);
        const renamedFile = new File(
          [compressed],
          generateSeoFileName(image, address, additionalKeywords),
          { type: compressed.type, lastModified: Date.now() }
        );

        const formData = new FormData();
        formData.append("file", renamedFile);
        formData.append("upload_preset", "musicians");
                formData.append("folder", "acts");

        const { secure_url } = await retryUpload(formData);
        return secure_url;
      } catch (err) {
        console.error("❌ Failed to compress/upload image:", err);
        return null;
      }
    })
  );
};

export default renameAndCompressImage;