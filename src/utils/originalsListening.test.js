import test from 'node:test';
import assert from 'node:assert/strict';
import { originalProjectListening, trackIsAudibleAt } from './originalsListening.js';
const asset = (id, kind = 'take_stem', extra = {}) => ({ _id: id, kind, state: 'active', originalName: `${id}.wav`, ...extra });
const take = (id, stem) => ({ _id: id, stemAssetId: stem, mixdownAssetId: `${stem}-mixdown` });
const accepted = (id, takes, extra = {}) => ({ _id: id, roleName: 'Keys', category: 'contribution', state: 'accepted', takes, selectionMode: 'whole_take', selectedTakeId: takes[0]._id, ...extra });

test('individual reference labels match the submitted material without presenting references as a combined project', () => {
  const result = originalProjectListening({ assets: [asset('guide', 'guide_track'), asset('sample', 'demo'), asset('video', 'video_submission'), asset('original', 'initial_stem'), asset('click', 'click_track')] });
  assert.deepEqual(result.references.map(item => item.listeningLabel), ['Listen to the guide', 'Listen to the sample', 'Watch the video sample', 'Listen to the click track']);
  assert.deepEqual(result.projectTracks.map(track => track._id), ['original']);
  assert.equal(originalProjectListening({ assets: [asset('video', 'demo', { mimeType: 'video/mp4' })] }).references[0].listeningLabel, 'Watch the video sample');
});

test('combines only the original stem and selected approved takes, excluding guides, samples, clicks and full mixdowns', () => {
  const result = originalProjectListening({
    assets: [asset('original', 'initial_stem'), asset('keys'), asset('unused'), asset('keys-mixdown', 'take_mixdown'), asset('guide', 'guide_track'), asset('sample', 'demo'), asset('click', 'click_track')],
    submissions: [accepted('keys-submission', [take('unused-take', 'unused'), take('chosen', 'keys')], { selectedTakeId: 'chosen' })],
  });
  assert.deepEqual(result.projectTracks.map(item => item._id), ['original', 'keys']);
});

test('a single approved foundation stem is available in the approved stems player', () => {
  const result = originalProjectListening({ assets: [asset('keys')], submissions: [accepted('keys-submission', [take('chosen', 'keys')])] });
  assert.deepEqual(result.references, []);
  assert.deepEqual(result.projectTracks.map(track => track._id), ['keys']);
});

test('does not include pending, rejected, retracted, hidden or non-final stems in the project player', () => {
  const result = originalProjectListening({
    assets: [asset('original', 'initial_stem'), asset('pending'), asset('rejected'), asset('retracted'), asset('hidden', 'take_stem', { state: 'hidden' }), asset('not-final', 'take_stem', { finalEligible: false })],
    submissions: ['pending', 'rejected', 'retracted', 'hidden', 'not-final'].map(id => accepted(id, [take(`${id}-take`, id)], { state: id === 'pending' ? 'submitted' : ['rejected', 'retracted'].includes(id) ? id : 'accepted' })),
  });
  assert.deepEqual(result.projectTracks.map(track => track._id), ['original']);
});

test('partially approved takes retain only their selected time windows and ignore unknown takes or invalid ranges', () => {
  const result = originalProjectListening({
    assets: [asset('original', 'initial_stem'), asset('keys'), asset('unused')],
    submissions: [accepted('partial', [take('chosen', 'keys'), take('unused-take', 'unused')], {
      selectionMode: 'selected_ranges',
      selectedRanges: [{ takeId: 'chosen', startSeconds: 5, endSeconds: 12 }, { takeId: 'chosen', startSeconds: 20, endSeconds: 30 }, { takeId: 'unknown', startSeconds: 0, endSeconds: 100 }, { takeId: 'unused-take', startSeconds: 5, endSeconds: 1 }],
    })],
  });
  assert.deepEqual(result.projectTracks.map(item => item._id), ['original', 'keys']);
  const keys = result.projectTracks[1];
  for (const [time, audible] of [[0, false], [5, true], [11.9, true], [12, false], [20, true], [30, false]]) assert.equal(trackIsAudibleAt(keys, time), audible);
});

test('deduplicates stems and does not guess when an approval has no selected take', () => {
  const selected = accepted('selected', [take('take', 'keys')]);
  const result = originalProjectListening({ assets: [asset('original', 'initial_stem'), asset('keys'), asset('unknown')], submissions: [selected, selected, accepted('missing', [take('other', 'unknown')], { selectedTakeId: null })] });
  assert.deepEqual(result.projectTracks.map(item => item._id), ['original', 'keys']);
});

test('a selected grouped take layers all its stems with the same approval windows, excluding alternatives and mixdowns', () => {
  const grouped = accepted('group', [take('chosen', 'lead')], { selectionMode: 'selected_ranges', selectedRanges: [{ takeId: 'chosen', startSeconds: 2, endSeconds: 6 }] });
  grouped.takes[0].stemAssetIds = ['lead', 'harmony', 'double'];
  grouped.takes[0].wetStemAssetId = 'effect';
  const result = originalProjectListening({ assets: ['lead','harmony','double','effect'].map(id => asset(id)), submissions: [grouped] });
  assert.deepEqual(result.projectTracks.map(item => item._id), ['lead','harmony','double']);
  for (const track of result.projectTracks) { assert.equal(trackIsAudibleAt(track, 1), false); assert.equal(trackIsAudibleAt(track, 3), true); assert.equal(trackIsAudibleAt(track, 6), false); }
});
