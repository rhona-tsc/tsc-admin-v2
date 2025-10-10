
const retryUpload = async (formData, retries = 2) => {
  const upload = async () => {
    const res = await fetch("https://api.cloudinary.com/v1_1/dvcgr3fyd/video/upload", {
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
      console.warn(`Retrying MP3 upload (${i + 1}/${retries})...`);
    }
  }
};

const uploadMp3s = async ({ mp3s }) => {
  if (!Array.isArray(mp3s)) return [];

  const uploadedMp3s = await Promise.all(
    mp3s.map(async ({ file, title }) => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "ml_default");
        formData.append("folder", "mp3s");

        const res = await fetch("https://api.cloudinary.com/v1_1/dvcgr3fyd/video/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
        const data = await res.json();

        return {
          title: title || file.name.replace(/\.[^/.]+$/, ""),
          url: data.secure_url,
        };
      } catch (err) {
        console.error("❌ MP3 upload failed:", err);
        return null;
      }
    })
  );

  return uploadedMp3s.filter(Boolean);
};



export default uploadMp3s;