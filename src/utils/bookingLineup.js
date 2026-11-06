export const BESPOKE_LINEUP_ID = "bespoke";
export const BOOKING_LINEUP_ROLE_OPTIONS = [
  "Lead Female Vocal", "Lead Male Vocal", "Lead Female Vocal / Rapper",
  "Lead Male Vocal / Rapper", "Lead Vocal / Guitar", "Lead Vocal / Keyboard",
  "Backing Vocals", "Electric Guitar", "Acoustic Guitar", "Bass Guitar",
  "Keyboard", "Drums", "Percussion", "Saxophone", "Trumpet", "Trombone",
  "Violin", "Cello", "DJ",
];
export const normaliseLineupSlots = (slots = []) => slots
  .map(slot => typeof slot === "string" ? { role: slot, excluded: false } : slot)
  .map(slot => ({ role: String(slot?.role || "").trim(), excluded: slot?.excluded === true }))
  .filter(slot => slot.role);
export const buildBespokeLineupPatch = (slots) => {
  const lineupSlots = normaliseLineupSlots(slots);
  const lineupComposition = lineupSlots.filter(slot => !slot.excluded).map(slot => slot.role);
  return {
    lineupId: BESPOKE_LINEUP_ID, lineupMode: "bespoke", lineupSlots,
    lineupComposition, bandSize: lineupComposition.length,
    lineupSelected: `Bespoke ${lineupComposition.length}-piece`,
  };
};
export const lineupSlotsFromRow = (row = {}) => {
  if (row.lineupSlots?.length) return normaliseLineupSlots(row.lineupSlots);
  const roles = row.lineupComposition?.length ? row.lineupComposition
    : (row.actsSummary?.[0]?.lineup?.bandMembers || row.actsSummary?.[0]?.bandMembers || [])
      .map(member => member.instrument || member.role || "")
      .filter(role => !/manager|management/i.test(role));
  return normaliseLineupSlots(roles);
};
