// Keep each review mix attached to the stem the owner is choosing between.
export function originalSubmissionTakes(submission, assets = []) {
  return submission.stemAssetIds.map((stemAssetId, index) => ({
    label: (assets.find(asset => String(asset._id) === String(stemAssetId))?.originalName || `Take ${index + 1}`).slice(0, 80),
    stemAssetId,
    stemAssetIds: [stemAssetId],
    mixdownAssetId: submission.mixdownAssetIds[stemAssetId] || '',
    ...(index === 0 && submission.wetStemAssetId ? { wetStemAssetId: submission.wetStemAssetId } : {}),
  }));
}

export function originalSubmissionPairsReady(submission, assets = []) {
  const { stemAssetIds, mixdownAssetIds, wetStemAssetId, reservationId } = submission;
  if (!stemAssetIds.length || stemAssetIds.length + (wetStemAssetId ? 1 : 0) > 3 || new Set(stemAssetIds).size !== stemAssetIds.length) return false;
  const available = new Map(assets.filter(asset => asset.state === 'active' && String(asset.reservationId) === String(reservationId)).map(asset => [String(asset._id), asset.kind]));
  const mixes = stemAssetIds.map(id => mixdownAssetIds[id]);
  return stemAssetIds.every(id => available.get(String(id)) === 'take_stem')
    && mixes.every(id => id && available.get(String(id)) === 'take_mixdown')
    && new Set(mixes).size === mixes.length
    && (!wetStemAssetId || (!stemAssetIds.includes(wetStemAssetId) && available.get(String(wetStemAssetId)) === 'take_stem'));
}
