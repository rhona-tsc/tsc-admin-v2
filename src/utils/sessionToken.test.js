import test from 'node:test';
import assert from 'node:assert/strict';
import { activeSessionToken, storedSessionToken } from './sessionToken.js';
const now = 1795262400000;
const token = payload => `e30.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
test('expired or malformed saved logins cannot redirect the sign-in page back to preferences', () => {
  for (const value of ['', 'not-a-token', token({ id: 'user', exp: now / 1000 }), token({ id: 'user', exp: now / 1000 - 1 }), token({ id: 'user', exp: 'later' }), token({ id: 'user', nbf: now / 1000 + 60 })]) assert.equal(activeSessionToken(value, now), '');
});
test('active and legacy account logins work, while email preference links never become logins', () => {
  for (const identity of [{ id: 'user' }, { _id: 'user' }, { userId: 'user' }]) {
    const value = token({ ...identity, exp: now / 1000 + 60 });
    assert.equal(activeSessionToken(value, now), value);
    const legacy = token(identity); assert.equal(activeSessionToken(legacy, now), legacy);
  }
  assert.equal(activeSessionToken(token({ purpose: 'musician_email_preferences', emailHash: 'hash' }), now), '');
  assert.equal(activeSessionToken(token({}), now), '');
});
test('discarding an expired login leaves other saved account details untouched', () => {
  const values = new Map([['token', token({ id: 'user', exp: 1 })], ['userEmail', 'person@example.test']]);
  const storage = { getItem: key => values.get(key), removeItem: key => values.delete(key) };
  assert.equal(storedSessionToken(storage), ''); assert.equal(values.has('token'), false); assert.equal(values.get('userEmail'), 'person@example.test');
});
