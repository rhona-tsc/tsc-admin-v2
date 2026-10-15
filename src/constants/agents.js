export const AGENT_OPTIONS = [
  "Alive Network", "Direct", "Encore", "Entertainment Nation", "Freak Music",
  "Fully Funktional", "Function Central", "LMM", "Poptop", "Scarlettte",
  "Silk Street", "Soul Eras", "St Barts", "Staar Productions", "Stormont",
  "The Supreme Collective", "UKBride", "UKBride Lead", "Warble", "Wedding Fair",
  "Wedding Jam",
];

const AGENT_ALIASES = new Map([
  ["encore", "Encore"],
  ["entertainment nation", "Entertainment Nation"],
  ["potop", "Poptop"],
  ["poptop", "Poptop"],
  ["tsc direct", "The Supreme Collective"],
  ["tsc", "The Supreme Collective"],
  ["the supreme collective", "The Supreme Collective"],
  ["weddingjam", "Wedding Jam"],
]);

export const normalizeAgent = (value = "") => {
  const cleaned = String(value || "").trim().replace(/\s+/g, " ");
  if (!cleaned) return "Direct";
  return AGENT_ALIASES.get(cleaned.toLowerCase())
    || AGENT_OPTIONS.find((option) => option.toLowerCase() === cleaned.toLowerCase())
    || cleaned;
};
