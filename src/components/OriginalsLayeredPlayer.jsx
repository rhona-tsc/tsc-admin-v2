import React, { useEffect, useMemo, useRef, useState } from "react";
import { originalsRequest } from "../utils/originalsApi";

const formatTime = (seconds) => {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, "0")}`;
};

const OriginalsLayeredPlayer = ({ token, tracks = [], onTimeChange }) => {
  const audioRefs = useRef({});
  const [urls, setUrls] = useState({});
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mix, setMix] = useState({});

  const activeTracks = useMemo(() => tracks.filter((track) => track?._id && track.state !== "hidden"), [tracks]);

  const load = async () => {
    setLoading(true);
    try {
      const entries = await Promise.all(activeTracks.map(async (track) => {
        const response = await originalsRequest(token, { method: "get", url: `/assets/${track._id}/access` });
        return [track._id, response.data.url];
      }));
      setUrls(Object.fromEntries(entries));
    } finally { setLoading(false); }
  };

  useEffect(() => {
    setMix((current) => Object.fromEntries(activeTracks.map((track) => [track._id, current[track._id] || { muted: false, solo: false, volume: 1 }])));
  }, [activeTracks]);

  const effectiveMuted = (id) => {
    const anySolo = Object.values(mix).some((value) => value.solo);
    return Boolean(mix[id]?.muted || (anySolo && !mix[id]?.solo));
  };
  const syncMix = (next) => {
    setMix(next);
    const anySolo = Object.values(next).some((value) => value.solo);
    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      if (!audio) return;
      audio.muted = Boolean(next[id]?.muted || (anySolo && !next[id]?.solo));
      audio.volume = next[id]?.volume ?? 1;
    });
  };
  const playPause = async () => {
    const audios = Object.values(audioRefs.current).filter(Boolean);
    if (playing) audios.forEach((audio) => audio.pause());
    else await Promise.allSettled(audios.map((audio) => { audio.currentTime = time; return audio.play(); }));
    setPlaying(!playing);
  };
  const seek = (nextTime) => {
    setTime(nextTime); onTimeChange?.(nextTime);
    Object.values(audioRefs.current).forEach((audio) => { if (audio) audio.currentTime = nextTime; });
  };

  if (!activeTracks.length) return <p className="text-sm text-gray-500">No playable stems in this submission.</p>;
  if (!Object.keys(urls).length) return <button disabled={loading} onClick={load} className="rounded border px-3 py-2 text-sm">{loading ? "Preparing secure audio…" : "Load layered player"}</button>;

  return (
    <div className="rounded-lg bg-gray-950 p-4 text-white">
      <div className="flex items-center gap-3"><button onClick={playPause} className="rounded bg-white px-4 py-2 text-sm font-semibold text-black">{playing ? "Pause" : "Play all"}</button><span className="text-xs text-gray-300">{formatTime(time)} / {formatTime(duration)}</span></div>
      <input aria-label="Timeline" type="range" min="0" max={duration || 0} step="0.01" value={Math.min(time, duration || 0)} onChange={(event) => seek(Number(event.target.value))} className="mt-3 w-full" />
      <div className="mt-3 space-y-2">{activeTracks.map((track, index) => {
        const controls = mix[track._id] || { muted: false, solo: false, volume: 1 };
        return <div key={track._id} className="grid grid-cols-[1fr_auto_auto_120px] items-center gap-2 rounded bg-gray-900 p-2 text-xs">
          <span className="truncate">{track.originalName} <span className="text-gray-500">{track.kind}</span></span>
          <button onClick={() => syncMix({ ...mix, [track._id]: { ...controls, muted: !controls.muted } })} className={`rounded px-2 py-1 ${effectiveMuted(track._id) ? "bg-red-700" : "bg-gray-700"}`}>Mute</button>
          <button onClick={() => syncMix({ ...mix, [track._id]: { ...controls, solo: !controls.solo } })} className={`rounded px-2 py-1 ${controls.solo ? "bg-amber-500 text-black" : "bg-gray-700"}`}>Solo</button>
          <input aria-label={`${track.originalName} volume`} type="range" min="0" max="1" step="0.05" value={controls.volume} onChange={(event) => syncMix({ ...mix, [track._id]: { ...controls, volume: Number(event.target.value) } })} />
          <audio
            ref={(element) => { audioRefs.current[track._id] = element; }}
            src={urls[track._id]}
            onLoadedMetadata={(event) => setDuration((value) => Math.max(value, event.currentTarget.duration || 0))}
            onTimeUpdate={index === 0 ? (event) => { setTime(event.currentTarget.currentTime); onTimeChange?.(event.currentTarget.currentTime); } : undefined}
            onEnded={index === 0 ? () => setPlaying(false) : undefined}
          />
        </div>;
      })}</div>
    </div>
  );
};

export default OriginalsLayeredPlayer;
