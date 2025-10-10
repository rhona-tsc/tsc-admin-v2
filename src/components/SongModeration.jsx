import React, { useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";

const log = (...args) => console.log("%c[SongMod]", "color:#7950f2", ...args);
const group = (label) => console.groupCollapsed(`%c[SongMod] ${label}`, "color:#7950f2");
const end = () => console.groupEnd();

const preview = (str, n = 300) =>
  (str || "")
    .replace(/\s+/g, " ")
    .slice(0, n) + ((str || "").length > n ? " …" : "");

const SongModeration = ({
   selectedSongs,
   setSelectedSongs,
   userRole,
   mode,
      isChanged,
         onApprove = () => {},
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

    // 1) Try strict JSON first
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

    // 2) Normalize common "copy/paste" characters
    let normalized = text
      // smart single quotes → straight
      .replace(/[\u2018\u2019\u2032]/g, "'")
      // smart double quotes → straight
      .replace(/[\u201C\u201D\u2033]/g, '"')
      // non-breaking spaces → normal
      .replace(/\u00A0/g, " ");

    log("after unicode normalize preview:", preview(normalized));

    // Heuristic: if it already *looks* like JSON with double-quoted keys,
    // DON'T globally replace apostrophes.
    const looksJson =
      /"\s*[a-zA-Z0-9_]+\s*":/.test(normalized) ||
      /"\s*title\s*":/.test(normalized);

    if (!looksJson && !/"/.test(normalized) && /'/.test(normalized)) {
      normalized = normalized.replace(/'/g, '"');
      log("applied ' → \" substitution (JS-like input)");
    } else {
      log("skipped global ' → \" substitution");
    }

    // Quote unquoted keys (e.g., title: → "title":)
    normalized = normalized.replace(
      /([{,]\s*)([a-zA-Z0-9_]+)\s*:/g,
      '$1"$2":'
    );

    // Remove trailing commas before } or ]
    normalized = normalized.replace(/,\s*([}\]])/g, "$1");

    log("final normalized preview:", preview(normalized));

    try {
      const parsed = JSON.parse(normalized);
      const ok = Array.isArray(parsed);
      log("final JSON.parse result — isArray?", ok, "length:", ok ? parsed.length : "n/a");
      if (!ok) throw new Error("Parsed value is not an array");
      log("First item:", parsed[0]);
      end();
      return parsed;
    } catch (e) {
      log("final JSON.parse error:", e.message);
      end();
      throw new Error("Invalid input. Please ensure it's a valid array of song objects.");
    }
  };

  const handleParse = () => {
    group("handleParse()");
    try {
      const parsed = safeParseInput(rawInput);
      log("Parsed OK, appending to deputy selection. Count:", parsed.length);
      setParsedSongs(parsed);
      setSelectedSongs([...(selectedSongs || []), ...parsed]);
      setResultMsg(`Parsed ${parsed.length} songs and added to deputy selection.`);
    } catch (err) {
      log("Parse error:", err);
      alert(err.message);
    } finally {
      end();
    }
  };

  // helper to fetch the master list and return Set of existing keys
  const loadMasterSet = async () => {
    group("loadMasterSet()");
    try {
      const url = `${backendUrl}/api/moderation/master-songs`;
      log("GET", url);
      const res = await axios.get(url);
      const masterSongs = res.data.songs || [];
      log("master songs fetched:", masterSongs.length);
      const set = new Set(
        masterSongs.map(
          (s) =>
            `${(s.title || "").trim().toLowerCase()}|${(s.artist || "")
              .trim()
              .toLowerCase()}|${s.year || ""}`
        )
      );
      log("master keys size:", set.size);
      return set;
    } catch (e) {
      log("loadMasterSet error:", e);
      throw e;
    } finally {
      end();
    }
  };

  const getUniqueToMaster = async (songs) => {
    group("getUniqueToMaster()");
    log("incoming songs length:", songs.length);
    const existingKeys = await loadMasterSet();
    const unique = songs.filter((s) => {
      const key = `${(s.title || "").trim().toLowerCase()}|${(s.artist || "")
        .trim()
        .toLowerCase()}|${s.year || ""}`;
      return !existingKeys.has(key);
    });
    log("unique count:", unique.length);
    if (unique.length > 0) log("first unique:", unique[0]);
    end();
    return unique;
  };

  const handleSubmitToModeration = async () => {
    group("handleSubmitToModeration()");
    try {
      if (parsedSongs.length === 0 && !rawInput.trim()) {
        log("Nothing to submit — empty state.");
        setResultMsg("");
        alert("Nothing to submit. Paste songs or click Parse first.");
        return;
      }
      setBusy(true);
      setResultMsg("");
      const parsed =
        parsedSongs.length > 0 ? parsedSongs : safeParseInput(rawInput);

      const uniqueSongs = await getUniqueToMaster(parsed);
      if (uniqueSongs.length === 0) {
        setFilteredSongs([]);
        setResultMsg("All songs are already in the master repertoire.");
        log("Nothing new to submit.");
        return;
      }

      const url = `${backendUrl}/api/moderation/submit-pending-songs`;
      log("POST", url, "payload size:", uniqueSongs.length);
      await axios.post(url, { songs: uniqueSongs });

      setFilteredSongs(uniqueSongs);
      setResultMsg(`✅ Submitted ${uniqueSongs.length} new songs for moderation.`);
      log("Submitted OK.");
    } catch (err) {
      log("Submission error:", err?.response || err);
      alert(
        `Failed to submit songs.\n${err?.response?.data?.message || err.message}`
      );
    } finally {
      setBusy(false);
      end();
    }
  };


  // Skip moderation and add straight to master DB
  const handleDirectAddToMaster = async () => {
    group("handleDirectAddToMaster()");
    try {
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

      const uniqueSongs = await getUniqueToMaster(parsed);
      if (uniqueSongs.length === 0) {
        setFilteredSongs([]);
        setResultMsg("All songs are already in the master repertoire.");
        log("No unique songs to add directly.");
        return;
      }

      const url = `${backendUrl}/api/moderation/approve-song`;
      log("POST (per-song) to", url, "count:", uniqueSongs.length);

      // POST each song to approve/add endpoint
      const results = await Promise.allSettled(
        uniqueSongs.map((s, i) => {
          const payload = {
            title: s.title,
            artist: s.artist,
            genre: s.genre,
            year: s.year,
          };
          log(` → [${i}] payload:`, payload);
          return axios.post(url, payload);
        })
      );

      const failures = results.filter((r) => r.status === "rejected");
      if (failures.length) {
        log("Some inserts failed:", failures.length, failures.slice(0, 3));
        alert(
          `Some songs failed to add (${failures.length}). Check console for details.`
        );
      }

      // Notify parent so the act also gets these songs immediately
      try {
        const normalizedForAct = uniqueSongs.map((s) => ({
          title: String(s.title || "").trim(),
          artist: String(s.artist || "").trim(),
          year:
            s?.year === "" || s?.year == null || Number.isNaN(Number(s?.year))
              ? ""
              : Number(s.year),
          genre: String(s.genre || "").trim(),
        }));
        onApprove(normalizedForAct);
      } catch (e) {
        log("onApprove normalization error:", e);
      }
      // also add to the deputy’s selection so it’s reflected in the form
      setSelectedSongs([...(selectedSongs || []), ...uniqueSongs]);

      setFilteredSongs(uniqueSongs);
      setResultMsg(
        `✅ Added ${uniqueSongs.length} songs directly to master list (skipped moderation).`
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
        Submit Songs for Master Repertoire
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
          onClick={handleParse}
          disabled={busy}
          className="bg-black text-white px-4 py-2 rounded hover:bg-[#ff6667] hover:text-black disabled:opacity-50"
        >
          Parse & Add to Selected Songs
        </button>

        <button
          onClick={handleSubmitToModeration}
          disabled={busy}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Submit to Moderation DB
        </button>

        <button
          onClick={handleDirectAddToMaster}
          disabled={busy}
          className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 disabled:opacity-50"
          title="Skips moderation and inserts directly to the master songs collection"
        >
          ➤ Skip Moderation — Add to Master DB
        </button>
      </div>

      {(filteredSongs.length > 0 || resultMsg) && (
        <div className="mt-4 text-sm text-gray-700">
          {resultMsg}
          {filteredSongs.length > 0 && parsedSongs.length > 0 && (
            <>
              <br />
              🛑 {Math.max(parsedSongs.length - filteredSongs.length, 0)} duplicates
              skipped.
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SongModeration;