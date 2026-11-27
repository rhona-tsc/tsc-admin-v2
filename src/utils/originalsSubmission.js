// Keep each review mix attached to the stem the owner is choosing between.
export function originalSubmissionTakes(submission, assets = []) {
  return submission.stemAssetIds.map((stemAssetId, index) => ({
    label: (assets.find(asset => String(asset._id) === String(stemAssetId))?.originalName || `Take ${index + 1}`).slice(0, 80),
    stemAssetId,
    stemAssetIds: [stemAssetId],
    mixdownAssetId: submission.mixdownAssetIds?.[stemAssetId] || null,
    ...(submission.effectsByAssetId ? { effects: submission.effectsByAssetId[stemAssetId] || 'without_effects' } : {}),
    ...(index === 0 && submission.wetStemAssetId ? { wetStemAssetId: submission.wetStemAssetId } : {}),
  }));
}

export function originalSubmissionPairsReady(submission, assets = [], { listeningMixRequired = false } = {}) {
  const { stemAssetIds, mixdownAssetIds = {}, wetStemAssetId, reservationId } = submission;
  if (!stemAssetIds.length || stemAssetIds.length + (wetStemAssetId ? 1 : 0) > 4 || new Set(stemAssetIds).size !== stemAssetIds.length) return false;
  const available = new Map(assets.filter(asset => asset.state === 'active' && String(asset.reservationId) === String(reservationId)).map(asset => [String(asset._id), asset.kind]));
  const mixes = stemAssetIds.map(id => mixdownAssetIds[id]);
  return stemAssetIds.every(id => available.get(String(id)) === 'take_stem')
    && mixes.every(id => id ? available.get(String(id)) === 'take_mixdown' : !listeningMixRequired)
    && new Set(mixes.filter(Boolean)).size === mixes.filter(Boolean).length
    && (!wetStemAssetId || (!stemAssetIds.includes(wetStemAssetId) && available.get(String(wetStemAssetId)) === 'take_stem'));
}

// The stems-only form must not be blocked by remembered mix selections from
// an older workspace. Legacy review screens can still use the helpers above.
export function originalStemSubmission(submission, assets = []) {
  if (submission.groupedContribution) {
    const ids = submission.stemAssetIds || [];
    const available = new Map(assets.filter(asset => asset.state === 'active' && String(asset.reservationId) === String(submission.reservationId)).map(asset => [String(asset._id), asset]));
    let message = '';
    if (!submission.reservationId) message = 'Reserve a place in the current round to upload your recording.';
    else if (!ids.length || ids.length > 24) message = 'Include between 1 and 24 separate tracks for this contribution.';
    else if (new Set(ids).size !== ids.length || ids.some(id => available.get(String(id))?.kind !== 'take_stem')) message = 'A selected track is unavailable or selected twice.';
    else if (available.get(String(submission.listeningMixId))?.kind !== 'take_mixdown') message = 'Upload and select a stereo listening mix of your part only.';
    return { ready: !message, message, takes: message ? [] : [{ label: 'Grouped contribution', groupedContribution: true, stemAssetId: ids[0], stemAssetIds: ids, mixdownAssetId: submission.listeningMixId, effects: 'not_specified' }] };
  }
  const draft = { ...submission, mixdownAssetIds: {} };
  let message = '';
  if (!draft.reservationId) message = 'Reserve a place in the current round to upload your recording.';
  else if (!draft.stemAssetIds.length) message = assets.some(asset => asset.kind === 'take_stem' && asset.state === 'active' && String(asset.reservationId) === String(draft.reservationId)) ? 'Include at least one file from “Your stems”.' : 'Upload your first stem to continue.';
  else if (draft.stemAssetIds.length + (draft.wetStemAssetId ? 1 : 0) > 4) message = 'Choose up to four stem files, including any effects reference.';
  else if (!originalSubmissionPairsReady(draft, assets)) message = 'A selected file is unavailable or selected twice. Choose your stems again for this reservation.';
  return { ready: !message, message, takes: message ? [] : originalSubmissionTakes(draft, assets) };
}
