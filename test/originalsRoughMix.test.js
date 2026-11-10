import test from 'node:test';
import assert from 'node:assert/strict';
import { originalAudibleTracks, originalMixRanges, encodeOriginalMixWav, makeOriginalRoughMix, originalRoughMixName, originalDownloadTracks } from '../src/utils/originalsRoughMix.js';
import { originalSubmissionPairsReady, originalSubmissionTakes, originalStemSubmission } from '../src/utils/originalsSubmission.js';
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
test('effects labels belong to each submitted file and an effects version needs no clean partner',()=>{
 const assets=[{_id:'wet',kind:'take_stem',state:'active',reservationId:'r',originalName:'Bass FX.wav'},{_id:'clean',kind:'take_stem',state:'active',reservationId:'r',originalName:'Bass clean.wav'}];
 const one=originalStemSubmission({reservationId:'r',stemAssetIds:['wet'],effectsByAssetId:{wet:'with_effects'}},assets);
 assert.equal(one.ready,true);assert.equal(one.takes[0].effects,'with_effects');assert.equal(one.takes[0].wetStemAssetId,undefined);
 const both=originalStemSubmission({reservationId:'r',stemAssetIds:['wet','clean'],effectsByAssetId:{wet:'with_effects',clean:'without_effects'}},assets);
 assert.equal(both.ready,true);assert.deepEqual(both.takes.map(take=>take.effects),['with_effects','without_effects']);
 assert.ok(both.takes.every(take=>take.mixdownAssetId===null));
 assert.equal(originalStemSubmission({reservationId:'other',stemAssetIds:['wet'],effectsByAssetId:{wet:'with_effects'}},assets).ready,false);
});
test('one approved stem is available as a project backing track without using unapproved alternatives',()=>{
 const assets=[{_id:'a',kind:'take_stem',state:'active'},{_id:'b',kind:'take_stem',state:'active'}];
 const result=originalRecordingTracks({assets,submissions:[{category:'contribution',state:'accepted',roleName:'Click',selectionMode:'whole_take',selectedTakeId:'t',takes:[{_id:'t',stemAssetId:'a'}]}]});
 assert.deepEqual(result.map(track=>track._id),['a']);
});

test('reference-only ideas never reach the mix renderer, even when explicitly selected', async t => {
 const previous=globalThis.OfflineAudioContext;
 globalThis.OfflineAudioContext=class {async decodeAudioData(){return {duration:2/44100,length:2,numberOfChannels:1,getChannelData:()=>new Float32Array([0.1,0.1])};}};
 t.after(()=>{if(previous===undefined)delete globalThis.OfflineAudioContext;else globalThis.OfflineAudioContext=previous;});
 const loaded=[];
 const tracks=['guide_track','demo','voice_note','video_submission','chat_attachment','take_mixdown'].map(kind=>({_id:kind,kind}));
 tracks.push({_id:'not-final',kind:'initial_stem',finalEligible:false},{_id:'drums',kind:'take_stem'},{_id:'click',kind:'click_track',finalEligible:false});
 await makeOriginalRoughMix({tracks,loadAudio:async track=>{loaded.push(track._id);return new ArrayBuffer(1);}});
 assert.deepEqual(loaded,['drums','click']);
 await assert.rejects(makeOriginalRoughMix({tracks:[{_id:'idea',kind:'guide_track'}],loadAudio:()=>assert.fail('reference must not be loaded')}),/Select at least one/);
});


test('soloing a reference cannot accidentally export the other stems', () => {
 const tracks=[{_id:'guide',kind:'guide_track'},{_id:'bass',kind:'take_stem'}];
 assert.deepEqual(originalDownloadTracks(tracks,{guide:{solo:true}}),[]);
 assert.deepEqual(originalDownloadTracks(tracks,{bass:{volume:0.3}}).map(track=>[track._id,track.volume]),[['bass',0.3]]);
});
