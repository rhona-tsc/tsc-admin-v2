// cropImage.js
export default function getCroppedImg(imageSrc, croppedAreaPixels, width, height) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = 'anonymous'; // 🔐 ensures CORS compatibility if needed

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) return reject(new Error("Canvas context could not be retrieved"));

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        width,
        height
      );

      canvas.toBlob(blob => {
        if (!blob) {
          return reject(new Error("Canvas is empty"));
        }
        const file = new File([blob], 'cropped.jpeg', { type: 'image/jpeg' });
        resolve(file);
      }, 'image/jpeg', 1);
    };

    image.onerror = (err) => {
      reject(new Error("Image failed to load"));
    };
  });
}