import test from 'node:test';
import assert from 'node:assert/strict';
import { loginPathFor, loginReturnPath, safeLoginReturnPath } from './loginReturnPath.js';
import { canAccessOriginalsPreview } from './originalsAccess.js';

test('project email destination survives login, refresh and the already-signed-in guard', () => {
  const target = '/originals/project123?round=foundation#reserve';
  const login = loginPathFor({ pathname: '/originals/project123', search: '?round=foundation', hash: '#reserve' });
  assert.equal(loginReturnPath({ search: login.slice('/login'.length) }), target);
  assert.equal(loginReturnPath({ state: { from: target } }), target);
  assert.equal(loginReturnPath({}), '/musicians-dashboard');
});
test('login return targets cannot redirect off site or loop back to login', () => {
  for (const input of ['https://example.test', '//example.test', '/\\example.test', '/login?next=/originals/a', '/security', '/moderate', '/list']) assert.equal(safeLoginReturnPath(input), '/musicians-dashboard');
});
test('Rhona personal account has Originals preview access without opening it to other accounts', () => {
  assert.equal(canAccessOriginalsPreview({ email: ' RHONAGDOWNIE@GMAIL.COM ' }), true);
  assert.equal(canAccessOriginalsPreview({ email: 'someoneelse@gmail.com' }), false);
});
