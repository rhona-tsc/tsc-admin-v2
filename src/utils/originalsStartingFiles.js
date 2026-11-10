const videoFile = file => file.type?.startsWith('video/') || /\.(mp4|mov)$/i.test(file.name);
export const startingFileKey = file => JSON.stringify([file.name, file.size, file.lastModified || 0]);

export function addOriginalStartingFiles(current, files, makeId = () => crypto.randomUUID()) {
  const seen = new Set(current.map(item => startingFileKey(item.file)));
  const added = [];
  for (const file of files) {
    if (seen.has(startingFileKey(file))) continue;
    seen.add(startingFileKey(file));
    added.push({ id: makeId(), file, kind: videoFile(file) ? 'video_submission' : 'initial_stem', createdEntirelyWithAi: false });
  }
  return [...current, ...added];
}

export function originalStartingMaterial(files) {
  const sourceType = files.some(item => item.kind === 'initial_stem') ? 'final_eligible_stem'
    : files.some(item => item.kind === 'guide_track') ? 'guide_track'
      : files.some(item => item.kind === 'video_submission') ? 'video_demo' : 'none';
  return { sourceType, hasInitialStem: ['final_eligible_stem', 'guide_track'].includes(sourceType) };
}

export function originalStartingFilesError(files, finalConfirmed) {
  const tooLarge = files.find(item => item.file.size > 100 * 1024 * 1024);
  if (tooLarge) return `${tooLarge.file.name} is larger than 100 MB. Choose a smaller export.`;
  if (files.some(item => item.kind === 'initial_stem') && !finalConfirmed) return 'Confirm that the selected production stems are intended for the final track.';
  return '';
}

// Keep confirmed uploads and the draft ID after an interrupted batch. Retrying
// continues that same project and only uploads files without a saved receipt.
export async function submitOriginalStartingProject({ request, payload, files, voiceNote, progress, onProgress = () => {} }) {
  progress.uploaded ||= {};
  progress.voices ||= {};
  if (progress.submitted) return;
  if (!progress.projectId) {
    const { data } = await request({ method: 'post', url: '/projects', data: payload });
    progress.projectId = data.project._id;
    progress.payload = JSON.stringify(payload);
    progress.agreementHash = payload.ownerAgreement?.textHash;
    onProgress({ projectId: progress.projectId, message: 'Draft saved. Uploading starting files…' });
  } else if (progress.payload !== JSON.stringify(payload)) {
    const data = { ...payload };
    if (progress.agreementHash === payload.ownerAgreement?.textHash) delete data.ownerAgreementAccepted;
    await request({ method: 'patch', url: `/projects/${progress.projectId}`, data });
    progress.payload = JSON.stringify(payload);
    progress.agreementHash = payload.ownerAgreement?.textHash;
  }
  for (let index = 0; index < files.length; index++) {
    const item = files[index];
    if (progress.uploaded[item.id]) continue;
    onProgress({ projectId: progress.projectId, message: `Uploading ${index + 1} of ${files.length}: ${item.file.name}` });
    const data = new FormData();
    data.append('file', item.file); data.append('kind', item.kind);
    data.append('songwritingClaim', String(payload.ownerSongwritingClaim));
    if (['initial_stem', 'click_track'].includes(item.kind)) data.append('createdEntirelyWithAi', String(item.createdEntirelyWithAi));
    if (item.kind === 'initial_stem') data.append('finalStemConfirmed', 'true');
    const uploaded = await request({ method: 'post', url: `/projects/${progress.projectId}/assets`, data });
    progress.uploaded[item.id] = uploaded.data.asset._id;
    onProgress({ projectId: progress.projectId, message: `Uploaded ${item.file.name}` });
  }
  if (voiceNote && !progress.voices[startingFileKey(voiceNote)]) {
    const data = new FormData(); data.append('file', voiceNote); data.append('kind', 'voice_note');
    await request({ method: 'post', url: `/projects/${progress.projectId}/assets`, data });
    progress.voices[startingFileKey(voiceNote)] = true;
  }
  onProgress({ projectId: progress.projectId, message: 'All starting files uploaded. Submitting for review…' });
  await request({ method: 'post', url: `/projects/${progress.projectId}/submit-for-moderation` });
  progress.submitted = true;
}
