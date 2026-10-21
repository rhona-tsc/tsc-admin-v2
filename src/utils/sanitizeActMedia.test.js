import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeActMedia } from './sanitizeActMedia.js';
test('draft and submission media retain separate crop coordinates', () => {
  const crop = { x: 0, y: 20, width: 900, height: 600 };
  assert.deepEqual(sanitizeActMedia([{ url: 'photo.jpg', title: 'Band', locationCrop: crop }]), [{ url: 'photo.jpg', title: 'Band', locationCrop: crop }]);
  assert.deepEqual(sanitizeActMedia([{ url: 'photo.jpg', locationCrop: null }]), [{ url: 'photo.jpg', title: '' }]);
  assert.deepEqual(sanitizeActMedia(['photo.jpg', null, {}]), [{ url: 'photo.jpg', title: '' }]);
});
