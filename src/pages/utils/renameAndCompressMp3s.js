// utils/renameAndCompressMp3s.js
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

export const renameAndCompressMp3s = async ({
  mp3s = [],
  genres = [],
  lineupSize = "",
  bandMembers = [],
  additionalKeywords = [],
}) => {
  const allKeywords = new Set();
  const genreString = genres.map((g) => g.toLowerCase()).join(" ");
  const instruments = bandMembers.map((m) => m.instrument?.toLowerCase()).filter(Boolean).join(" ");
  const counties = getUserCounties(bandMembers);

  keywordCategories.universal.forEach((kw) => allKeywords.add(kw));

  Object.entries(keywordCategories.genre).forEach(([genreKey, genreKeywords]) => {
    if (genreString.includes(genreKey)) {
      genreKeywords.forEach((kw) => allKeywords.add(kw));
    }
  });

  if (bandMembers.some((m) => m.canDJ)) {
    keywordCategories.dj.forEach((kw) => allKeywords.add(kw));
  }

  Object.entries(keywordCategories.instrument).forEach(([instrument, kws]) => {
    if (instruments.includes(instrument)) {
      kws.forEach((kw) => allKeywords.add(kw));
    }
  });

  Object.entries(keywordCategories.region).forEach(([region, keywords]) => {
    const regionMatch = ukRegionMap[region]?.some((county) =>
      counties.some((userCounty) => userCounty.includes(county.toLowerCase()))
    );
    if (regionMatch) {
      keywords.forEach((kw) => allKeywords.add(kw));
    }
  });

  Object.entries(keywordCategories.cities).forEach(([city, kws]) => {
    if (counties.some((c) => city.toLowerCase().includes(c))) {
      kws.forEach((kw) => allKeywords.add(kw));
    }
  });

  if (genreString.includes("irish") || genres.includes("Irish")) {
    keywordCategories.irish.forEach((kw) => allKeywords.add(kw));
  }

  for (let kw of additionalKeywords) {
    if (/\{county\}/.test(kw)) {
      counties.forEach((c) => {
        const replaced = kw.replace("{county}", c);
        allKeywords.add(replaced);
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

  const finalKeywordString = [...new Set(cleaned)].slice(0, 6).join("-");

  return mp3s.map(({ file, title }) => {
    const ext = file.name.split(".").pop();
    const renamedName = `track-${lineupSize?.replace(/\s+/g, "-").toLowerCase()}-${finalKeywordString}-${uuidv4()}.${ext}`;
    const renamedFile = new File([file], renamedName, { type: file.type });
    return { file: renamedFile, title };
  });
};