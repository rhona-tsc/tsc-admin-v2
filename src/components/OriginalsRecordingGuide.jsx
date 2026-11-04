import React from 'react';
export default function OriginalsRecordingGuide() {
  return <details className="mt-4 rounded-lg border bg-slate-50 p-3 text-sm"><summary className="cursor-pointer font-semibold">Before you record: equipment & export tips</summary>
    <p className="mt-3">You need your own recording software (a DAW), headphones and suitable recording equipment. This page uploads and reviews your recordings; record and export your musical parts in your own software.</p>
    <ol className="mt-3 list-decimal space-y-2 pl-5">
      <li>Read the brief and project chat first. Ask the owner to confirm the tempo, key, sample rate and any count-in if they are unclear.</li>
      <li>Import the foundation track or approved stems at the very start of your session. Export your part from that same zero/start point, including silence before your entry, so it lines up when played with everyone else. Keep the agreed count-in and the full ending.</li>
      <li>Upload a clean version of your part on its own, with no backing track or click and no added reverb or delay. Use headphones to avoid recording the guide through your microphone.</li>
      <li>If effects are part of your sound, also export an effects version of the same performance and start point. Upload it as an optional effects stem and identify it in your notes. Keep essential instrument processing where needed to preserve the sound.</li>
      <li>Use WAV or AIFF for the separate recording where practical, at the project's agreed sample rate. Avoid clipping or unnecessary loudness processing. Give files clear names such as Vocal_Name_Take1_Clean.wav.</li>
      <li>Export a listening mix, ideally MP3, with your part alongside the project track. This is for review; the separate recording is what can be used in the final mix. Check both files before uploading.</li>
    </ol><p className="mt-3 text-xs text-gray-600">Export help: <a className="underline" target="_blank" rel="noopener noreferrer" href="https://help.ableton.com/hc/en-us/articles/360000843404-Importing-and-exporting-stems">Ableton stem guide</a> · <a className="underline" target="_blank" rel="noopener noreferrer" href="https://support.apple.com/en-ca/guide/logicpro/lgcpb27f70f9/10.7/mac/11.6.1">Logic audio export guide</a></p>
  </details>;
}
