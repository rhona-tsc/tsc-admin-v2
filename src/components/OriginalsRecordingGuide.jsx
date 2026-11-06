import SectionLink from './OriginalsSectionLink';
import React from 'react';
export default function OriginalsRecordingGuide({ productionType = '' }) {
  return <details className="mt-4 rounded-lg border bg-slate-50 p-3 text-sm"><summary className="cursor-pointer font-semibold">Before you record: equipment & export tips</summary>
    {productionType ? <p className="mt-3">Read the project brief and chat, work from the authorised project files, and export your finished {productionType} at the agreed sample rate and start point. Listen back for timing, clipping and the full ending before uploading.</p> : <>
    <p className="mt-3">You need your own recording software (a DAW), headphones and suitable recording equipment. This page uploads and reviews your recordings; record and export your musical parts in your own software.</p>
    <ol className="mt-3 list-decimal space-y-2 pl-5">
      <li>Read the brief and project chat first. Ask the owner to confirm the tempo, key, sample rate and any count-in if they are unclear.</li>
      <li>If there is a foundation track or approved stems, import them at the very start of your session. For the first foundation stem, use the agreed tempo and count-in. Export your part from that same zero/start point, including silence before your entry, so it lines up when played with everyone else. Keep the agreed count-in and the full ending.</li>
      <li>Upload one to four stem files (separate musical parts), preferably clean, on their own, with no backing track or click and no added reverb or delay. Use headphones to avoid recording the guide through your microphone.</li>
      <li>If effects are part of your sound, you can upload a version with effects, without effects, or both. Keep the same start point and mark each file in the Effects column. Both versions count towards the four-file limit. Keep essential instrument processing where needed to preserve the sound.</li>
      <li>Use WAV or AIFF for the separate recording where practical, at the project's agreed sample rate. Avoid clipping or unnecessary loudness processing. Give files clear names such as Vocal_Name_Take1_Clean.wav.</li>
      <li>Adjust the stem volumes in <SectionLink to="project-guidance">Listen &amp; download the approved stems</SectionLink> and download them together if you need one track to record against. Keep that file at zero in your session. After uploading each stem, listen to its preview with the project, check the start, your entry and later sections, then confirm it fits before submitting. Alternative takes are reviewed separately by the owner.</li>
    </ol></>}<p className="mt-3 text-xs text-gray-600">Export help: <a className="underline" target="_blank" rel="noopener noreferrer" href="https://help.ableton.com/hc/en-us/articles/360000843404-Importing-and-exporting-stems">Ableton stem guide</a> · <a className="underline" target="_blank" rel="noopener noreferrer" href="https://support.apple.com/en-ca/guide/logicpro/lgcpb27f70f9/10.7/mac/11.6.1">Logic audio export guide</a></p>
  </details>;
}
