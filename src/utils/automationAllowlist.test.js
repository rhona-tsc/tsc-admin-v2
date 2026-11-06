import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedAutomationRecipient } from './automationAllowlist.js';
const policy = {emails:['sue_young1576@hotmail.com'],bookingRefs:['UUZfW']};
test('email and booking reference must both be allowed',()=>{
  assert.equal(allowedAutomationRecipient({clientEmail:'sue_young1576@hotmail.com',bookingRef:'UUZfW'},policy),'sue_young1576@hotmail.com');
  assert.equal(allowedAutomationRecipient({clientEmail:'other@example.test',bookingRef:'UUZfW'},policy),'');
  assert.equal(allowedAutomationRecipient({clientEmail:'sue_young1576@hotmail.com',bookingRef:'OTHER'},policy),'');
  assert.equal(allowedAutomationRecipient({clientEmail:'sue_young1576@hotmail.com',bookingRef:'UUZFW'},policy),'');
});
test('allowed alternate contacts are recognised and the actual recipient is returned',()=>{
  const row={clientEmail:'not-allowed@example.test',clientEmails:[{email:' SUE_YOUNG1576@HOTMAIL.COM '}],bookingId:'UUZfW'};
  assert.equal(allowedAutomationRecipient(row,policy),'sue_young1576@hotmail.com');
  assert.equal(row.clientEmail,'not-allowed@example.test');
});
test('loading, failed, malformed and empty email policies never show all clients',()=>{
  const row={clientEmail:'sue_young1576@hotmail.com',bookingRef:'UUZfW'};
  for(const allowlist of [null,undefined,{}, {emails:policy.emails}, {emails:[],bookingRefs:policy.bookingRefs}]) {
    assert.equal(allowedAutomationRecipient(row,allowlist),'');
  }
});
test('an unrestricted reference policy still requires an approved email, matching the sender',()=>{
  assert.equal(allowedAutomationRecipient({clientEmail:'sue_young1576@hotmail.com',bookingRef:'ANY'},{...policy,bookingRefs:[]}),'sue_young1576@hotmail.com');
  assert.equal(allowedAutomationRecipient({clientEmail:'other@example.test',bookingRef:'ANY'},{...policy,bookingRefs:[]}),'');
});
