const idOf = value => String(value?._id || value || '');
const active = asset => asset?._id && (!asset.state || asset.state === 'active');
const referenceLabels = {
  guide_track: 'Listen to the guide',
  demo: 'Listen to the sample',
  video_submission: 'Watch the video sample',
  initial_stem: 'Listen to the original stem',
  click_track: 'Listen to the click track',
};

export function originalProjectListening({ assets = [], submissions = [] } = {}) {
  const available = new Map(assets.filter(active).map(asset => [idOf(asset._id), asset]));
  const references = assets.filter(asset => active(asset) && referenceLabels[asset.kind]).map(asset => ({
    ...asset, listeningLabel: asset.mimeType?.startsWith("video/") ? "Watch the video sample" : referenceLabels[asset.kind],
  }));
  const layers = new Map();
  for (const asset of available.values()) {
    if (asset.kind === 'initial_stem' && asset.finalEligible !== false) layers.set(idOf(asset._id), { ...asset, label: 'Original stem' });
  }
  const addTake = (submission, take, ranges) => {
    const asset = available.get(idOf(take?.stemAssetId));
    if (!asset || asset.kind !== 'take_stem' || asset.finalEligible === false) return;
    const key = idOf(asset._id);
    const existing = layers.get(key);
    // An entire approved take supersedes any partial ranges of that same stem.
    if (existing && !existing.playbackRanges) return;
    layers.set(key, {
      ...asset, label: take.stemAssetIds?.length > 1 ? `${submission.roleName} — ${asset.originalName}` : submission.roleName || asset.originalName,
      ...(ranges ? { playbackRanges: [...(existing?.playbackRanges || []), ...ranges] } : {}),
    });
  };
  for (const submission of submissions) {
    if (submission.state !== 'accepted' || (submission.category && submission.category !== 'contribution')) continue;
    if (submission.selectionMode === 'whole_take') {
      const take = (submission.takes || []).find(take => idOf(take._id) === idOf(submission.selectedTakeId));
      if (take) for (const stemAssetId of take.stemAssetIds?.length ? take.stemAssetIds : [take.stemAssetId]) addTake(submission, { ...take, stemAssetId });
    } else if (submission.selectionMode === 'selected_ranges') {
      for (const take of submission.takes || []) {
        const ranges = (submission.selectedRanges || []).filter(range => idOf(range.takeId) === idOf(take._id)
          && Number.isFinite(range.startSeconds) && Number.isFinite(range.endSeconds)
          && range.startSeconds >= 0 && range.endSeconds > range.startSeconds)
          .map(({ startSeconds, endSeconds }) => ({ startSeconds, endSeconds }));
        if (ranges.length) for (const stemAssetId of take.stemAssetIds?.length ? take.stemAssetIds : [take.stemAssetId]) addTake(submission, { ...take, stemAssetId }, ranges);
      }
    }
  }
  const projectTracks = [...layers.values()];
  return { references: projectTracks.length ? references.filter(asset => asset.kind !== "initial_stem") : references, projectTracks };

}

export const trackIsAudibleAt = (track, time) => !track.playbackRanges
  || track.playbackRanges.some(range => time >= range.startSeconds && time < range.endSeconds);

export function originalRecordingTracks(input) {
  const { references, projectTracks } = originalProjectListening(input);
  const clicks = references.filter(asset => asset.kind === 'click_track');
  const guides = references.filter(asset => asset.kind === 'guide_track' && asset.mimeType?.startsWith('audio/'));
  const demos = references.filter(asset => asset.kind === 'demo' && asset.mimeType?.startsWith('audio/'));
  const guide = (guides.length ? guides : demos).sort((a, b) => (new Date(a.createdAt || 0) - new Date(b.createdAt || 0)) || String(a._id).localeCompare(String(b._id))).at(-1);
  return [...projectTracks, ...(!projectTracks.length && guide ? [guide] : []), ...clicks];
}
