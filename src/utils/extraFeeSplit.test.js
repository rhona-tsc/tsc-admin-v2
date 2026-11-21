import test from 'node:test';
import assert from 'node:assert/strict';
import { balanceExtraFeeSplit } from './extraFeeSplit.js';
test('entering a £50 supplier fee on a £125 mic leaves £75 management',()=>{
 assert.deepEqual(balanceExtraFeeSplit({price:125,quantity:1},'passThroughGross',50),{passThroughGross:50,managementGross:75});
});
test('management edits rebalance the supplier fee using the full line quantity',()=>{
 assert.deepEqual(balanceExtraFeeSplit({price:28,quantity:3},'managementGross',0),{managementGross:0,passThroughGross:84});
});
test('fee edits cannot allocate more than the line total or lose pennies',()=>{
 assert.deepEqual(balanceExtraFeeSplit({price:10.01,quantity:1},'passThroughGross',3.33),{passThroughGross:3.33,managementGross:6.68});
 assert.deepEqual(balanceExtraFeeSplit({price:125},'managementGross',200),{managementGross:125,passThroughGross:0});
});
