import React, { useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";

const log = (...args) => console.log("%c[SongMod]", "color:#7950f2", ...args);
const group = (label) =>
  console.groupCollapsed(`%c[SongMod] ${label}`, "color:#7950f2");
const end = () => console.groupEnd();

const preview = (str, n = 300) =>
  (str || "").replace(/\s+/g, " ").slice(0, n) +
  ((str || "").length > n ? " …" : "");

// Convert JS-like arrays/objects with single-quoted strings into JSON-safe text.
// Heuristics: treats apostrophes inside words (e.g. Sittin', O'Connor) as part of the string.
const toJsonSafeText = (input) => {
  let src = String(input || "");

  // Remove leading/trailing whitespace
  src = src.trim();

  // If user pasted multiple objects without wrapping [], wrap them.
  // e.g. `{...},\n{...}` -> `[{...},\n{...}]`
  if (src && !/^\s*\[/.test(src)) {
    src = `[${src}]`;
  }

  // Strip trailing semicolons
  src = src.replace(/;\s*$/, "");

  // 1) Normalize unicode quotes/spaces first
  src = src
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201C\u201D\u2033]/g, '"')
    .replace(/\u00A0/g, " ");

  // 2) Convert single-quoted strings to double-quoted strings (with simple apostrophe heuristics)
  let out = "";
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];

    // Inside double-quoted string: keep as-is (respect escapes)
    if (inDouble) {
      out += ch;
      if (ch === "\\" && i + 1 < src.length) {
        out += src[i + 1];
        i++;
        continue;
      }
      if (ch === '"') inDouble = false;
      continue;
    }

    // Inside single-quoted string: emit JSON-safe content
    if (inSingle) {
      if (ch === "\\" && i + 1 < src.length) {
        // Preserve escapes; also allow \' to become a literal apostrophe
        const nxt = src[i + 1];
        if (nxt === "'") {
          out += "'";
          i++;
          continue;
        }
        out += "\\" + nxt;
        i++;
        continue;
      }

      if (ch === "'") {
        const prev = src[i - 1] || "";
        const next = src[i + 1] || "";
        const isWordApostrophe = /[0-9A-Za-z]/.test(prev) && /[0-9A-Za-z]/.test(next);
        if (isWordApostrophe) {
          out += "'";
          continue;
        }
        // end single-quoted string
        inSingle = false;
        out += '"';
        continue;
      }

      if (ch === '"') {
        out += "\\\"";
        continue;
      }

      if (ch === "\n") {
        out += "\\n";
        continue;
      }

      if (ch === "\r") {
        continue;
      }

      out += ch;
      continue;
    }

    // Not in any string
    if (ch === '"') {
      inDouble = true;
      out += ch;
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      out += '"';
      continue;
    }

    out += ch;
  }

  // If we ended while still in a single-quoted string, close it to avoid hard parse failures.
  if (inSingle) out += '"';

  // 3) Quote unquoted keys: { title: "x" } -> { "title": "x" }
  out = out.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

  // 4) Remove trailing commas before } or ]
  out = out.replace(/,\s*([}\]])/g, "$1");

  return out;
};

// key helpers
const makeKey = (s) =>
  `${(s?.title || "").trim().toLowerCase()}|${(s?.artist || "")
    .trim()
    .toLowerCase()}|${s?.year ?? ""}`;

