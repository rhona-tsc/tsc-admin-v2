import { originalAudibleTracks, originalDownloadTracks } from '../utils/originalsRoughMix';
import OriginalsMixDownload from './OriginalsMixDownload';
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { originalsRequest } from "../utils/originalsApi";
import { trackIsAudibleAt } from "../utils/originalsListening";
import OriginalsSubmittedBy from './OriginalsSubmittedBy';

const formatTime = (seconds) => {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, "0")}`;
};

const OriginalsLayeredPlayer = ({ token, tracks = [], onTimeChange, initialSelectedIds, title, onPlaybackStarted, allowMixDownload = true }) => {
  const audioRefs = useRef({});
  const refCallbacks = useRef({});
  const loadVersion = useRef(0);
  const [urls, setUrls] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [durations, setDurations] = useState({});
  const [mix, setMix] = useState({});
  const initiallySelected = useRef(initialSelectedIds);
  initiallySelected.current = initialSelectedIds;
  const activeTracks = useMemo(() => tracks.filter(track => track?._id && (!track.state || track.state === "active")), [tracks]);
  const trackKey = activeTracks.map(track => track._id).join(":");
  const tracksToLoad = useRef(activeTracks);
  tracksToLoad.current = activeTracks;
  const leadTrack = activeTracks.reduce((lead, track) => (durations[track._id] || 0) > (durations[lead?._id] || 0) ? track : lead, activeTracks[0]);
  const duration = durations[leadTrack?._id] || 0;

  useEffect(() => {
    loadVersion.current += 1;
    Object.values(audioRefs.current).forEach(audio => audio?.pause());
    setUrls({}); setPlaying(false); setTime(0); setDurations({}); setError("");
    return () => { loadVersion.current += 1; };
  }, [trackKey, token]);

  const load = useCallback(async () => {
    const version = ++loadVersion.current;
    setLoading(true); setError("");
    try {
      const entries = await Promise.all(tracksToLoad.current.map(async track => {
        const response = await originalsRequest(token, { method: "get", url: `/assets/${track._id}/access` });
        if (!response.data.url) throw new Error("File unavailable");
        return [track._id, response.data.url];
      }));
      if (version === loadVersion.current) setUrls(Object.fromEntries(entries));
    } catch {
      if (version === loadVersion.current) setError("Could not prepare the audio. Please try again.");
    } finally { if (version === loadVersion.current) setLoading(false); }
  }, [token]);

  // Parent edits and playback position updates recreate track arrays. Reload only
  // when the actual files or account change, so review controls cannot interrupt audio.
  useEffect(() => { if (trackKey) load(); }, [trackKey, load]);
  useEffect(() => {
    setMix(current => Object.fromEntries(activeTracks.map(track => [track._id, current[track._id] || { muted: initiallySelected.current ? !initiallySelected.current.includes(String(track._id)) : false, solo: false, volume: 1 }])));
  }, [activeTracks]);

  const audioRefFor = track => {
    if (!refCallbacks.current[track._id]) refCallbacks.current[track._id] = element => {
      if (!element) { audioRefs.current[track._id]?.pause(); delete audioRefs.current[track._id]; }
      else { audioRefs.current[track._id] = element; element.muted = !trackIsAudibleAt(track, 0); }
    };
    return refCallbacks.current[track._id];
  };
  useEffect(() => {
    if (playing) return;
    const anySolo = Object.values(mix).some(value => value.solo);
    for (const track of activeTracks) {
      const audio = audioRefs.current[track._id];
      if (!audio) continue;
      audio.muted = Boolean(mix[track._id]?.muted || (anySolo && !mix[track._id]?.solo) || !trackIsAudibleAt(track, time));
      audio.volume = mix[track._id]?.volume ?? 1;
    }
  }, [mix, activeTracks, playing, time]);

  // Gate partially approved stems against the shared timeline, and correct
  // noticeable drift without treating an early-ending stem as the end of the song.
  useEffect(() => {
    if (!playing) return;
    let frame;
    const tick = () => {
      const lead = audioRefs.current[leadTrack?._id];
      const at = lead?.currentTime || 0;
      const anySolo = Object.values(mix).some(value => value.solo);
      for (const track of activeTracks) {
        const audio = audioRefs.current[track._id];
        if (!audio) continue;
        audio.muted = Boolean(mix[track._id]?.muted || (anySolo && !mix[track._id]?.solo) || !trackIsAudibleAt(track, at));
        audio.volume = mix[track._id]?.volume ?? 1;
        if (audio !== lead && !audio.ended && Math.abs(audio.currentTime - at) > 0.2) audio.currentTime = at;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, leadTrack?._id, activeTracks, mix]);

  const selectedCount = activeTracks.filter(track => !mix[track._id]?.muted).length;
  const chooseAll = included => setMix(current => Object.fromEntries(activeTracks.map(track => [track._id, { ...(current[track._id] || { volume: 1 }), muted: !included, solo: false }])));
  const reset = () => { Object.values(audioRefs.current).forEach(audio => audio?.pause()); setPlaying(false); setTime(0); onTimeChange?.(0); Object.values(audioRefs.current).forEach(audio => { if (audio) audio.currentTime = 0; }); setMix(Object.fromEntries(activeTracks.map(track => [track._id, { muted: initiallySelected.current ? !initiallySelected.current.includes(String(track._id)) : false, solo: false, volume: 1 }]))); };
  useEffect(() => { if (!selectedCount && playing) { Object.values(audioRefs.current).forEach(audio => audio?.pause()); setPlaying(false); } }, [selectedCount, playing]);
  const playPause = async () => {
    const audios = Object.values(audioRefs.current).filter(Boolean);
    if (playing) { audios.forEach(audio => audio.pause()); setPlaying(false); return; }
    const start = time >= duration ? 0 : time;
    if (!audios.length || !duration) return;
    setError("");
    const anySolo = Object.values(mix).some(value => value.solo);
    for (const track of activeTracks) {
      const audio = audioRefs.current[track._id];
      if (!audio) continue;
      audio.muted = Boolean(mix[track._id]?.muted || (anySolo && !mix[track._id]?.solo) || !trackIsAudibleAt(track, start));
      audio.volume = mix[track._id]?.volume ?? 1;
    }
    const results = await Promise.allSettled(audios.map(audio => { audio.currentTime = Math.min(start, audio.duration || start); return audio.play(); }));
    if (results.some(result => result.status === "rejected")) {
      audios.forEach(audio => audio.pause());
      setPlaying(false); setError("Playback could not start. Reload the secure audio and try again.");
    } else { setTime(start); setPlaying(true); onPlaybackStarted?.(); }
  };
  const seek = nextTime => {
    setTime(nextTime); onTimeChange?.(nextTime);
    Object.values(audioRefs.current).forEach(audio => {
      if (!audio) return;
      audio.currentTime = Math.min(nextTime, Number.isFinite(audio.duration) ? audio.duration : nextTime);
      if (playing && nextTime < audio.duration && audio.paused) audio.play().catch(() => { setPlaying(false); setError("Playback paused. Press Play to continue."); });
    });
  };
  const reload = () => {
    Object.values(audioRefs.current).forEach(audio => audio?.pause());
    setPlaying(false); setUrls({}); setTime(0); setDurations({}); load();
  };

  if (!activeTracks.length) return <p className="text-sm text-gray-500">No playable stems available.</p>;
  if (!Object.keys(urls).length) return <div className="mt-3 space-y-2">{error ? <><p role="alert" className="text-sm text-red-700">{error}</p><button disabled={loading} onClick={load} className="rounded border px-3 py-2 text-sm">Try again</button></> : <p role="status" className="text-sm text-gray-500">Preparing secure audio…</p>}</div>;

  return <div className="rounded-lg bg-gray-950 p-4 text-white">
    <div className="flex flex-wrap items-center gap-3"><button disabled={!duration || !selectedCount} onClick={playPause} className="rounded bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-40">{playing ? "Pause" : activeTracks.length > 1 ? "Play selected stems" : "Play"}</button><span className="text-xs text-gray-300">{formatTime(time)} / {formatTime(duration)} · {selectedCount}/{activeTracks.length} included</span><button type="button" onClick={reset} className="ml-auto rounded border px-3 py-2 text-xs">Reset</button></div><div className="mt-3 flex flex-wrap gap-3 text-xs"><button type="button" className="underline" onClick={() => chooseAll(true)}>Select all stems</button><button type="button" className="underline" onClick={() => chooseAll(false)}>Deselect all stems</button><span className="text-gray-400">Tick the parts you want to hear together. Solo isolates a selected part.</span></div>
    {error && <p role="alert" className="mt-2 text-sm text-red-300">{error} <button onClick={reload} className="underline">Reload audio</button></p>}
    <input aria-label="Timeline" type="range" min="0" max={duration || 0} step="0.01" value={Math.min(time, duration || 0)} onChange={event => seek(Number(event.target.value))} className="mt-3 w-full" />
    <div className="mt-3 space-y-2">{activeTracks.map(track => {
      const controls = mix[track._id] || { muted: false, solo: false, volume: 1 };
      return <div key={track._id} className="grid grid-cols-[1fr_auto] items-center gap-2 rounded bg-gray-900 p-2 text-xs sm:grid-cols-[1fr_auto_160px]">
        <div className="min-w-0"><label className="flex min-w-0 items-start gap-2 break-words"><input type="checkbox" aria-label={`Include ${track.label || track.originalName}`} checked={!controls.muted} onChange={event => setMix(current => ({ ...current, [track._id]: { ...controls, muted: !event.target.checked } }))} /><span>{track.label || track.originalName}{track.playbackRanges && <span className="block text-gray-400">Approved sections only</span>}</span></label><OriginalsSubmittedBy credit={track.submittedBy} dark /></div>

        <button aria-pressed={controls.solo} onClick={() => setMix({ ...mix, [track._id]: { ...controls, solo: !controls.solo } })} className={`rounded px-2 py-1 ${controls.solo ? "bg-amber-500 text-black" : "bg-gray-700"}`}>Solo</button>
        <label className="col-span-2 flex items-center gap-2 sm:col-span-1"><span className="shrink-0">{Math.round(controls.volume * 100)}%</span><input aria-label={`${track.label || track.originalName} volume`} type="range" min="0" max="1" step="0.05" value={controls.volume} onChange={event => setMix({ ...mix, [track._id]: { ...controls, volume: Number(event.target.value) } })} className="min-w-0 w-full" /></label>
        <audio
          ref={audioRefFor(track)}
          preload="metadata" src={urls[track._id]}
          onLoadedMetadata={event => { const length = event.currentTarget.duration; if (Number.isFinite(length)) setDurations(current => ({ ...current, [track._id]: length })); }}
          onTimeUpdate={String(track._id) === String(leadTrack?._id) ? event => { setTime(event.currentTarget.currentTime); onTimeChange?.(event.currentTarget.currentTime); } : undefined}
          onPause={String(track._id) === String(leadTrack?._id) ? () => setPlaying(false) : undefined}
          onEnded={String(track._id) === String(leadTrack?._id) ? () => { Object.values(audioRefs.current).forEach(audio => audio?.pause()); setPlaying(false); } : undefined}
          onError={() => { Object.values(audioRefs.current).forEach(audio => audio?.pause()); setPlaying(false); setError("An audio file could not be played. Reload its secure link and try again."); }}
        />
      </div>;
    })}</div>
    {allowMixDownload && <OriginalsMixDownload token={token} tracks={activeTracks} mix={mix} duration={Math.max(0, ...originalDownloadTracks(activeTracks, mix).map(track => durations[track._id] || 0))} title={title} />}
  </div>;
};

export default OriginalsLayeredPlayer;
