import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { postcodes as POSTCODE_DATA } from "../../assets/postcodes.js";
import { assets } from "../../assets/assets";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// -------------------------------
// 1-at-a-time suggestion queue
// - prioritise in-view sections
// - after first completes, prefetch sequentially
// -------------------------------
const DeputySuggestQueue = (() => {
  const cache = new Map(); // key -> { ts, list }
  const tasks = new Map(); // key -> task
  let activeKey = null;
  let prefetchAfterFirst = false;

  const TTL_MS = 10 * 60 * 1000;
  const now = () => Date.now();

  const getCached = (key) => {
    const hit = cache.get(key);
    if (!hit) return null;
    if (now() - hit.ts > TTL_MS) {
      cache.delete(key);
      return null;
    }
    return hit.list;
  };

  const setCached = (key, list) => cache.set(key, { ts: now(), list });

  const pickNextKey = () => {
    const idle = Array.from(tasks.values()).filter((t) => t.status === "idle");

    // Phase 1: only load something that is in view
    const inView = idle
      .filter((t) => t.inView)
      .sort((a, b) => a.order - b.order);

    if (inView[0]) return inView[0].key;

    // Phase 2: once we’ve loaded at least one visible section,
    // sequentially prefetch the rest (still only 1 at a time)
    if (!prefetchAfterFirst) return null;

    const nextByOrder = idle.sort((a, b) => a.order - b.order);
    return nextByOrder[0]?.key || null;
  };

  const pump = async () => {
    if (activeKey) return;

    const nextKey = pickNextKey();
    if (!nextKey) return;

    const t = tasks.get(nextKey);
    if (!t || t.status !== "idle") return;

    activeKey = nextKey;
    t.status = "loading";
    t.error = null;

    const controller = new AbortController();
    t.controller = controller;

    try {
      const list = await t.run({ signal: controller.signal });

      setCached(nextKey, Array.isArray(list) ? list : []);
      t.status = "done";
      t.controller = null;

      // resolve waiters
      const waiters = t.waiters.slice();
      t.waiters.length = 0;
      waiters.forEach((w) => w.resolve(getCached(nextKey) || []));

      // once we’ve successfully loaded at least one in-view section,
      // allow sequential prefetching
      prefetchAfterFirst = true;
    } catch (err) {
      const aborted =
        err?.name === "AbortError" ||
        err?.code === "ERR_CANCELED" ||
        err?.message === "canceled";

      if (aborted) {
        t.status = "idle";
      } else {
        t.status = "error";
        t.error = err;
      }

      t.controller = null;

      const waiters = t.waiters.slice();
      t.waiters.length = 0;
      waiters.forEach((w) => w.reject(err));
    } finally {
      activeKey = null;
      // keep the chain going
      Promise.resolve().then(pump);
    }
  };

  const ensureTask = (key, { order, run }) => {
    if (!tasks.has(key)) {
      tasks.set(key, {
        key,
        order: typeof order === "number" ? order : 0,
        run,
        inView: false,
        status: "idle",
        controller: null,
        waiters: [],
        error: null,
      });
      return;
    }

    const t = tasks.get(key);
    if (typeof order === "number") t.order = order;
    if (run) t.run = run;
  };

  return {
    getCached,

    register(key, opts) {
      if (!key) return;
      ensureTask(key, opts);
      pump();
    },

    unregister(key) {
      const t = tasks.get(key);
      if (!t) return;

      if (activeKey === key && t.controller) {
        try {
          t.controller.abort();
        } catch {}
      }

      tasks.delete(key);
      pump();
    },

    setInView(key, inView) {
      const t = tasks.get(key);
      if (!t) return;
      t.inView = !!inView;
      pump();
    },

    request(key) {
      if (!key) return Promise.resolve([]);

      const cached = getCached(key);
      if (cached) return Promise.resolve(cached);

      const t = tasks.get(key);
      if (!t) return Promise.reject(new Error("Suggest task not registered"));

      if (t.status === "done") return Promise.resolve(getCached(key) || []);
      if (t.status === "loading") {
        return new Promise((resolve, reject) => t.waiters.push({ resolve, reject }));
      }
      if (t.status === "error") {
        // allow retry
        t.status = "idle";
      }

      const p = new Promise((resolve, reject) => t.waiters.push({ resolve, reject }));
      pump();
      return p;
    },
  };
})();

// -------------------------------
// IntersectionObserver hook
// -------------------------------
const useInView = (ref, opts = {}) => {
  const { root = null, rootMargin = "300px 0px", threshold = 0 } = opts;
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => setInView(!!entry.isIntersecting),
      { root, rootMargin, threshold }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, root, rootMargin, threshold]);

  return inView;
};

