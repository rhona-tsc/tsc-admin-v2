import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBespokeLineupPatch, lineupSlotsFromRow } from './bookingLineup.js';
test('remove and restore count musician slots rather than instrument names',()=>{
 const original=['Lead Vocal / Guitar','Saxophone','Saxophone','Drums'].map(role=>({role,excluded:false}));
 const crossed=original.map((s,i)=>({...s,excluded:i===1}));
 const patch=buildBespokeLineupPatch(crossed);
 assert.equal(patch.lineupSelected,'Bespoke 3-piece');assert.equal(patch.bandSize,3);
 assert.deepEqual(patch.lineupComposition,['Lead Vocal / Guitar','Saxophone','Drums']);
 assert.equal(lineupSlotsFromRow(JSON.parse(JSON.stringify(patch)))[1].excluded,true);
 assert.equal(buildBespokeLineupPatch(original).bandSize,4);
 assert.deepEqual(Object.keys(patch).filter(k=>/price|fee|gross|accounting/i.test(k)),[]);
});
test('existing presets initialise one slot per member, excluding management',()=>{
 const slots=lineupSlotsFromRow({actsSummary:[{lineup:{bandMembers:[{instrument:'Lead Vocal / Guitar'},{instrument:'Manager'},{instrument:'Drums'}]}}]});
 assert.equal(slots.length,2);assert.equal(buildBespokeLineupPatch(slots).bandSize,2);
});
