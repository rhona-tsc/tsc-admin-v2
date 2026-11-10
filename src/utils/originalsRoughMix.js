export const ROUGH_MIX_RATE = 44100;
export const MAX_ROUGH_MIX_SECONDS = 600;
const cancelled = signal => { if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError'); };
const yieldFrame = () => new Promise(resolve => setTimeout(resolve, 0));

const referenceKinds = new Set(['guide_track', 'demo', 'voice_note', 'video_submission', 'chat_attachment', 'take_mixdown']);
// Clicks are optional recording aids, even though they are never release stems.
export const originalMixdownTracks = tracks => tracks.filter(track => !referenceKinds.has(track.kind)
  && (track.finalEligible !== false || ['click_track', 'temporary_stem'].includes(track.kind)));

export function originalAudibleTracks(tracks, mix = {}) {
  const solo = tracks.some(track => mix[track._id]?.solo);
  return tracks.filter(track => !mix[track._id]?.muted && (!solo || mix[track._id]?.solo) && (mix[track._id]?.volume ?? 1) > 0)
    .map(track => ({ ...track, volume: mix[track._id]?.volume ?? 1 }));
}
export const originalDownloadTracks = (tracks, mix = {}) => originalMixdownTracks(originalAudibleTracks(tracks, mix));

export function originalMixRanges(track, length, sampleRate) {
  if (!track.playbackRanges) return [[0, length]];
  const ranges = track.playbackRanges.map(range => [Math.max(0, Math.ceil(range.startSeconds * sampleRate)), Math.min(length, Math.ceil(range.endSeconds * sampleRate))])
    .filter(([start, end]) => Number.isFinite(start) && Number.isFinite(end) && end > start).sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const range of ranges) {
    const previous = merged.at(-1);
    if (previous && range[0] <= previous[1]) previous[1] = Math.max(previous[1], range[1]);
    else merged.push([...range]);
  }
  return merged;
}
export function encodeOriginalMixWav(channels, sampleRate = ROUGH_MIX_RATE) {
  const frames = channels[0].length, count = channels.length;
  const result = new ArrayBuffer(44 + frames * count * 2), view = new DataView(result);
  const word = (at, value) => [...value].forEach((char, index) => view.setUint8(at + index, char.charCodeAt(0)));
  word(0, 'RIFF'); view.setUint32(4, result.byteLength - 8, true); word(8, 'WAVE'); word(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, count, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * count * 2, true); view.setUint16(32, count * 2, true); view.setUint16(34, 16, true);
  word(36, 'data'); view.setUint32(40, frames * count * 2, true);
  let peak = 0;
  for (const channel of channels) for (let frame = 0; frame < frames; frame++) peak = Math.max(peak, Math.abs(channel[frame]));
  const gain = peak > 0.98 ? 0.98 / peak : 1;
  let offset = 44;
  for (let frame = 0; frame < frames; frame++) for (let channel = 0; channel < count; channel++) {
    const sample = Math.max(-1, Math.min(1, channels[channel][frame] * gain));
    view.setInt16(offset, Math.round(sample * (sample < 0 ? 32768 : 32767)), true); offset += 2;
  }
  return { buffer: result, peakAdjusted: gain < 1 };
}
// Decode and sum one source at a time to avoid retaining every decoded stem in
// memory. All files share zero; partial approvals preserve silence outside their
// ranges. Nothing is trimmed, shifted, uploaded or saved back over an original.
export async function makeOriginalRoughMix({ tracks, loadAudio, signal, onProgress, minDuration = 0 }) {
  tracks = originalMixdownTracks(tracks);
  if (!tracks.length) throw new Error('Select at least one audible stem to mix.');
  const Offline = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
  if (!Offline) throw new Error('Audio mixing is unavailable in this browser. Please try a current browser.');
  if (minDuration > MAX_ROUGH_MIX_SECONDS) throw new Error('Browser rough mixes support tracks up to 10 minutes.');
  const decoder = new Offline(2, 1, ROUGH_MIX_RATE);
  let channels = [new Float32Array(Math.ceil(minDuration * ROUGH_MIX_RATE)), new Float32Array(Math.ceil(minDuration * ROUGH_MIX_RATE))];
  for (let index = 0; index < tracks.length; index++) {
    cancelled(signal);
    const track = tracks[index]; onProgress?.(`Mixing ${index + 1} of ${tracks.length}: ${track.label || track.originalName}`);
    const bytes = await loadAudio(track, signal); cancelled(signal);
    let decoded;
    try { decoded = await decoder.decodeAudioData(bytes); }
    catch { throw new Error(`Could not decode ${track.originalName || 'this stem'}. Try a WAV or MP3 export.`); }
    cancelled(signal);
    if (decoded.numberOfChannels > 2) throw new Error('Use mono or stereo stems for a browser rough mix.');
    if (decoded.duration > MAX_ROUGH_MIX_SECONDS) throw new Error('Browser rough mixes support tracks up to 10 minutes.');
    if (decoded.length > channels[0].length) channels = channels.map(channel => { const longer = new Float32Array(decoded.length); longer.set(channel); return longer; });
    const ranges = originalMixRanges(track, decoded.length, ROUGH_MIX_RATE), gain = Math.max(0, Math.min(1, track.volume ?? 1));
    for (let channel = 0; channel < 2; channel++) {
      const source = decoded.getChannelData(Math.min(channel, decoded.numberOfChannels - 1));
      for (const [start, end] of ranges) for (let frame = start; frame < end; frame++) channels[channel][frame] += source[frame] * gain;
    }
    decoded = null;
    await yieldFrame();
  }
  cancelled(signal); onProgress?.('Preparing the merged WAV…'); await yieldFrame(); cancelled(signal);
  const encoded = encodeOriginalMixWav(channels);
  return { blob: new Blob([encoded.buffer], { type: 'audio/wav' }), duration: channels[0].length / ROUGH_MIX_RATE, peakAdjusted: encoded.peakAdjusted };
}
export const originalRoughMixName = title => `${String(title || 'Project').replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 90) || 'Project'} - rough recording mix.wav`;
