import React, { useState, useEffect } from 'react';

const performanceModes = ["Unplugged", "With PA", "With PA & Backing Tracks"];

const CeremonySets = ({
  lineups = [],
  setLineups
}) => {
  useEffect(() => {
    console.log("Received lineups in CeremonySets:", lineups);
    lineups.forEach((lineup, idx) => {
      console.log(`🎯 Lineup ${idx}:`, lineup);
    });
  }, [lineups]);

  // Sync checkbox state from lineups.ceremonySets
  useEffect(() => {
    // For debugging: log each lineup and its ceremonySets
    lineups.forEach((lineup, idx) => {
      console.log(`🪄 CeremonySets useEffect lineup[${idx}]:`, lineup);
      const cs = lineup.ceremonySets;
      if (cs instanceof Map) {
        // Log Map keys and their values
        for (const [key, value] of cs.entries()) {
          console.log(`   Map ceremonySets key:`, key, "value:", value);
        }
      } else if (cs && typeof cs === "object") {
        // Log object keys and their values
        Object.entries(cs).forEach(([key, value]) => {
          console.log(`   Object ceremonySets key:`, key, "value:", value);
        });
      } else {
        console.log("   ceremonySets is not set or not an object/Map:", cs);
      }
    });
  }, [lineups]);
  // Utility to transform raw checkbox data into the required ceremonySets structure
  const formatSetData = (rawData) => {
    const formatted = {};

    

    Object.entries(rawData).forEach(([size, instruments]) => {
      formatted[size] = {
        unplugged: [],
        amplified: [],
        'amplified with backing tracks': [],
      };

      Object.entries(instruments).forEach(([instrument, types]) => {
        if (types.Unplugged) {
          formatted[size].unplugged.push(instrument);
        }
        if (types['With PA']) {
          formatted[size].amplified.push(instrument);
        }
        if (types['With PA & Backing Tracks']) {
          formatted[size]['amplified with backing tracks'].push(instrument);
        }
      });
    });

    return formatted;
  };
  const getDisplayName = (instr) => {
    if (instr.toLowerCase() === "electric guitar") return "Acoustic Guitar";
    if (instr.toLowerCase() === "bass guitar") return "Acoustic Bass Guitar";
    return instr;
  };

  // Custom instrument sort order
  const priorityOrder = [
    "Lead Vocal", "Lead Female Vocal", "Lead Male Vocal",
    "Lead Male Vocal/Rapper", "Lead Female Vocal/Rapper", "Vocalist-Guitarist"
  ];

  // Sort instruments by custom logic
  const sortInstruments = (instruments) => {
    return [...instruments].sort((a, b) => {
      const aIdx = priorityOrder.indexOf(a);
      const bIdx = priorityOrder.indexOf(b);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      // Place drums and percussion last
      if (a === "Drums" || a === "Percussion") return 1;
      if (b === "Drums" || b === "Percussion") return -1;
      return a.localeCompare(b);
    });
  };

  // Get instruments from lineup (no renaming)
  const getInstrumentsFromLineup = (lineup) => {
    return lineup.bandMembers?.map(m => m.instrument).filter(Boolean) || [];
  };

  const addExtraInstrumentsIfNeeded = (originalInstruments) => {
    const lowerInstruments = originalInstruments.map(i => i.toLowerCase());
    const additions = [];

    if (lowerInstruments.includes("bass guitar")) {
      additions.push("Double Bass");
    }
    if (lowerInstruments.includes("drums")) {
      additions.push("Percussion");
    }

    return [...new Set([...originalInstruments, ...additions])];
  };

// Modified: Directly update the ceremonySets source of truth for the target lineup/size/type/instrument.
// Modified: Directly update the ceremonySets source of truth for the target lineup/size/type/instrument.
const handleCheckboxChange = (lineupIndex, size, type, instrument, e) => {
  const checked = e?.target?.checked ?? false;
  const newLineups = [...lineups];

  // size order for forward propagation
  const sizeOrder = ["solo", "duo", "trio", "fourPiece"];
  const startSizeIdx = Math.max(0, sizeOrder.indexOf(size));

  // Display ↔ original instrument mapping for presence checks
  const toNormalized = (name) => {
    if (name === "Acoustic Guitar") return "Electric Guitar";
    if (name === "Acoustic Bass Guitar" || name === "Double Bass") return "Bass Guitar";
    if (name === "Percussion") return "Drums";
    return name;
  };

  // Ensure we always work with a Map for ceremonySets
  const ensureCeremonySetsMap = (ln) => {
    if (ln.ceremonySets instanceof Map) return new Map(ln.ceremonySets);
    if (ln.ceremonySets && typeof ln.ceremonySets === "object") {
      return new Map(Object.entries(ln.ceremonySets));
    }
    return new Map();
  };

  // Mutates (via copy) the given lineup’s ceremonySets for one cell
  const setTick = (ln, sizeKey, typeKey, displayInstr, val) => {
    const normalizedInstr = toNormalized(displayInstr);
    const instrumentsInLineup = getInstrumentsFromLineup(ln);
    if (!instrumentsInLineup.includes(normalizedInstr)) return ln;

    let cs = ensureCeremonySetsMap(ln);
    if (!cs.has(sizeKey)) {
      cs.set(sizeKey, { unplugged: [], amplified: [], "amplified with backing tracks": [] });
    }

    const sizeObj = { ...cs.get(sizeKey) };
    const arr = Array.isArray(sizeObj[typeKey]) ? [...sizeObj[typeKey]] : [];
    const i = arr.indexOf(displayInstr);

    if (val && i === -1) arr.push(displayInstr);
    if (!val && i !== -1) arr.splice(i, 1);

    sizeObj[typeKey] = arr;
    cs.set(sizeKey, sizeObj);
    return { ...ln, ceremonySets: cs };
  };

  // 1) Always update the clicked cell first
  let curr = { ...newLineups[lineupIndex] };
  curr = setTick(curr, size, type, instrument, checked);
  newLineups[lineupIndex] = curr;

  // 2) Forward propagation (only when checking)
  if (checked) {
    const isLeadVocal = [
      "Lead Vocal",
      "Lead Female Vocal",
      "Lead Male Vocal",
      "Lead Male Vocal/Rapper",
      "Lead Female Vocal/Rapper",
      "Vocalist-Guitarist",
    ].includes(instrument);

    // Rule A: Lead Vocal + Unplugged → this lineup (sizes ≥ current) + all later lineups (sizes ≥ current)
    if (isLeadVocal && type === "unplugged") {
      for (let si = startSizeIdx; si < sizeOrder.length; si++) {
        curr = setTick(curr, sizeOrder[si], type, instrument, true);
      }
      newLineups[lineupIndex] = curr;

      for (let li = lineupIndex + 1; li < newLineups.length; li++) {
        let ln = { ...newLineups[li] };
        for (let si = startSizeIdx; si < sizeOrder.length; si++) {
          ln = setTick(ln, sizeOrder[si], type, instrument, true);
        }
        newLineups[li] = ln;
      }
    }

    // Rule B: Acoustic Guitar + Amplified + Trio
    if (instrument === "Acoustic Guitar" && type === "amplified" && size === "trio") {
      curr = setTick(curr, "fourPiece", type, instrument, true);
      newLineups[lineupIndex] = curr;

      for (let li = lineupIndex + 1; li < newLineups.length; li++) {
        let ln = { ...newLineups[li] };
        ln = setTick(ln, "trio", type, instrument, true);
        ln = setTick(ln, "fourPiece", type, instrument, true);
        newLineups[li] = ln;
      }
    }

    // Generic: also tick same mode for later sizes in THIS lineup
    for (let si = startSizeIdx + 1; si < sizeOrder.length; si++) {
      curr = setTick(curr, sizeOrder[si], type, instrument, true);
    }
    newLineups[lineupIndex] = curr;

    // Generic: forward across SUBSEQUENT lineups for same & later sizes
    for (let li = lineupIndex + 1; li < newLineups.length; li++) {
      let ln = { ...newLineups[li] };
      for (let si = startSizeIdx; si < sizeOrder.length; si++) {
        ln = setTick(ln, sizeOrder[si], type, instrument, true);
      }
      newLineups[li] = ln;
    }
  }

  setLineups(newLineups);

  // (optional) debug
  console.log(
    "ceremonySets updated",
    newLineups.map((l, i) => ({ i, ceremonySets: l.ceremonySets }))
  );
  if (typeof window !== "undefined" && window.markChanged) window.markChanged();
};

  // Map for display and type
  const sizes = [
    { key: "solo", label: "Solo" },
    { key: "duo", label: "Duo" },
    { key: "trio", label: "Trio" },
    { key: "fourPiece", label: "4-Piece" },
  ];

  // Collapsible state for each lineup
  const [openLineups, setOpenLineups] = useState({});

  const toggleLineup = (idx) => {
    setOpenLineups(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="mb-1">
        <h2 className="text-lg font-semibold mb-1">Ceremony and Afternoon Performances</h2>
        <p className="text-sm text-gray-700">
          Toggle each lineup down to select which instruments in your lineups offer solo, duo, trio, and 4-piece acoustic performances unplugged, with PA, and with backing tracks.
        </p>
      </div>
      {lineups.map((lineup, idx) => {
        // Debug: log lineup and its ceremonySets
        console.log(`🎯 Lineup ${idx}:`, lineup);
        console.log(`   ceremonySets:`, lineup.ceremonySets);
        // Get actual instrument field directly
        const rawInstrumentsRaw = getInstrumentsFromLineup(lineup);
        // Reverse renaming step
        const rawInstruments = rawInstrumentsRaw.map(i =>
          i === "Acoustic Bass Guitar" ? "Bass Guitar" :
          i === "Acoustic Guitar" ? "Electric Guitar" :
          i
        );
        const extendedInstruments = addExtraInstrumentsIfNeeded(rawInstruments);
        // Sort extended instruments for table
        const sortedExtendedInstruments = sortInstruments(extendedInstruments);
        const renamed = sortedExtendedInstruments.map(getDisplayName);
        // Sort instruments for header display as well
        const sortedHeaderInstruments = sortInstruments(rawInstruments);
        const displayHeaderInstruments = sortedHeaderInstruments.join(", ");

        return (
          <div key={idx} className="border border-gray-300 rounded mb-3">
            <button
              type="button"
              onClick={() => toggleLineup(idx)}
              className="w-full text-left px-4 py-3 font-semibold border-b border-gray-300 flex justify-between items-center"
            >
              <span>{lineup.actSize || `Lineup ${idx + 1}`} – ({displayHeaderInstruments})</span>
              <span>{openLineups[idx] ? "▲" : "▼"}</span>
            </button>
            {openLineups[idx] && (
              <div className="p-4 bg-gray-50">
                {sizes.map(({ key, label }) => (
                  <div key={key} className="mb-1">
                    <p className="font-medium mb-2 uppercase">{label} Ceremony or Afternoon Additional Performances</p>
                    <table className="table-auto w-full text-sm border border-collapse mb-4">
                      <thead>
                        <tr>
                          <th className="border px-2 py-1 text-left">Instrument</th>
                          {performanceModes.map(mode => (
                            <th key={mode} className="border px-2 py-1">{mode}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {renamed.map(instr => (
                          <tr key={instr}>
                            <td className="border px-2 py-1">{instr}</td>
                            {performanceModes.map(mode => {
                              // Map UI mode to ceremonySets keys
                              let ceremonyKey = '';
                              if (mode === "Unplugged") ceremonyKey = 'unplugged';
                              else if (mode === "With PA") ceremonyKey = 'amplified';
                              else if (mode === "With PA & Backing Tracks") ceremonyKey = 'amplified with backing tracks';
                              else ceremonyKey = mode;
                              // ceremonySets may be a Map or a plain object depending on state management
                              let ceremonySetsData = lineup.ceremonySets;
                              let hasKey = false;
                              let ceremonyForKey = null;
                              if (ceremonySetsData instanceof Map) {
                                hasKey = ceremonySetsData.has(key);
                                ceremonyForKey = hasKey ? ceremonySetsData.get(key) : null;
                              } else if (ceremonySetsData && typeof ceremonySetsData === "object") {
                                hasKey = Object.prototype.hasOwnProperty.call(ceremonySetsData, key);
                                ceremonyForKey = hasKey ? ceremonySetsData[key] : null;
                              }
                              const checked = ceremonyForKey && ceremonyForKey[ceremonyKey] && ceremonyForKey[ceremonyKey].includes(instr);
                              return (
                                <td key={mode} className="border px-2 py-1 text-center">
                              <input
                                type="checkbox"
                                checked={checked || false}
                                onChange={e => {
                                  console.log("✅ Checkbox toggled:", e.target.checked);
                                  handleCheckboxChange(
                                    idx,
                                    key,
                                    ceremonyKey,
                                    instr,
                                    e
                                  );
                                }}
                              />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CeremonySets;