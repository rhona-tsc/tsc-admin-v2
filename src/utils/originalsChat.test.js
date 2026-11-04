import test from 'node:test';
import assert from 'node:assert/strict';
import { chatFileError, recordingExtension, recordingTime, CHAT_MAX_BYTES } from './originalsChat.js';
test('chat attachment limits preserve the existing draft and bound message size', () => {
  assert.equal(chatFileError([{ size: CHAT_MAX_BYTES }], 4), '');
  assert.match(chatFileError([{ size: 1 }], 5), /five/);
  assert.match(chatFileError([{ size: CHAT_MAX_BYTES + 1 }]), /10 MB/);
  assert.match(chatFileError([{ size: 0 }]), /Empty/);
});
test('recording filenames and timers support Safari and Chromium audio formats', () => {
  assert.equal(recordingExtension('audio/mp4'), 'm4a');
  assert.equal(recordingExtension('audio/webm'), 'webm');
  assert.equal(recordingExtension('audio/ogg'), 'ogg');
  assert.equal(recordingTime(0), '0:00');
  assert.equal(recordingTime(65), '1:05');
  assert.equal(recordingTime(300), '5:00');
});