const DeputySongModeration = ({
  selectedSongs,
  setSelectedSongs,
  userRole,
  deputyId,
}) => {
  const [rawInput, setRawInput] = useState("");
  const [parsedSongs, setParsedSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [resultMsg, setResultMsg] = useState("");

  const safeParseInput = (input) => {
    const text = (input || "").trim();

    group("safeParseInput()");
    log("raw length:", (input || "").length);
    log("raw preview:", preview(input));

    if (!text) {
      end();
      throw new Error("Input is empty. Please paste your song array.");
    }

    // 1) strict JSON first
    try {
      const strictParsed = JSON.parse(text);
      if (Array.isArray(strictParsed)) {
        log("Strict JSON.parse OK — array length:", strictParsed.length);
        log("First item:", strictParsed[0]);
        end();
        return strictParsed;
      }
      log("Strict parse produced non-array:", typeof strictParsed);
    } catch (e) {
      log("Strict JSON.parse failed:", e.message);
    }

    // 2) normalize/convert JS-like input (single quotes, unquoted keys, missing array brackets)
    const normalized = toJsonSafeText(text);

    log("final normalized preview:", preview(normalized));

    try {
      const parsed = JSON.parse(normalized);
      if (!Array.isArray(parsed))
        throw new Error("Parsed value is not an array");
      log("final JSON.parse OK — length:", parsed.length);
      log("First item:", parsed[0]);
      end();
      return parsed;
    } catch (e) {
      log("final JSON.parse error:", e.message);
      end();
      throw new Error(
        "Invalid input. Please ensure it's a valid array of song objects."
      );
    }
  };

  const handleParse = () => {
    group("handleParse()");
    try {
      const parsed = safeParseInput(rawInput);
      log("Parsed OK, appending to deputy selection. Count:", parsed.length);
      setParsedSongs(parsed);
      setSelectedSongs([...(selectedSongs || []), ...parsed]);
      setResultMsg(
        `Parsed ${parsed.length} songs and added to deputy selection.`
      );
    } catch (err) {
      log("Parse error:", err);
      alert(err.message);
    } finally {
      end();
    }
  };

  // fetch all master songs → return Map by key and arrays
  const fetchMasterSongs = async () => {
    const url = `${backendUrl}/api/moderation/master-songs`;
    log("GET", url);
    const res = await axios.get(url);
    const masterSongs = res?.data?.songs || [];
    const byKey = new Map(masterSongs.map((s) => [makeKey(s), s]));
    return { masterSongs, byKey };
  };

  // from candidate songs, return only those not already in master
  const getUniqueToMaster = async (songs) => {
    const { byKey } = await fetchMasterSongs();
    const unique = songs.filter((s) => !byKey.has(makeKey(s)));
    log("unique to master:", unique.length);
    return unique;
  };

  // MAIN: Skip moderation → add to master → also append to deputy.repertoire (as objects)
  const handleDirectAddToMaster = async () => {
    log("handleDirectAddToMaster — deputyId:", deputyId);
    if (!deputyId) {
      alert("Missing deputyId — cannot update deputy repertoire.");
      return;
    }
    group("handleDirectAddToMaster()");
    try {
      if (!deputyId) {
        alert("Missing deputyId — cannot update deputy repertoire.");
        return;
      }

      setResultMsg("");
      if (parsedSongs.length === 0 && !rawInput.trim()) {
        log("Nothing to add — empty state.");
        alert("Nothing to add. Paste songs or click Parse first.");
        return;
      }

      setBusy(true);

      const parsed =
        parsedSongs.length > 0 ? parsedSongs : safeParseInput(rawInput);
      log("DirectAdd will use songs:", parsed.length);

      // 1) figure out which are not in master yet
      const uniqueToMaster = await getUniqueToMaster(parsed);

      // 2) create any missing songs in master
      if (uniqueToMaster.length > 0) {
        const approveUrl = `${backendUrl}/api/moderation/approve-song`;
        log("POST (per-song) to", approveUrl, "count:", uniqueToMaster.length);

        const results = await Promise.allSettled(
          uniqueToMaster.map((s, i) => {
            const payload = {
              title: s.title,
              artist: s.artist,
              genre: s.genre,
              year: s.year,
            };
            log(` → [${i}] payload:`, payload);
            return axios.post(approveUrl, payload);
          })
        );

        const failures = results.filter((r) => r.status === "rejected");
        if (failures.length) {
          log("Some inserts failed:", failures.length, failures.slice(0, 3));
          alert(
            `Some songs failed to add (${failures.length}). Check console for details.`
          );
        }
      }

      // 3) re-fetch master to get Song IDs for *all* parsed songs (including pre-existing)
      const { byKey } = await fetchMasterSongs();
      const songIds = [];
      const successfullyResolvable = [];

      for (const s of parsed) {
        const found = byKey.get(makeKey(s));
        if (found?._id) {
          songIds.push(found._id);
          successfullyResolvable.push(found);
        }
      }

      if (songIds.length === 0) {
        log("No songs resolved to master IDs — aborting repertoire update.");
        alert(
          "Songs were added to the master list, but could not resolve IDs to update repertoire."
        );
        return;
      }

      // 4) append to deputy repertoire as OBJECTS (server de-dupes by title|artist|year)
      // 🔧 FIXED PATH: goes through /api/musician/...
const repUrl = `${backendUrl}/api/moderation/deputy/${deputyId}/repertoire/append`;      log("POST repertoire append (objects):", repUrl, "count:", parsed.length);
      await axios.post(repUrl, {
        songs: parsed.map((s) => ({
          title: s.title,
          artist: s.artist,
          year: s.year ?? "",
          genre: s.genre || "",
        })),
        // Optional: also mirror into selectedSongs
        selectedSongs: parsed.map((s) => ({
          title: s.title,
          artist: s.artist,
          year: s.year ?? "",
          genre: s.genre || "",
        })),
      });

      // 5) update local selection as well (so the UI shows them immediately)
      setSelectedSongs([
        ...(selectedSongs || []),
        ...successfullyResolvable.map((s) => ({
          title: s.title,
          artist: s.artist,
          genre: s.genre || "",
          year: s.year || "",
        })),
      ]);

      setFilteredSongs(parsed);
      setResultMsg(
        `✅ Added ${parsed.length} songs to master and deputy repertoire.`
      );
      log("Direct add complete.");
    } catch (err) {
      log("Direct add error:", err?.response || err);
      alert(
        `Direct add failed.\n${err?.response?.data?.message || err.message}`
      );
    } finally {
      setBusy(false);
      end();
    }
  };

  return (
    <div className="mt-6 p-4 bg-white border rounded shadow">
      <h3 className="text-lg font-semibold mb-2">
        Submit Songs to the Deputy's Repertoire
      </h3>

      <textarea
        value={rawInput}
        onChange={(e) => {
          setRawInput(e.target.value);
          log("textarea onChange — length:", e.target.value.length);
        }}
        placeholder={`Paste an array of song objects here.
Examples:
[
  { title: 'Levitating', artist: 'Dua Lipa', year: 2020, genre: 'Pop' },
  { title: 'Uptown Funk', artist: 'Bruno Mars', year: 2014, genre: 'Funk' }
]

Single quotes and unquoted keys are allowed — we’ll auto-format it.`}
        className="w-full p-2 border rounded h-40 font-mono text-sm"
      />

      <div className="flex flex-wrap gap-3 mt-2">
        <button
          onClick={() => {
            try {
              const parsed = safeParseInput(rawInput);
              setParsedSongs(parsed);
              setSelectedSongs([...(selectedSongs || []), ...parsed]);
              setResultMsg(
                `Parsed ${parsed.length} songs and added to deputy selection.`
              );
            } catch (e) {
              alert(e.message);
            }
          }}
          disabled={busy}
          className="bg-black text-white px-4 py-2 rounded hover:bg-[#ff6667] hover:text-black disabled:opacity-50"
        >
          Parse & Add to Selected Songs
        </button>

        <button
          onClick={handleDirectAddToMaster}
          disabled={busy}
          className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 disabled:opacity-50"
          title="Skips moderation, inserts to master, and appends to deputy repertoire"
        >
          ➤ Add to Master & Deputy Repertoire
        </button>
      </div>

      {(filteredSongs.length > 0 || resultMsg) && (
        <div className="mt-4 text-sm text-gray-700">{resultMsg}</div>
      )}
    </div>
  );
};

export default DeputySongModeration;