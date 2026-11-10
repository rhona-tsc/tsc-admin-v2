import test from 'node:test';
import assert from 'node:assert/strict';
import { addOriginalStartingFiles, originalStartingMaterial, originalStartingFilesError, submitOriginalStartingProject } from '../src/utils/originalsStartingFiles.js';

const file = (name, type = 'audio/wav') => new File(['sample'], name, { type, lastModified: 100 });
const entry = (name, kind = 'initial_stem', ai = false) => ({ id: name, file: file(`${name}.wav`), kind, createdEntirelyWithAi: ai });
const payload = { title: 'New groove', ownerSongwritingClaim: false, ownerAgreementAccepted: true, ownerAgreement: { textHash: 'current' } };

test('multiple selections append files without losing metadata or repeating the same file', () => {
  let id = 0;
  const drums = file('Drums.wav'), keys = file('Keys.wav');
  const first = addOriginalStartingFiles([], [drums, keys], () => String(++id));
  first[0].createdEntirelyWithAi = true;
  const next = addOriginalStartingFiles(first, [drums, file('Click.wav'), file('Idea.mov', 'video/quicktime')], () => String(++id));
  assert.deepEqual(next.map(item => item.file.name), ['Drums.wav', 'Keys.wav', 'Click.wav', 'Idea.mov']);
  assert.equal(next[0].createdEntirelyWithAi, true); assert.equal(next[1].createdEntirelyWithAi, false);
  assert.equal(next[3].kind, 'video_submission');
});

test('a mixed batch keeps production stems as the foundation regardless of reference upload order', () => {
  const files = [entry('Drums'), entry('Keys'), entry('Click', 'click_track'), entry('Idea', 'guide_track'), entry('Video', 'video_submission')];
  for (const list of [files, [...files].reverse()]) assert.deepEqual(originalStartingMaterial(list), { sourceType: 'final_eligible_stem', hasInitialStem: true });
  assert.deepEqual(originalStartingMaterial([entry('Click', 'click_track')]), { sourceType: 'none', hasInitialStem: false });
  assert.deepEqual(originalStartingMaterial([entry('Video', 'video_submission'), entry('Idea', 'guide_track')]), { sourceType: 'guide_track', hasInitialStem: true });
});

test('validates the per-file size and final-stem confirmation without applying the take submission file limit', () => {
  const five = Array.from({ length: 5 }, (_, i) => entry(`Stem${i}`));
  assert.equal(originalStartingFilesError(five, true), '');
  assert.match(originalStartingFilesError(five, false), /Confirm/);
  assert.match(originalStartingFilesError([{ id: 'large', file: { name: 'Large.wav', size: 101 * 1024 * 1024 } }], true), /Large.wav.*100 MB/);
});

test('each starting file preserves its type and AI declaration, then moderation follows all files and the voice note', async () => {
  const calls = [], progress = {};
  const files = [entry('Drums', 'initial_stem', true), entry('Keys'), entry('Click', 'click_track'), entry('Idea', 'guide_track')];
  const request = async config => { calls.push(config); return config.url === '/projects' ? { data: { project: { _id: 'project' } } } : { data: { asset: { _id: `asset-${calls.length}` } } }; };
  await submitOriginalStartingProject({ request, payload, files, voiceNote: file('Explanation.webm', 'audio/webm'), progress });
  assert.deepEqual(calls.map(call => call.url), ['/projects', ...Array(5).fill('/projects/project/assets'), '/projects/project/submit-for-moderation']);
  assert.deepEqual(calls.slice(1, 6).map(call => call.data.get('kind')), ['initial_stem', 'initial_stem', 'click_track', 'guide_track', 'voice_note']);
  assert.equal(calls[1].data.get('createdEntirelyWithAi'), 'true'); assert.equal(calls[2].data.get('createdEntirelyWithAi'), 'false');
  assert.equal(calls[4].data.has('createdEntirelyWithAi'), false); assert.equal(calls[4].data.has('finalStemConfirmed'), false);
  assert.equal(calls[1].data.get('finalStemConfirmed'), 'true'); assert.equal(progress.submitted, true);
});

test('an interrupted batch resumes the same draft, keeping confirmed files and withholding moderation until complete', async () => {
  const calls = [], progress = {}, files = [entry('Drums'), entry('Keys')];
  let fail = true;
  const request = async config => {
    calls.push({ method: config.method, url: config.url, file: config.data instanceof FormData ? config.data.get('file').name : null });
    if (config.url === '/projects') return { data: { project: { _id: 'saved' } } };
    if (config.data instanceof FormData && config.data.get('file').name === 'Keys.wav' && fail) throw new Error('Upload interrupted');
    return { data: { asset: { _id: `asset-${calls.length}` } } };
  };
  await assert.rejects(submitOriginalStartingProject({ request, payload, files, progress }), /interrupted/);
  assert.equal(progress.projectId, 'saved'); assert.ok(progress.uploaded.Drums); assert.equal(progress.uploaded.Keys, undefined);
  assert.equal(calls.some(call => call.url.endsWith('submit-for-moderation')), false);
  fail = false; await submitOriginalStartingProject({ request, payload, files, progress });
  assert.equal(calls.filter(call => call.url === '/projects').length, 1);
  assert.equal(calls.filter(call => call.file === 'Drums.wav').length, 1);
  assert.equal(calls.filter(call => call.url.endsWith('submit-for-moderation')).length, 1);
});

test('a moderation failure retries only the final step and does not upload the stems again', async () => {
  const progress = {}, files = [entry('Drums')], calls = [];
  let fail = true;
  const request = async config => {
    calls.push(config.url);
    if (config.url === '/projects') return { data: { project: { _id: 'saved' } } };
    if (config.url.endsWith('/submit-for-moderation') && fail) throw new Error('Review service unavailable');
    return { data: { asset: { _id: 'asset' } } };
  };
  await assert.rejects(submitOriginalStartingProject({ request, payload, files, progress }), /unavailable/);
  fail = false; await submitOriginalStartingProject({ request, payload, files, progress });
  assert.equal(calls.filter(url => url.endsWith('/assets')).length, 1); assert.equal(progress.submitted, true);
});