const DEBUG = true;
const dlog = (...a) => DEBUG && console.log("%c[DeputiesInput]", "color:#0ea5e9", ...a);

const getDeputyId = (d) =>
  String(d?.id || d?._id || d?.musicianId || d?.musician_id || "").trim();

// Suggested = has a DB id AND is not a manual (clientKey) row
const isSuggestedDeputy = (d) => Boolean(getDeputyId(d)) && !d?.clientKey;

const getDeputyRowKey = (deputy, i) =>
  String(deputy?.id || deputy?._id || deputy?.tempId || `manual-${i}`);

const makeClientKey = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return `ck_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  }
};

const pickUrl = (v) => {
  if (!v) return "";
  if (typeof v === "string") return v.trim();

  if (typeof v === "object") {
    const u =
      v.secure_url ||
      v.secureUrl ||
      v.url ||
      v.path ||
      v.location ||
      v.src;
    return typeof u === "string" ? u.trim() : "";
  }

  return "";
};

const getSuggestionImageUrl = (m) => {
  // handle string or object formats across old/new records
  const direct =
    pickUrl(m?.profilePhoto) ||
    pickUrl(m?.profilePicture) ||
    pickUrl(m?.profile_picture) ||
    pickUrl(m?.profileImage) ||
    pickUrl(m?.profile_image);

  const additional0 = Array.isArray(m?.additionalImages)
    ? pickUrl(m.additionalImages[0])
    : "";

  return (direct || additional0 || "").trim();
};

const hasEmailOnFile = (m) => Boolean(String(m?.email || "").trim());
const hasPhoneOnFile = (m) =>
  Boolean(String(m?.phone || m?.phoneNumber || m?.phone_number || "").trim());

const getMemberSelfId = (member) =>
  String(
    member?.musicianId ||
      member?.musician_id ||
      member?.id ||
      member?._id ||
      ""
  ).trim();

const DeputiesInput = ({
  member,
  index,
  memberIndex,
  updateBandMember,
  actRepertoire = [],
  actGenres = [],
  isVocalSlot: isVocalSlotProp,
}) => {
const apiBase =
  (import.meta.env.VITE_ADMIN_API_BASE ||
   import.meta.env.VITE_BACKEND_URL ||
   "").replace(/\/$/, "");
   
   const publicSiteBase =
  import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:5174";

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

const roleName = (r) => String(r?.customRole || r?.role || "").trim();

const essentialRoles = useMemo(() => {
  const roles = Array.isArray(member?.additionalRoles) ? member.additionalRoles : [];
  return roles.filter(r => r?.isEssential).map(roleName).filter(Boolean);
}, [member?.additionalRoles]);

const desiredRoles = useMemo(() => {
  const roles =
    Array.isArray(member?.additionalRoles)
      ? member.additionalRoles.map(roleName).filter(Boolean)
      : [];

  return Array.from(new Set([...roles, ...desiredRolesFromInstrument]));
}, [member?.additionalRoles, desiredRolesFromInstrument]);

  // Exclude already-added deputy IDs and self
const excludeIds = useMemo(() => {
  const deputyIds = (member?.deputies || [])
    .map((d) => getDeputyId(d))
    .filter(Boolean);

  const selfId = getMemberSelfId(member);
  const all = selfId ? [...deputyIds, selfId] : deputyIds;

  return Array.from(new Set(all));
}, [member?.deputies, member]);

const addManualDeputy = () => {
  const updated = [
    ...(member.deputies || []),
    {
      clientKey: makeClientKey(), // ✅ manual marker + stable key
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
    },
  ];

  updateBandMember(index, memberIndex, "deputies", updated);
};

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
        isVocalSlot: !!isVocalSlot,
        actRepKey,
        memberCounty,
        memberDistrict,
      }),
    [apiBase, instrument, essentialRoles, isVocalSlot, actRepKey, memberCounty, memberDistrict]
  );

  // ---------- Local state ----------
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPct, setLoadingPct] = useState(0);
  const [lastPayload, setLastPayload] = useState(null);
  const [lastEndpointUsed, setLastEndpointUsed] = useState("");
const [imgErrorIds, setImgErrorIds] = useState(() => new Set());
  // Debounce timer + last key to avoid duplicate fetches
  const debounceRef = useRef(null);
  const lastKeyRef = useRef("");
const containerRef = useRef(null);
const inView = useInView(containerRef, { rootMargin: "350px 0px", threshold: 0 });
  // ---------- Effects ----------

  useEffect(() => {
    if (!loading) {
      // snap to 100 briefly then reset
      if (loadingPct !== 0) {
        setLoadingPct(100);
        const t = setTimeout(() => setLoadingPct(0), 250);
        return () => clearTimeout(t);
      }
      return;
    }

    // Fake progress: ramp quickly to 90%, then creep.
    setLoadingPct(10);
    const startedAt = Date.now();
    const t = setInterval(() => {
      setLoadingPct((p) => {
        const elapsed = Date.now() - startedAt;
        const cap = elapsed < 1200 ? 90 : 95;
        const next = p + (elapsed < 1200 ? 7 : 2);
        return next >= cap ? cap : next;
      });
    }, 180);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

useEffect(() => {
  const hasFilters = instrument || essentialRoles.length;

  dlog("queue effect", { hasFilters, inView, instrument, essentialRoles });

  if (!hasFilters) {
    setSuggestions([]);
    setLoading(false);
    return;
  }

  // IMPORTANT: give each section a stable “order”
  // tweak if your “index/memberIndex” meanings differ
  const order = (Number(index) || 0) * 1000 + (Number(memberIndex) || 0);

  let cancelled = false;

  const run = async ({ signal }) => {
    // Choose origin postcode: prefer member
    const originPostcode = (memberPost && memberPost.trim()) || "";
    const originLoc = countyAndNeighboursFromPostcode(originPostcode);

    const payload = {
      instrument,
      isVocalSlot,
      essentialRoles,
   desiredRoles,
      secondaryInstruments,
      excludeIds,
      actRepertoire,
      actGenres,
      originLocation: {
        county: originLoc.county || memberCounty,
        postcode: originPostcode,
        district: originLoc.normDistrict || memberDistrict,
        neighbouringCounties: originLoc.neighbours || memberNeighbourCounties || [],
      },
      fuzzySongTitles,
      fuzzySongMode: "title-only-loose-1token",
      debug: true,
    };

    setLastPayload(payload);

    const primaryUrl = `${apiBase}/musician/suggest`;
    const fallbackUrl = `${apiBase}/musicians/suggest`;

    setLastEndpointUsed(primaryUrl);
    dlog("QUEUE POST (primary):", primaryUrl, payload);

    let res;
    try {
      res = await axios.post(primaryUrl, payload, { signal });
    } catch (e) {
      if (e?.response?.status === 404) {
        setLastEndpointUsed(fallbackUrl);
        dlog("QUEUE primary 404 -> fallback:", fallbackUrl);
        res = await axios.post(fallbackUrl, payload, { signal });
      } else {
        throw e;
      }
    }

    const list = Array.isArray(res?.data?.musicians) ? res.data.musicians : [];
    return list;
  };

  // register this job with the queue
  DeputySuggestQueue.register(queryKey, { order, run });
  DeputySuggestQueue.setInView(queryKey, inView);

  // hydrate instantly if already cached (from prefetch)
  const cached = DeputySuggestQueue.getCached(queryKey);
  if (cached && cached.length) {
    setSuggestions(cached);
  }

  // if in view, show loading UI and request (queue will run 1-at-a-time)
  if (inView) {
    setLoading(true);

    DeputySuggestQueue.request(queryKey)
      .then((list) => {
        if (cancelled) return;
        setSuggestions(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (cancelled) return;
        if (axios.isCancel?.(err)) return;
        dlog("❌ QUEUE request failed:", err?.response?.data || err);
        setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
  } else {
    // if not in view, don’t show spinner (it may prefetch quietly later)
    setLoading(false);
  }

  return () => {
    cancelled = true;
    DeputySuggestQueue.unregister(queryKey);
  };
}, [
  queryKey,
  inView,

  // used inside run()
  apiBase,
  instrument,
  isVocalSlot,
  essentialRoles,
  desiredRolesFromInstrument,
  secondaryInstruments,
  excludeIds,
  actRepertoire,
  actGenres,
  member,
  memberPost,
  memberCounty,
  memberDistrict,
  memberNeighbourCounties,
  fuzzySongTitles,
  index,
  memberIndex,
]);

  // ---------- Handlers ----------
const addDeputy = (m) => {
  const newId = getDeputyId(m);
  dlog("➕ addDeputy:", newId, m?.firstName, m?.lastName);

  if (!newId) {
    console.warn("[DeputiesInput] addDeputy called without id/_id:", m);
    return;
  }

  const updated = [
    ...(member.deputies || []),
    {
      id: newId,
      _id: newId,
      firstName: m?.firstName || "",
      lastName: m?.lastName || "",
      email: String(m?.email || "").trim(),
      phoneNumber: String(m?.phone || m?.phoneNumber || m?.phone_number || "").trim(),
      image: getSuggestionImageUrl(m) || "",
    },
  ];

  updateBandMember(index, memberIndex, "deputies", updated);

  // Remove from carousel immediately (handle _id OR id)
  setSuggestions((prev) =>
    Array.isArray(prev)
      ? prev.filter((x) => getDeputyId(x) !== newId)
      : []
  );
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
      <div ref={containerRef} className="w-full mt-4">
    <div className="w-full mt-4">
      <p className="font-semibold mb-2">Suitable Deputies for this Role</p>

      <div className="flex gap-4 mb-4 overflow-x-auto">
        {loading ? (
          <div className="text-sm text-gray-500 min-w-[220px]">
            <div className="flex items-center justify-between">
              <span>Loading suggestions…</span>
              <span className="tabular-nums">{loadingPct}%</span>
            </div>
            <div className="mt-2 h-2 w-full rounded bg-gray-200 overflow-hidden">
              <div
                className="h-2 rounded bg-gray-500 transition-all"
                style={{ width: `${Math.max(0, Math.min(100, loadingPct))}%` }}
              />
            </div>
          </div>
        ) : suggestions.length ? (
          suggestions
            .filter((m) => !excludeIds.includes(getDeputyId(m)))
            .map((m) => {
              const mid = getDeputyId(m);
              return (
<div key={mid} className="text-center min-w-[84px]">
                 {(() => {
  const url = getSuggestionImageUrl(m);
  const id = String(m?._id || "").trim();
  const broken = imgErrorIds.has(id);

  if (DEBUG) {
    // one-line per item, easy to scan
    console.log("[DeputiesInput] pic check:", {
      id,
      name: `${m?.firstName || ""} ${m?.lastName || ""}`.trim(),
      profilePhoto: m?.profilePhoto,
      profilePicture: m?.profilePicture,
      additional0: Array.isArray(m?.additionalImages) ? m.additionalImages[0] : undefined,
      resolved: url,
    });
  }

  

  return url && !broken ? (
    <button
      type="button"
      onClick={() => addDeputy(m)}
      className="w-16 h-16 rounded-full overflow-hidden border flex items-center justify-center mx-auto"
      title="Add deputy"
    >
      <img
        src={url}
        alt={`${m.firstName || ""} ${m.lastName || ""}`}
        className="w-full h-full object-cover"
        onError={() => {
          console.warn("[DeputiesInput] image failed to load:", { id, url });
          setImgErrorIds((prev) => new Set(prev).add(id));
        }}
      />
    </button>
  ) : (
    <button
      type="button"
      onClick={() => addDeputy(m)}
      className="w-16 h-16 rounded-full border bg-gray-100 text-gray-600 text-sm flex items-center justify-center mx-auto"
      title="Add deputy"
    >
      {initials(m) || "Add"}
    </button>
  );
})()}

                <p className="text-xs font-semibold mt-1 line-clamp-1">
                  {m.firstName} {(m.lastName || "").charAt(0)}
                </p>
                 <a
    href={`${publicSiteBase}/musician/${mid}`}
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
            );
            })
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
             {(member.deputies || []).map((deputy, deputyIndex) => {
  const rowKey = getDeputyRowKey(deputy, deputyIndex);

  return (
                <Draggable
                  

key={rowKey}
draggableId={rowKey}
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
                        
                      {!isSuggestedDeputy(deputy) ? (
  <input
    type="text"
    value={deputy.lastName || ""}
    onChange={(e) => handleDeputyChange(deputyIndex, "lastName", e.target.value)}
    className="w-full px-3 py-2 border"
  />
) : (
  <input
    type="text"
    value={String(deputy.lastName || "").charAt(0)}
    readOnly
    className="w-full px-3 py-2 border text-gray-600 bg-gray-100"
  />
)}
                      </div>

                      {/* Email */}
                      <div className="col-span-2">
                      {!isSuggestedDeputy(deputy) ? (
  <input
    type="email"
    value={deputy.email || ""}
    onChange={(e) => handleDeputyChange(deputyIndex, "email", e.target.value)}
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
                       {!isSuggestedDeputy(deputy) ? (
  <input
    type="tel"
    value={deputy.phoneNumber || ""}
    onChange={(e) => handleDeputyChange(deputyIndex, "phoneNumber", e.target.value)}
    className="w-full px-3 py-2 border text-gray-600"
  />
) : (
  <input
    type="tel"
    value="--phone number on file--"
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
  );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {(!member.deputies || member.deputies.length < 10) && (
        <button
          type="button"
          className="mt-2 px-4 py-2 bg-[#ff6667] text-white rounded shadow hover:bg-black transition"
          onClick={addManualDeputy}
        >
          ➕ Add Deputy
        </button>
      )}
    </div>
    </div>
  );
};

export default DeputiesInput;