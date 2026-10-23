const normalizeCounty = (value = "") =>
  String(value || "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");

const entriesOf = (value) =>
  value && typeof value === "object" ? Object.entries(value) : [];

export const memberCountyTravelFee = (member, county, fallback = 0) => {
  const wanted = normalizeCounty(county);
  const match = entriesOf(member?.countyTravelFees).find(
    ([key]) => normalizeCounty(key) === wanted,
  );
  const fee = match ? Number(match[1]) : Number(fallback);
  return Number.isFinite(fee) ? fee : 0;
};
