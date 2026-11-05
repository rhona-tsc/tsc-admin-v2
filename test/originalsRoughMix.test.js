import test from 'node:test';
import assert from 'node:assert/strict';
import { originalAudibleTracks, originalMixRanges, encodeOriginalMixWav, makeOriginalRoughMix, originalRoughMixName } from '../src/utils/originalsRoughMix.js';
import { originalSubmissionPairsReady, originalSubmissionTakes } from '../src/utils/originalsSubmission.js';
import { originalRecordingTracks } from '../src/utils/originalsListening.js';

test('the rendered mix follows inclusion, solo and level settings',()=>{
 const tracks=[{_id:'a'},{_id:'b'},{_id:'c'}];
 assert.deepEqual(originalAudibleTracks(tracks,{a:{solo:true,volume:0.5},b:{muted:true},c:{volume:0.2}}).map(track=>[track._id,track.volume]),[['a',0.5]]);
 assert.equal(originalAudibleTracks(tracks,{a:{muted:true},b:{muted:true},c:{volume:0}}).length,0);
});
test('partial approvals retain timeline positions and overlapping ranges are not added twice',()=>{
 assert.deepEqual(originalMixRanges({playbackRanges:[{startSeconds:0.5,endSeconds:1.5},{startSeconds:1,endSeconds:2},{startSeconds:3,endSeconds:4}]},35,10),[[5,20],[30,35]]);
});
test('WAV preserves stereo, silence and length, reducing peaks together to avoid clipping',()=>{
 const encoded=encodeOriginalMixWav([new Float32Array([0,0.25,2]),new Float32Array([0,-0.25,1])],44100),v=new DataView(encoded.buffer);
 assert.equal(new TextDecoder().decode(encoded.buffer.slice(0,4)),'RIFF');assert.equal(v.getUint16(22,true),2);assert.equal(v.getUint32(24,true),44100);assert.equal(v.getUint16(34,true),16);assert.equal(v.getUint32(40,true),12);
 assert.equal(v.getInt16(44,true),0);assert.equal(v.getInt16(46,true),0);assert.ok(Math.abs(v.getInt16(52,true)-32112)<2);assert.ok(Math.abs(v.getInt16(54,true)-16056)<2);assert.equal(encoded.peakAdjusted,true);
});
test('rough mix decodes sources sequentially, sums at zero and applies only approved sections',async t=>{
 let decodes=0;
 class Decoder {async decodeAudioData(bytes){decodes++;const data=new Float32Array(bytes);return {duration:data.length/44100,length:data.length,numberOfChannels:1,getChannelData:()=>data};}}
 const previous=globalThis.OfflineAudioContext;globalThis.OfflineAudioContext=Decoder;t.after(()=>{if(previous===undefined)delete globalThis.OfflineAudioContext;else globalThis.OfflineAudioContext=previous;});
 const sources={a:new Float32Array([0,0.2,0.2,0.2]),b:new Float32Array([0.5,0.5,0.5,0.5])};
 const result=await makeOriginalRoughMix({tracks:[{_id:'a'},{_id:'b',volume:0.5,playbackRanges:[{startSeconds:2/44100,endSeconds:4/44100}]}],loadAudio:async track=>sources[track._id].buffer});
 const wav=new DataView(await result.blob.arrayBuffer());assert.equal(decodes,2);assert.equal(wav.getUint32(40,true),16);assert.equal(wav.getInt16(44,true),0);assert.ok(Math.abs(wav.getInt16(52,true)-14745)<2);assert.equal(result.peakAdjusted,false);
});
test('abort and decode failures produce no downloadable result',async t=>{
 const previous=globalThis.OfflineAudioContext;globalThis.OfflineAudioContext=class{async decodeAudioData(){throw new Error('bad codec');}};t.after(()=>{if(previous===undefined)delete globalThis.OfflineAudioContext;else globalThis.OfflineAudioContext=previous;});
 await assert.rejects(makeOriginalRoughMix({tracks:[{_id:'bad',originalName:'Broken.aiff'}],loadAudio:async()=>new ArrayBuffer(1)}),/WAV or MP3/);
 const controller=new AbortController();controller.abort();await assert.rejects(makeOriginalRoughMix({tracks:[{_id:'a'}],signal:controller.signal,loadAudio:()=>assert.fail('no fetch after cancellation')}),error=>error.name==='AbortError');
 assert.equal(originalRoughMixName('../Project/ <test>'),'Project test - rough recording mix.wav');
});
test('stems no longer need uploaded mixes, while optional pairs remain distinct and validated',()=>{
 const assets=[{_id:'a',kind:'take_stem',state:'active',reservationId:'r'},{_id:'b',kind:'take_stem',state:'active',reservationId:'r'}],submission={reservationId:'r',stemAssetIds:['a','b'],mixdownAssetIds:{}};
 assert.equal(originalSubmissionPairsReady(submission,assets),true);assert.deepEqual(originalSubmissionTakes(submission,assets).map(take=>take.mixdownAssetId),[null,null]);
 assert.equal(originalSubmissionPairsReady({...submission,mixdownAssetIds:{a:'invalid'}},assets),false);
});
test('one approved stem is available as a project backing track without using unapproved alternatives',()=>{
 const assets=[{_id:'a',kind:'take_stem',state:'active'},{_id:'b',kind:'take_stem',state:'active'}];
 const result=originalRecordingTracks({assets,submissions:[{category:'contribution',state:'accepted',roleName:'Click',selectionMode:'whole_take',selectedTakeId:'t',takes:[{_id:'t',stemAssetId:'a'}]}]});
 assert.deepEqual(result.map(track=>track._id),['a']);
});
