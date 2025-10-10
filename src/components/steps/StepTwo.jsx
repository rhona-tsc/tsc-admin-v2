import React from "react";
import Genre from "../Genre";
import Repertoire from "../Repertoire";
import SongModeration from "../SongModeration";

const StepTwo = ({
  genre,
  setGenre,
  customRepertoire,
  setCustomRepertoire,
  selectedSongs,
  setSelectedSongs,
  setRepertoire,
  isChanged,
  mode: modeToUse,
  userRole,
  userEmail,
}) => {
  // unique key to dedupe title|artist|year
  const _songKey = (s) =>
    `${(s?.title || "").trim().toLowerCase()}|${(s?.artist || "")
      .trim()
      .toLowerCase()}|${s?.year ?? ""}`;

  // when moderation approves songs to master, also push into this act
  const handleApprovedSongs = (approved = []) => {
    const arr = Array.isArray(approved) ? approved : [approved];

    // normalize shape
    const norm = arr
      .filter(Boolean)
      .map((s) => ({
        title: String(s.title || "").trim(),
        artist: String(s.artist || "").trim(),
        year:
          s?.year === "" || s?.year == null || Number.isNaN(Number(s?.year))
            ? ""
            : Number(s.year),
        genre: String(s.genre || "").trim(),
      }))
      .filter((s) => s.title && s.artist);

    // merge into selectedSongs
    const seenSel = new Set((selectedSongs || []).map(_songKey));
    const mergedSel = [...(selectedSongs || [])];
    norm.forEach((s) => {
      const k = _songKey(s);
      if (!seenSel.has(k)) {
        seenSel.add(k);
        mergedSel.push(s);
      }
    });
    setSelectedSongs(mergedSel);

    // merge into repertoire (what gets saved on submit)
    setRepertoire((prev) => {
      const base = Array.isArray(prev) ? prev : [];
      const seen = new Set(base.map(_songKey));
      const out = [...base];
      norm.forEach((s) => {
        const k = _songKey(s);
        if (!seen.has(k)) {
          seen.add(k);
          out.push(s);
        }
      });
      return out;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">Step 2: Your Act's Repertoire</h2>

      <div className={isChanged("genre") ? "border-l-4 border-yellow-400 pl-4" : ""}>
        <Genre genre={genre} setGenre={setGenre} />
      </div>

      <div
        className={
          isChanged("customRepertoire") || isChanged("selectedSongs")
            ? "border-l-4 border-yellow-400 pl-4"
            : ""
        }
      >
        <Repertoire
          customRepertoire={customRepertoire}
          setCustomRepertoire={setCustomRepertoire}
          selectedSongs={selectedSongs}
          setSelectedSongs={setSelectedSongs}
          setRepertoire={setRepertoire}
        />

        {userRole?.includes("agent") && (
          <SongModeration
            selectedSongs={selectedSongs}
            setSelectedSongs={setSelectedSongs}
            userRole={userRole}
            mode={modeToUse}
            isChanged={isChanged}
            /* 👇 NEW: when songs are approved to master, also add to this act */
            onApprove={handleApprovedSongs}
          />
        )}
      </div>
    </div>
  );
};

export default StepTwo;