import imageCompression from "browser-image-compression";
import { v4 as uuidv4 } from "uuid";
import { keywordCategories } from "./keywordCategories";

const ukRegionMap = {
  "north west": ["lancashire", "manchester", "cheshire", "cumbria", "merseyside"],
  "north east": ["durham", "northumberland", "tyne and wear"],
  "midlands": ["west midlands", "east midlands", "warwickshire", "leicestershire", "derbyshire", "nottinghamshire"],
  "south west": ["cornwall", "devon", "somerset", "bristol", "gloucestershire", "bath"],
  "south east": ["kent", "sussex", "hampshire", "berkshire", "surrey", "brighton"],
  "london": ["london"],
  "wales": ["wales", "south wales"],
};

const getUserCounties = (bandMembers) =>
  bandMembers
    .map((m) => m.postCode?.split(" ")[0]?.toLowerCase())
    .filter(Boolean);

const renameAndCompressImage = async ({
  
  images = [],
  tscName = "",
  genres = [],
  lineupSize = "",
  bandMembers = [],
  additionalKeywords = [],
}) => {
  const allKeywords = new Set();
  const genreString = genres.map((g) => g.toLowerCase()).join(" ");
  const instruments = bandMembers.map((m) => m.instrument?.toLowerCase()).filter(Boolean).join(" ");
  const counties = getUserCounties(bandMembers);

  // Add universal, genre, instrument, region, city, Irish, and dynamic keywords
  keywordCategories.universal.forEach((kw) => allKeywords.add(kw));

  Object.entries(keywordCategories.genre).forEach(([genreKey, kws]) => {
    if (genreString.includes(genreKey)) kws.forEach((kw) => allKeywords.add(kw));
  });

  if (bandMembers.some((m) => m.canDJ)) keywordCategories.dj.forEach((kw) => allKeywords.add(kw));

  Object.entries(keywordCategories.instrument).forEach(([instrument, kws]) => {
    if (instruments.includes(instrument)) kws.forEach((kw) => allKeywords.add(kw));
  });

  Object.entries(keywordCategories.region).forEach(([region, kws]) => {
    const match = ukRegionMap[region]?.some((county) =>
      counties.some((userCounty) => userCounty.includes(county.toLowerCase()))
    );
    if (match) kws.forEach((kw) => allKeywords.add(kw));
  });

  Object.entries(keywordCategories.cities).forEach(([city, kws]) => {
    if (counties.some((c) => city.toLowerCase().includes(c))) kws.forEach((kw) => allKeywords.add(kw));
  });

  if (genreString.includes("irish") || genres.includes("Irish")) {
    keywordCategories.irish.forEach((kw) => allKeywords.add(kw));
  }

  for (let kw of additionalKeywords) {
    if (/\{county\}/.test(kw)) {
      counties.forEach((c) => {
        allKeywords.add(kw.replace("{county}", c));
      });
    } else {
      allKeywords.add(kw);
    }
  }

  const cleaned = Array.from(allKeywords)
    .map((kw) =>
      kw
        .toLowerCase()
        .replace(/\{.*?\}/g, "")
        .replace(/[^a-z0-9\s-]/gi, "")
        .trim()
        .replace(/\s+/g, "-")
    )
    .filter(Boolean);

    const keywordArray = [...new Set(cleaned)];

    const uploadedUrls = await Promise.all(
      images.map(async (img, i) => {
        try {
          const fileToCompress = img.file || img;
          const compressed = await imageCompression(fileToCompress, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          });
    
          const keyword = keywordArray[i % keywordArray.length] || "band";
          const seoName = `${tscName?.toLowerCase().replace(/\s+/g, "-")}-${lineupSize?.toLowerCase().replace(/\s+/g, "-")}-${keyword}-${uuidv4()}.jpg`;
          const renamedFile = new File([compressed], seoName, { type: compressed.type });
    
          const formData = new FormData();
          formData.append("file", renamedFile);
          formData.append("upload_preset", "ml_default");
          formData.append("folder", "acts");
    
          const res = await fetch("https://api.cloudinary.com/v1_1/dvcgr3fyd/image/upload", {
            method: "POST",
            body: formData,
          });
    
          const data = await res.json();
          return data.secure_url || null;
        } catch (err) {
          console.error("❌ Error compressing/uploading image:", err);
          return null;
        }
      })
    );

  return uploadedUrls;
};

export default renameAndCompressImage;
