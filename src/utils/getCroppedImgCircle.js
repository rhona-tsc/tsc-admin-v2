// Returns a File (PNG with transparency) cropped to a circle at given outputSize (default 1024)
export default async function getCroppedImg(imageSrc, cropPixels, outputSize = 1024) {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = outputSize;
  canvas.height = outputSize;

  // Clip to a circle
  ctx.beginPath();
  ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();

  // Draw selected crop region into circular clip
  const { x, y, width, height } = cropPixels;
  ctx.drawImage(image, x, y, width, height, 0, 0, outputSize, outputSize);

  // Export as transparent PNG
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        const file = new File([blob], "profile-circle.png", { type: "image/png" });
        resolve(file);
      },
      "image/png",
      1
    );
  });
}

function createImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (err) => reject(err));
    img.crossOrigin = "anonymous";
    img.src = url;
  });
}