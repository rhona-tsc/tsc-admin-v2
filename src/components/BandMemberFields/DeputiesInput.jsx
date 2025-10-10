import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { postcodes as POSTCODE_DATA } from "../../assets/postcodes.js";
import { assets } from "../../assets/assets";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const DEBUG = true;
const dlog = (...a) => DEBUG && console.log("%c[DeputiesInput]", "color:#0ea5e9", ...a);

const DeputiesInput = ({
  member,
  index,
  memberIndex,
  updateBandMember,
  actRepertoire = [],
  actGenres = [],
  isVocalSlot: isVocalSlotProp,
}) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "";
  const apiBase = backendUrl ? backendUrl.replace(/\/$/, "") : "";
  const publicSiteBase = import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:5174";

  // ---------- Utilities ----------
  // postcode -> county lookups (built once)
  const postcodeCountyLookup = useMemo(() => {
    const out = new Map(); // "CM19" -> "Essex", "WD1" -> "Hertfordshire", etc.
    const bucket = POSTCODE_DATA?.[0] || {};
    Object.entries(bucket).forEach(([countyKey, prefixes]) => {
      const countyName =
        countyKey
          .split("_")
          .map((s) => s[0].toUpperCase() + s.slice(1))
          .join(" ") || countyKey;

      (prefixes || []).forEach((p) => {
        const k = String(p || "").toUpperCase().replace(/\s+/g, "");
        if (k) out.set(k, countyName);
      });
    });
    return out;
  }, []);

  // reverse index: prefix -> [counties]
  const prefixToCounties = useMemo(() => {
    const map = new Map();
    const bucket = POSTCODE_DATA?.[0] || {};
    Object.entries(bucket).forEach(([countyKey, prefixes]) => {
      const countyName = countyKey.split("_").map((s)=> s[0].toUpperCase()+s.slice(1)).join(" ");
      (prefixes||[]).forEach((p)=>{
        const k = String(p||"").toUpperCase().replace(/\s+/g, "");
        if(!k) return;
        const arr = map.get(k) || [];
        if(!arr.includes(countyName)) arr.push(countyName);
        map.set(k, arr);
      });
    });
    return map;
  }, []);

  // Given a postcode, return county + neighbouring counties inferred by shared outward prefixes
  const countyAndNeighboursFromPostcode = (pcRaw = "") => {
    const pc = String(pcRaw).toUpperCase().trim();
    if (!pc) return { county: "", neighbours: [], normDistrict: "" };
    const outward = pc.split(/\s+/)[0];
    const letters = outward.replace(/[^A-Z]/g, "");
    const digits = outward.replace(/[^0-9]/g, "");

    const candidates = [];
    if (outward) candidates.push(outward);
    if (letters && digits) {
      for (let i = digits.length; i >= 1; i--) candidates.push(`${letters}${digits.slice(0,i)}`);
    }
    if (letters) candidates.push(letters);

    let county = "";
    // first pass: pick first county match
    for (const cand of candidates) {
      if (postcodeCountyLookup.has(cand)) { county = postcodeCountyLookup.get(cand); break; }
      for (const [key, val] of postcodeCountyLookup.entries()) {
        if (outward.startsWith(key)) { county = val; break; }
      }
      if (county) break;
    }

    // neighbours: any other counties that also map to any candidate prefix
    const neighbourSet = new Set();
    for (const cand of candidates) {
      const hits = prefixToCounties.get(cand);
      if (Array.isArray(hits)) hits.forEach((c)=> neighbourSet.add(c));
      // also looser: any prefix that is a prefix of our outward
      for (const [pref, counties] of prefixToCounties.entries()) {
        if (outward.startsWith(pref)) counties.forEach((c)=> neighbourSet.add(c));
      }
    }
    if (county) neighbourSet.delete(county);

    return { county, neighbours: Array.from(neighbourSet), normDistrict: outward };
  };


  // Canonicalise song/artist strings
  const _canon = (s = "") =>
    String(s)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "") // accents
      .replace(/\b(feat\.?|ft\.?)\b.*$/g, "") // drop “feat …”
      .replace(/\(.*?\)|\[.*?\]/g, "") // bracketed qualifiers
      .replace(/[-–—:|]/g, " ")
      .replace(/\b(remaster(ed)?|live|mono|stereo|version|mix|edit|single|album)\b/g, "")
      .replace(/&/g, "and")
      .replace(/[^a-z0-9 ]+/g, "")
      .replace(/\s+/g, " ")
      .trim();

  // Tokenise a title for fuzzy compare
  const titleTokens = (title = "") => _canon(title).split(" ").filter(Boolean);

  // "Close enough" when one title is contained in the other or they differ by <=1 token
  const titlesLooseMatch = (a = "", b = "") => {
    const ta = titleTokens(a);
    const tb = titleTokens(b);
    if (!ta.length || !tb.length) return false;

    const sa = new Set(ta);
    const sb = new Set(tb);

    // subset check (e.g., "(Simply) The Best" vs "The Best")
    const aInB = ta.every((t) => sb.has(t));
    const bInA = tb.every((t) => sa.has(t));
    if (aInB || bInA) return true;

    // allow 1-token difference total
    const unionSize = new Set([...ta, ...tb]).size;
    const interSize = ta.filter((t) => sb.has(t)).length;
    const diff = unionSize - interSize;
    return diff <= 1;
  };

  // Build a fast set of canonical act titles for fuzzy matching (title-only)
  const fuzzySongTitles = useMemo(() => {
    const titles = (Array.isArray(actRepertoire) ? actRepertoire : [])
      .map((s) => _canon(s?.title || ""))
      .filter(Boolean);
    return Array.from(new Set(titles));
  }, [actRepertoire]);

  // Local preview overlap using the fuzzy title logic
  const fuzzyOverlapPreview = useMemo(() => {
    const source = (Array.isArray(actRepertoire) ? actRepertoire : []).map((s) => s?.title || "");
    const canon = source.map(_canon);
    return { rawTitles: source, canonTitles: canon };
  }, [actRepertoire]);

  // ---------- Derived inputs ----------
  const instrument = (member?.instrument || "").trim();

  // Heuristic vocal detection if not provided (now includes mc/rap)
  const inferredVocalSlot = useMemo(() => {
    const v = instrument.toLowerCase();
    return /(vocal|singer|lead|backing|mc|rapper)/i.test(v);
  }, [instrument]);

  // 1) infer desired roles from the slot text (soft boost)
  const desiredRolesFromInstrument = useMemo(() => {
    const v = (member?.instrument || "").toLowerCase();
    const roles = [];
    if (/backing/.test(v)) roles.push("Backing Vocalist");
    if (/rap|mc/.test(v)) roles.push("Rap");
    return roles;
  }, [member?.instrument]);

  // 2) infer secondary instruments when the slot label includes them
  const secondaryInstruments = useMemo(() => {
    const v = (member?.instrument || "").toLowerCase();
    const out = [];
    if (/guitar/.test(v)) out.push("Guitar");
    if (/\bbass\b|bassist/.test(v)) out.push("Bass");
    if (/keys|keyboard|piano/.test(v)) out.push("Keyboard");
    if (/drum|cajon|percussion/.test(v)) out.push("Drums");
    if (/sax/.test(v)) out.push("Saxophone");
    if (/trumpet/.test(v)) out.push("Trumpet");
    if (/trombone/.test(v)) out.push("Trombone");
    return out;
  }, [member?.instrument]);

  const isVocalSlot = typeof isVocalSlotProp === "boolean" ? isVocalSlotProp : inferredVocalSlot;

  // Essential roles (just the ones marked isEssential)
  const essentialRoles = useMemo(() => {
    const roles = Array.isArray(member?.additionalRoles)
      ? member.additionalRoles
          .filter((r) => r?.role)
          .map((r) => ({
            role: String(r.role),
            isEssential: Boolean(r.isEssential),
          }))
      : [];
    const essentials = roles.filter((r) => r.isEssential).map((r) => r.role);
    dlog("essentialRoles:", essentials);
    return essentials;
  }, [member?.additionalRoles]);

  // Exclude already-added deputy IDs
  const excludeIds = useMemo(
    () => (member?.deputies || []).map((d) => d.id || d._id).filter(Boolean),
    [member?.deputies]
  );

  // Build a stable hash/key for the repertoire (ignore casing/whitespace)
  const actRepKey = useMemo(() => {
    try {
      const norm = (actRepertoire || []).map((s) => ({
        t: (s?.title || "").trim().toLowerCase(),
        // artist intentionally ignored for fuzzy path
      }));
      const key = JSON.stringify(norm);
      dlog("actRepKey built; count:", norm.length);
      return key;
    } catch (e) {
      dlog("actRepKey error:", e);
      return "[]";
    }
  }, [actRepertoire]);

  // Member location (derive county via postcode)
  const memberPost = (member?.postCode || member?.postcode || member?.post_code || "").trim();
  const { county: memberCounty, neighbours: memberNeighbourCounties, normDistrict: memberDistrict } = useMemo(
    () => countyAndNeighboursFromPostcode(memberPost),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [memberPost, postcodeCountyLookup]
  );

  // Create a stable query key for useEffect
  const queryKey = useMemo(
    () =>
      JSON.stringify({
        apiBase,
        instrument: instrument.toLowerCase(),
        roles: essentialRoles.slice().sort(),
        excludeIds: excludeIds.slice().sort(),
        isVocalSlot: !!isVocalSlot,
        actRepKey,
        memberCounty,
        memberDistrict,
      }),
    [apiBase, instrument, essentialRoles, excludeIds, isVocalSlot, actRepKey, memberCounty, memberDistrict]
  );

  // ---------- Local state ----------
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastPayload, setLastPayload] = useState(null);
  const [lastEndpointUsed, setLastEndpointUsed] = useState("");

  // Debounce timer + last key to avoid duplicate fetches
  const debounceRef = useRef(null);
  const lastKeyRef = useRef("");

  // ---------- Effects ----------
  useEffect(() => {
    const hasFilters = instrument || essentialRoles.length;
    dlog("effect fired. hasFilters?", hasFilters, {
      instrument,
      essentialRoles,
      excludeIds,
      isVocalSlot,
      actRepertoireCount: Array.isArray(actRepertoire) ? actRepertoire.length : 0,
    });

    if (!hasFilters) {
      dlog("Skip fetch: No instrument or essentialRoles.");
      setSuggestions([]);
      return;
    }

    if (lastKeyRef.current === queryKey) {
      dlog("Skip fetch: queryKey unchanged.");
      return;
    }
    lastKeyRef.current = queryKey;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    let cancelled = false;
    const controller = new AbortController();

   debounceRef.current = setTimeout(async () => {
  try {
    setLoading(true);

    // Choose origin postcode: prefer member, else optional actPostcode prop
    const originPostcode = (memberPost && memberPost.trim()) || "";
    const originLoc = countyAndNeighboursFromPostcode(originPostcode);

    // Build payload
    const payload = {
      instrument,
      isVocalSlot,
      essentialRoles, // hard must-haves
      desiredRoles: [
        ...(Array.isArray(member?.additionalRoles)
          ? member.additionalRoles.map((r) => r?.role).filter(Boolean)
          : []),
        ...desiredRolesFromInstrument,
      ],
      secondaryInstruments, // enforces Vocalist-Guitarist etc
      excludeIds,
      actRepertoire, // still sending full repertoire
      actGenres,
      originLocation: {
        county: originLoc.county || memberCounty,
        postcode: originPostcode,
        district: originLoc.normDistrict || memberDistrict,
        neighbouringCounties: originLoc.neighbours || memberNeighbourCounties || [],
      },
      // NEW: fuzzy song support – title-only canonical list
      fuzzySongTitles, // e.g., ["the best", "valerie", ...]
      fuzzySongMode: "title-only-loose-1token",
      debug: true,
    };

    dlog("Act origin county/postcode:", {
      memberCounty: originLoc.county || memberCounty,
      memberPost: originPostcode,
      memberDistrict: originLoc.normDistrict || memberDistrict,
      neighbourCounties: originLoc.neighbours,
    });
    dlog("Act genres:", actGenres);
    dlog("Member additional roles:", Array.isArray(member?.additionalRoles) ? member.additionalRoles : []);
    dlog("🎶 Fuzzy titles preview:", fuzzyOverlapPreview.canonTitles.slice(0, 10));

    setLastPayload(payload);

    // Primary endpoint (singular)
    const primaryUrl = `${apiBase}/api/musician/suggest`;
    // Fallback endpoint (plural) if 404
    const fallbackUrl = `${apiBase}/api/musicians/suggest`;

    dlog("POST (primary):", primaryUrl, payload);
    setLastEndpointUsed(primaryUrl);

    let res;
    try {
      res = await axios.post(primaryUrl, payload, { signal: controller.signal });
    } catch (e) {
      const status = e?.response?.status;
      if (status === 404) {
        dlog("Primary 404 — trying fallback:", fallbackUrl);
        setLastEndpointUsed(fallbackUrl);
        res = await axios.post(fallbackUrl, payload, { signal: controller.signal });
      } else {
        throw e;
      }
    }

    if (cancelled) return;

    const list = Array.isArray(res?.data?.musicians) ? res.data.musicians : [];
    dlog(`Suggestions (${list.length})`);
    setSuggestions(list);

    // --- Keep this optional debug non-fatal ---
    try {
      if (list[0]) {
        const first = list[0];
        const depPost =
          first?.address?.postcode || first?.address?.postCode || first?.postcode || "";
        const depLoc = countyAndNeighboursFromPostcode(depPost);
        const depCounty = depLoc.county;
        const depDistrict = depLoc.normDistrict;
        const isSameCounty = !!(depCounty && (depCounty === (originLoc.county || memberCounty)));
        const isNeighbour = !!(depCounty && (originLoc.neighbours || []).includes(depCounty));

        const depOtherSkills = Array.isArray(first?.other_skills) ? first.other_skills : [];
        dlog("Deputy county/postcode:", { depCounty, depPost, depDistrict, isSameCounty, isNeighbour });
        console.log("[DeputiesInput] Deputy other skills:", depOtherSkills);

        const depVocalGenres = (() => {
          const fromVocals =
            Array.isArray(first?.vocals?.genres)
              ? first.vocals.genres
              : typeof first?.vocals?.genres === "string"
                ? first.vocals.genres.split(",").map((s) => s.trim())
                : [];
          const fromTop =
            Array.isArray(first?.genres)
              ? first.genres
              : typeof first?.genres === "string"
                ? first.genres.split(",").map((s) => s.trim())
                : [];
          return (fromVocals.length ? fromVocals : fromTop).filter(Boolean);
        })();

        dlog("Genres (ACT vs DEPUTY vocals)", { actGenres, deputyVocalGenres: depVocalGenres });

        if (first?._debug) {
          console.log("🔎 match debug (first):", first._debug, first);
        }

        const sampleDeputyTitles = (first?.repertoire || [])
          .map((s) => s?.title || "")
          .slice(0, 50);
        const matched = [];
        for (const a of (actRepertoire || []).map((s) => s?.title || "")) {
          for (const b of sampleDeputyTitles) {
            if (titlesLooseMatch(a, b)) {
              matched.push({ act: a, deputy: b });
              break;
            }
          }
        }
        dlog("Sample matched songs (fuzzy title-only):", matched.slice(0, 15));
      }
    } catch (e) {
      dlog("⚠️ Post-fetch debug failed (non-fatal):", e);
    }
  } catch (err) {
    if (cancelled) return;
    if (axios.isCancel?.(err)) return;
    dlog("❌ Suggest fetch failed:", err?.response?.data || err);
    setSuggestions([]);
  } finally {
    if (!cancelled) setLoading(false);
  }
}, 350);

return () => {
  cancelled = true;
  controller.abort();
  if (debounceRef.current) clearTimeout(debounceRef.current);
};
}, [
    queryKey,
    apiBase,
    instrument,
    essentialRoles,
    excludeIds,
    isVocalSlot,
    actRepertoire,
    actGenres,
    memberCounty,
    memberDistrict,
    memberPost,
    fuzzySongTitles,
    fuzzyOverlapPreview,
  ]);

  // ---------- Handlers ----------
  const addDeputy = (m) => {
    dlog("➕ addDeputy:", m?._id, m?.firstName, m?.lastName);
    const updated = [
      ...(member.deputies || []),
      {
        id: m._id,
        firstName: m.firstName || "",
        lastName: m.lastName || "",
        email: m.email || "",
        phoneNumber: m.phone || "",
        image:
          m.profilePicture ||
          (Array.isArray(m.additionalImages) ? m.additionalImages[0] : "") ||
          "",
      },
    ];
    updateBandMember(index, memberIndex, "deputies", updated);
  };

  const handleDeputyChange = (deputyIndex, field, value) => {
    dlog("✏️ handleDeputyChange:", { deputyIndex, field, value });
    const updated = [...(member.deputies || [])];
    updated[deputyIndex] = { ...updated[deputyIndex], [field]: value };
    updateBandMember(index, memberIndex, "deputies", updated);
  };

  const removeDeputy = (deputyIndex) => {
    dlog("🗑️ removeDeputy:", deputyIndex);
    const updated = (member.deputies || []).filter((_, i) => i !== deputyIndex);
    updateBandMember(index, memberIndex, "deputies", updated);
  };

  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    dlog("🔁 dragEnd:", { from: result.source.index, to: result.destination.index });
    const reordered = reorder(
      member.deputies || [],
      result.source.index,
      result.destination.index
    );
    updateBandMember(index, memberIndex, "deputies", reordered);
  };

  const initials = (m) =>
    `${(m.firstName || "").trim()[0] || ""}${(m.lastName || "").trim()[0] || ""}`.toUpperCase();

  // ---------- UI ----------
  return (
    <div className="w-full mt-4">
      <p className="font-semibold mb-2">Suitable Deputies for this Role</p>

      <div className="flex gap-4 mb-4 overflow-x-auto">
        {loading ? (
          <div className="text-sm text-gray-500">Loading suggestions…</div>
        ) : suggestions.length ? (
          suggestions.map((m) => (
            <div key={m._id} className="text-center min-w-[84px]">
              {m.profilePicture ||
              (Array.isArray(m.additionalImages) && m.additionalImages[0]) ? (
                <img
                  src={m.profilePicture || m.additionalImages[0]}
                  alt={`${m.firstName || ""} ${m.lastName || ""}`}
                  className="w-16 h-16 rounded-full object-cover border"
                  onClick={() => addDeputy(m)}
                  style={{ cursor: "pointer" }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => addDeputy(m)}
                  className="w-16 h-16 rounded-full border bg-gray-100 text-gray-600 text-sm flex items-center justify-center"
                >
                  {initials(m) || "Add"}
                </button>
              )}

              <p className="text-xs font-semibold mt-1 line-clamp-1">
                {m.firstName} {(m.lastName || "").charAt(0)}
              </p>
              <a
                href={`${publicSiteBase}/musician/${m._id}`}
                className="text-[10px] text-blue-600 underline block mt-1"
                target="_blank"
                rel="noreferrer"
              >
                view profile
              </a>
              {"matchPct" in m ? (
                <p
                  className="text-xs mt-0.5 text-gray-600"
                  title="Based on repertoire overlap (fuzzy titles), instrument/vocal fit, essential roles, and location."
                >
                  {m.matchPct}% match
                </p>
              ) : null}
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-500">No suggestions yet.</div>
        )}
      </div>

      {/* existing table + DnD */}
      <div className="grid grid-cols-8 gap-4 mb-2 font-semibold text-sm text-gray-700">
        <div className="col-span-2">First Name</div>
        <div className="col-span-2">Last Name</div>
        <div className="col-span-2">Email</div>
        <div className="col-span-2">Mobile</div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="deputy-list" direction="vertical">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex flex-col gap-2"
            >
              {(member.deputies || []).map((deputy, deputyIndex) => (
                <Draggable
                  key={deputy.id || `deputy-${deputyIndex}`}
                  draggableId={deputy.id || `deputy-${deputyIndex}`}
                  index={deputyIndex}
                >
                  {(drag) => (
                    <div
                      className="grid grid-cols-8 gap-4 items-end bg-white p-2 rounded shadow-sm"
                      ref={drag.innerRef}
                      {...drag.draggableProps}
                      {...drag.dragHandleProps}
                    >
                      {/* First Name */}
                      <div className="col-span-2 flex items-center gap-2">
                        <img
                          src={assets.reordering_icon}
                          alt="drag"
                          className="w-4 h-4 cursor-grab"
                        />
                        {!deputy.id ? (
                          <input
                            type="text"
                            placeholder="Provide your own deputy"
                            value={deputy.firstName || ""}
                            onChange={(e) =>
                              handleDeputyChange(
                                deputyIndex,
                                "firstName",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border"
                          />
                        ) : (
                          <input
                            type="text"
                            value={deputy.firstName || ""}
                            readOnly
                            className="w-full px-3 py-2 border text-gray-600 bg-gray-100"
                          />
                        )}
                      </div>

                      {/* Last Name */}
                      <div className="col-span-2">
                        {!deputy.id ? (
                          <input
                            type="text"
                            value={deputy.lastName || ""}
                            onChange={(e) =>
                              handleDeputyChange(
                                deputyIndex,
                                "lastName",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border"
                          />
                        ) : (
                          <input
                            type="text"
                            value={(deputy.lastName || "").charAt(0)}
                            readOnly
                            className="w-full px-3 py-2 border text-gray-600 bg-gray-100"
                          />
                        )}
                      </div>

                      {/* Email */}
                      <div className="col-span-2">
                        {!deputy.id ? (
                          <input
                            type="email"
                            value={deputy.email || ""}
                            onChange={(e) =>
                              handleDeputyChange(
                                deputyIndex,
                                "email",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border text-gray-600"
                          />
                        ) : (
                          <input
                            type="email"
                            value="--email on file--"
                            disabled
                            className="w-full px-3 py-2 border text-gray-600 bg-gray-100"
                          />
                        )}
                      </div>

                      {/* Phone Number */}
                      <div className="col-span-2">
                        <div className="flex gap-2">
                          {!deputy.id ? (
                            <input
                              type="tel"
                              value={deputy.phoneNumber || ""}
                              onChange={(e) =>
                                handleDeputyChange(
                                  deputyIndex,
                                  "phoneNumber",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border text-gray-600"
                            />
                          ) : (
                            <input
                              type="tel"
                              value="--phone on file--"
                              disabled
                              className="w-full px-3 py-2 border text-gray-600 bg-gray-100"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => removeDeputy(deputyIndex)}
                            className="w-8 h-8 flex justify-center items-center mt-1"
                            title="Remove Deputy"
                          >
                            <img
                              src={assets.cross_icon}
                              alt="Remove"
                              className="w-5 h-5"
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {(!member.deputies || member.deputies.length < 10) && (
        <button
          type="button"
          className="mt-2 px-4 py-2 bg-[#ff6667] text-white rounded shadow hover:bg-black transition"
          onClick={() =>
            addDeputy({
              _id: undefined,
              firstName: "",
              lastName: "",
              email: "",
              phone: "",
            })
          }
        >
          ➕ Add Deputy
        </button>
      )}
    </div>
  );
};

export default DeputiesInput;