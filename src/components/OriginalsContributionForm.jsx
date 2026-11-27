import OriginalsRevisionControls from './OriginalsRevisionControls';
import React, { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { originalsRequest } from '../utils/originalsApi';
import { originalStemSubmission } from '../utils/originalsSubmission';
import { formatOriginalsDeadline } from '../utils/originalsDeadlines';
import OriginalsRecordingGuide from './OriginalsRecordingGuide';
import OriginalsAiDeclaration from './OriginalsAiDeclaration';
import OriginalsFilesPlayback from './OriginalsFilesPlayback';
import { EmbeddedReference } from './OriginalsProjectListening';
import SectionLink from './OriginalsSectionLink';

const heading = 'text-sm font-bold uppercase tracking-wide text-slate-800';
const idOf = value => String(value?._id || value || '');

function ReferenceUpload({ token, projectId, roundId, roles = [], temporaryAllowed = false, disabled, onBusyChange, onRefresh }) {
  const input = useRef(null);
  const [finalConfirmed, setFinalConfirmed] = useState(false);
  const [replacementRoleName, setReplacementRoleName] = useState('');
  const [songwritingClaim, setSongwritingClaim] = useState('');
  const [kind, setKind] = useState('demo'), [file, setFile] = useState(null), [ai, setAi] = useState(false), [error, setError] = useState('');
  const asksSongwriting = ['initial_stem', 'temporary_stem', 'guide_track', 'demo', 'video_submission'].includes(kind);
  const upload = async () => {
    if (!file || disabled || (asksSongwriting && songwritingClaim === '') || (kind === 'initial_stem' && !finalConfirmed) || (kind === 'temporary_stem' && !replacementRoleName)) return;
    setError(''); onBusyChange(true);
    try {
      const body = new FormData(); body.append('file', file); body.append('kind', kind);
      if (asksSongwriting) body.append('songwritingClaim', songwritingClaim);
      if (kind === 'initial_stem') body.append('finalStemConfirmed', 'true');
      if (kind === 'temporary_stem') body.append('replacementRoleName', replacementRoleName);
      if (roundId) body.append('roundId', roundId);
      if (['initial_stem', 'temporary_stem', 'click_track'].includes(kind)) body.append('createdEntirelyWithAi', String(ai));
      await originalsRequest(token, { method: 'post', url: `/projects/${projectId}/assets`, data: body });
      setFile(null); setAi(false); setFinalConfirmed(false); setSongwritingClaim(''); if (input.current) input.current.value = '';
      await onRefresh(); toast.success('Project reference uploaded');
    } catch (failure) { setError(failure.response?.data?.message || 'Could not upload the project reference.'); }
    finally { onBusyChange(false); }
  };
  return <details className="mt-4 rounded-lg border p-3"><summary className="cursor-pointer text-sm font-semibold">Owner tools: add a project reference</summary>
    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
      <label className="text-sm">Reference type<select aria-label="Project reference type" value={kind} disabled={disabled} onChange={event => { setKind(event.target.value); setAi(false); setFinalConfirmed(false); setSongwritingClaim(''); }} className="mt-1 w-full rounded border p-2">{[['demo', 'Idea / demo — reference only'], ['guide_track', 'Guide — reference only'], ['video_submission', 'Video — reference only'], ['click_track', 'Click — recording aid only'], ['initial_stem', 'Stem intended for the final production'], ...(temporaryAllowed ? [['temporary_stem', 'Temporary production stem — replace before completion']] : [])].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="min-w-0 text-sm">Choose reference file<input ref={input} type="file" disabled={disabled} accept="audio/*,video/mp4,video/quicktime,.wav,.aiff,.flac,.m4a,.mov" onChange={event => { setFile(event.target.files?.[0] || null); setAi(false); setFinalConfirmed(false); setSongwritingClaim(''); }} className="mt-1 w-full min-w-0 max-w-full rounded border p-2" /></label>
      <button type="button" disabled={disabled || !file || (asksSongwriting && songwritingClaim === '') || (kind === 'initial_stem' && !finalConfirmed) || (kind === 'temporary_stem' && !replacementRoleName)} onClick={upload} className="self-end rounded border px-3 py-2 text-sm font-semibold disabled:opacity-40">Upload reference</button>
    </div>
    {kind === 'initial_stem' ? <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" checked={finalConfirmed} disabled={disabled} onChange={event => setFinalConfirmed(event.target.checked)} />This is a musical part intended for the final production, not an idea, demo or guide.</label> : <p className="mt-3 text-xs text-amber-800">{kind === 'temporary_stem' ? 'Included in working mixes until its replacement is approved. It cannot be used in the final production.' : kind === 'click_track' ? 'The click is an optional recording aid and is not part of the final production.' : 'Reference only — listen separately; excluded from mix downloads and the final production.'}</p>}
    {kind === 'temporary_stem' && <label className="mt-3 block text-sm">Replace when this role is approved<select required disabled={disabled} value={replacementRoleName} onChange={event => setReplacementRoleName(event.target.value)} className="mt-1 w-full rounded border p-2"><option value="">Choose replacement role</option>{roles.map(role => <option key={role.name}>{role.name}</option>)}</select></label>}
    {file && ['initial_stem', 'temporary_stem', 'click_track'].includes(kind) && <OriginalsAiDeclaration checked={ai} onChange={setAi} disabled={disabled} />}
    {file && asksSongwriting && <label className="mt-3 block text-sm font-semibold">Request songwriting credit for the project owner for the composition demonstrated in this file?<select required value={songwritingClaim} disabled={disabled} onChange={event => setSongwritingClaim(event.target.value)} className="mt-1 block w-full rounded border p-2 font-normal"><option value="">Choose Yes or No</option><option value="true">Yes — request songwriting credit</option><option value="false">No — no songwriting claim for this file</option></select><span className="mt-1 block text-xs font-normal text-gray-600">This records a claim for review, not an agreed split. Choosing No does not withdraw an existing project claim. Answer again for each new or replacement file.</span></label>}
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
  </details>;
}

// One form owns the current reservation, its uploads and the final submission.
// The reservation is supplied by the workspace; future holds are never offered.
export default function OriginalsContributionForm({ token, project, currentRound, reservation, assets = [], submissions = [], viewerId, submittedReservation, latestReservation, canManage = false, readOnly = false, busy = false, onBusyChange, onRefresh, onReviewAssets }) {
  const isProduction = ['mix', 'master'].includes(currentRound?.type);
  const kind = isProduction ? currentRound.type : 'take_stem';
  const role = reservation?.roleName || submittedReservation?.roleName || currentRound?.roleName || '';
  const reservationExpired = latestReservation && ['active', 'expired'].includes(latestReservation.state) && new Date(latestReservation.expiresAt) <= new Date();

  const [deletedIds, setDeletedIds] = useState([]);
  const visibleAssets = assets.filter(asset => asset.state !== 'deleted' && !deletedIds.includes(idOf(asset._id)));
  const available = reservation ? visibleAssets.filter(asset => asset.state === 'active' && asset.kind === kind && idOf(asset.ownerId) === idOf(viewerId) && idOf(asset.reservationId) === idOf(reservation._id)) : [];
  const submitted = submissions.find(item => idOf(item.musicianId) === idOf(viewerId) && idOf(item.roundId) === idOf(currentRound?._id) && item.state === 'submitted');
  const editing = submitted?.revisionSession?.status === 'editing';
  const unavailableMessage = submitted ? `Your ${submitted.roleName} recording has been submitted for review. Use the revision controls below if you need to correct it.`
    : reservationExpired ? `Your ${latestReservation.roleName} recording reservation ended ${formatOriginalsDeadline(latestReservation.expiresAt)}. Your uploaded files are kept below. Reserve an available place in the current round to upload and submit a new take.`
      : 'Reserve a place in the current round to upload and submit your recording. Future places activate when their round opens.';
  const submittedIds = new Set(submitted ? [submitted, ...(submitted.previousVersions || [])].flatMap(version => [version.outputAssetId, ...(version.takes || []).flatMap(take => [...(take.stemAssetIds || [take.stemAssetId]), take.mixdownAssetId, take.wetStemAssetId])].filter(Boolean).map(idOf)) : []);
  const input = useRef(null);
  const [files, setFiles] = useState([]), [ai, setAi] = useState(false), [working, setWorking] = useState(''), [error, setError] = useState('');
  const [grouped, setGrouped] = useState(() => submitted ? submitted.takes?.some(take => take.groupedContribution) === true : true);
  const [mixFile, setMixFile] = useState(null);
  const mixes = reservation ? visibleAssets.filter(asset => asset.state === 'active' && asset.kind === 'take_mixdown' && idOf(asset.ownerId) === idOf(viewerId) && idOf(asset.reservationId) === idOf(reservation._id)) : [];
  const [listeningMixId, setListeningMixId] = useState(() => idOf(submitted?.takes?.find(take => take.mixdownAssetId)?.mixdownAssetId || mixes.at(-1)?._id));
  const limit = isProduction ? 1 : grouped ? 24 : 4;
  const [selected, setSelected] = useState(() => available.slice(0, limit).map(asset => idOf(asset._id)));
  const [effects, setEffects] = useState(() => Object.fromEntries((submitted?.takes || []).map(take => [idOf(take.stemAssetId), take.effects === 'with_effects' ? 'with_effects' : 'without_effects']))), [songwriting, setSongwriting] = useState(submitted?.songwritingChoice === 'songwriting_claim'), [notes, setNotes] = useState(submitted?.notes || '');
  const disabled = busy || Boolean(working) || readOnly;
  const draft = { reservationId: idOf(reservation?._id), stemAssetIds: selected, effectsByAssetId: effects, groupedContribution: grouped, listeningMixId };
  const stemSubmission = originalStemSubmission(draft, visibleAssets);
  const productionReady = selected.length === 1 && available.some(asset => idOf(asset._id) === selected[0]);
  const pendingAlignment = available.filter(asset => selected.includes(idOf(asset._id)) && asset.alignmentReviewRequired && !asset.alignmentReview?.reviewedAt);
  const otherFiles = visibleAssets.filter(asset => !available.some(own => idOf(own._id) === idOf(asset._id)));
  const setWorkingState = value => { setWorking(value); onBusyChange(Boolean(value)); };

  const upload = async () => {
    if (!files.length || disabled || !reservation) return;
    if (files.length > limit || (!isProduction && selected.length + files.length > limit)) { setError(`Choose up to ${limit} tracks in total. Deselect earlier uploads if replacing them.`); return; }
    setError(''); setWorkingState('upload');
    const uploaded = [];
    try {
      for (const file of files) {
        const body = new FormData(); body.append('file', file); body.append('kind', kind);
        body.append('roundId', currentRound._id); body.append('reservationId', reservation._id);
        if (!isProduction) body.append('createdEntirelyWithAi', String(ai));
        const { data } = await originalsRequest(token, { method: 'post', url: `/projects/${project._id}/assets`, data: body });
        uploaded.push(idOf(data.asset._id));
        setSelected(value => isProduction ? [idOf(data.asset._id)] : [...new Set([...value, idOf(data.asset._id)])]);
        setFiles(value => value.filter(item => item !== file));
      }
      setAi(false);
    } catch (failure) { setError(failure.response?.data?.message || 'The upload did not finish. Your uploaded files are kept; try the remaining files again.'); }
    finally {
      if (input.current) input.current.value = '';
      try { if (uploaded.length) { await onRefresh(); if (!isProduction) onReviewAssets(uploaded); } }
      finally { setWorkingState(''); }
    }
  };

  const uploadMix = async () => {
    if (!mixFile || disabled || !reservation) return;
    setError(''); setWorkingState('mix-upload');
    try {
      const Offline = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
      if (!Offline) throw new Error('Please use a current browser to check your stereo mix.');
      const decoded = await new Offline(2, 1, 44100).decodeAudioData(await mixFile.arrayBuffer());
      if (decoded.numberOfChannels !== 2) throw new Error('Export the listening mix as a stereo (two-channel) audio file.');
      const body = new FormData(); body.append('file', mixFile); body.append('kind', 'take_mixdown');
      body.append('roundId', currentRound._id); body.append('reservationId', reservation._id);
      const { data } = await originalsRequest(token, { method: 'post', url: `/projects/${project._id}/assets`, data: body });
      setListeningMixId(idOf(data.asset._id)); setMixFile(null); await onRefresh();
    } catch (failure) { setError(failure.response?.data?.message || failure.message || 'Could not upload the listening mix.'); }
    finally { setWorkingState(''); }
  };

  const submit = async () => {
    if (disabled || !reservation) return;
    if (isProduction ? !productionReady : !stemSubmission.ready) return;
    if (!isProduction) {
      const pending = available.filter(asset => selected.includes(idOf(asset._id)) && asset.alignmentReviewRequired && !asset.alignmentReview?.reviewedAt);
      if (pending.length) { onReviewAssets(pending.map(asset => idOf(asset._id))); return; }
    }
    setError(''); setWorkingState('submit');
    try {
      await originalsRequest(token, { method: 'post', url: `/reservations/${reservation._id}/${isProduction ? 'production-submissions' : 'submissions'}`, data: isProduction
        ? { outputAssetId: selected[0], notes }
        : { takes: stemSubmission.takes, songwritingChoice: songwriting ? 'songwriting_claim' : 'master_only', notes } });
      toast.success(isProduction ? `${currentRound.type === 'mix' ? 'Mix' : 'Master'} submitted for review` : 'Take submitted for review');
      await onRefresh();
    } catch (failure) {
      setError(failure.response?.data?.message || 'Could not submit your recording. Your uploaded files and choices are kept.');
      if (failure.response?.data?.code === 'ORIGINALS_ALIGNMENT_REVIEW_REQUIRED') onReviewAssets([failure.response.data.assetId]);
    } finally { setWorkingState(''); }
  };

  const deleteUpload = async assetId => {
    if (disabled || !reservation || (submitted && !editing) || submittedIds.has(assetId)) return;
    setError(''); setWorkingState(`delete:${assetId}`);
    try {
      await originalsRequest(token, { method: 'delete', url: `/assets/${assetId}` });
      setDeletedIds(value => [...value, assetId]);
      setSelected(value => value.filter(id => id !== assetId));
      setEffects(value => { const next = { ...value }; delete next[assetId]; return next; });
      toast.success('Uploaded recording deleted');
      try { await onRefresh(); }
      catch { setError('Recording deleted. Refresh the page to update the project files.'); }
    } catch (failure) { setError(failure.response?.data?.message || 'Could not delete the recording. Your file and choices are kept; please try again.'); }
    finally { setWorkingState(''); }
  };

  const toggle = (assetId, include) => setSelected(value => isProduction ? [assetId] : include ? [...value, assetId].slice(0, limit) : value.filter(id => id !== assetId));
  return <section id="submit-take" tabIndex={-1} className="scroll-mt-6 mt-4 min-w-0 rounded-xl border bg-white p-4 sm:p-5">
    <span id="project-files" tabIndex={-1} className="scroll-mt-6" />
    <h2 className={heading}>{`${editing ? 'Revise & resubmit your' : 'Upload & submit your'} ${isProduction ? currentRound.type : 'take'}${!isProduction && role ? ` — ${role}` : ''}`}</h2>
    {!reservation && <p id="recording-availability" role="status" className={`mt-3 rounded p-3 text-sm ${submitted ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-50 text-gray-600'}`}>{unavailableMessage}</p>}
    {submitted && <OriginalsRevisionControls token={token} submission={submitted} reservation={reservation || submittedReservation} currentRoundId={currentRound?._id} disabled={disabled} onBusyChange={onBusyChange} onRefresh={onRefresh} />}
    <>
      <OriginalsRecordingGuide productionType={isProduction ? currentRound.type : ''} />
      <p className="mt-4 text-sm text-gray-600">{isProduction ? `Upload your finished ${currentRound.type}, listen back, then send it for review.` : 'Upload up to 24 separate tracks as one contribution, plus a stereo mix of your part for listening. Keep the same zero/start point for every file. One accepted role contribution earns one royalty allocation, regardless of track count.'}</p>
      {!isProduction && <label className="mt-3 block text-sm font-semibold">Submission format<select value={grouped ? 'group' : 'alternatives'} disabled={disabled || !reservation} onChange={event => { const group = event.target.value === 'group'; setGrouped(group); setSelected(value => value.slice(0, group ? 24 : 4)); }} className="mt-1 block w-full rounded border p-2"><option value="group">One contribution — up to 24 tracks + stereo listening mix</option><option value="alternatives">Separate alternatives — up to four single-file takes</option></select></label>}
      {reservation && <p className="mt-1 text-xs text-gray-500">Your {role} reservation ends {formatOriginalsDeadline(reservation.expiresAt)}.</p>}
      <div className="mt-4 rounded-lg border bg-slate-50 p-3 sm:p-4">
        <label className="block min-w-0 text-sm font-semibold">{isProduction ? `Upload your ${currentRound.type} output` : role ? `Upload your ${role} stem${files.length > 1 ? 's' : ''}` : 'Upload your stems'}
          <input ref={input} aria-label={isProduction ? `Choose ${currentRound.type} output` : role ? `Choose ${role} stems` : 'Choose stems'} type="file" multiple={!isProduction} aria-describedby={!reservation ? "recording-availability" : undefined} disabled={disabled || !reservation} accept="audio/*,.wav,.aiff,.aif,.flac,.m4a" onChange={event => { setFiles(Array.from(event.target.files || [])); setAi(false); setError(''); }} className="mt-2 block w-full min-w-0 max-w-full rounded border bg-white p-2 text-sm font-normal" />
        </label>
        {!!files.length && <p className="mt-2 break-words text-xs text-gray-600">Ready to upload: {files.map(file => file.name).join(', ')}</p>}
        {!isProduction && !!files.length && <OriginalsAiDeclaration checked={ai} onChange={setAi} disabled={disabled} multiple={files.length > 1} />}
        <button type="button" disabled={disabled || !reservation || !files.length} onClick={upload} className="mt-3 rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{working === 'upload' ? 'Uploading…' : files.length > 1 ? 'Upload stems' : isProduction ? 'Upload output' : 'Upload stem'}</button>
      </div>
      {reservation && <>
      {!!available.length && <div className="mt-4">
        <h3 className="text-sm font-semibold">{isProduction ? 'Your uploaded output' : 'Your stems'}</h3>
        {!isProduction && <p className="mt-1 text-xs text-gray-600">{grouped ? 'Include the separate tracks for one performance, e.g. kick, snare, toms, overheads and room. These stay grouped for approval and are available individually to download. Keep alternative performances out of this group. Include clean/effects details in the filenames or notes.' : 'Include up to four alternative single-file takes. Each can be reviewed and selected separately.'}</p>}
        <div role="table" aria-label="Your uploaded recordings" className="mt-3 overflow-hidden rounded-lg border">
          {!isProduction && !grouped && <div role="row" className="hidden grid-cols-[minmax(0,1fr)_14rem_8rem] gap-3 bg-slate-50 px-3 py-2 text-xs font-semibold text-gray-600 sm:grid"><span role="columnheader">File</span><span role="columnheader">Effects?</span><span role="columnheader">Actions</span></div>}
          {available.map(asset => {
            const assetId = idOf(asset._id), included = selected.includes(assetId), reviewed = Boolean(asset.alignmentReview?.reviewedAt);
            return <div role="row" key={assetId} className={`grid min-w-0 gap-3 border-t p-3 first:border-t-0 ${isProduction ? '' : grouped ? 'sm:grid-cols-[minmax(0,1fr)_8rem] sm:items-center' : 'sm:grid-cols-[minmax(0,1fr)_14rem_8rem] sm:items-center'}`}>
              <div role="cell" className="min-w-0"><label className="flex items-start gap-2 text-sm"><input type={isProduction ? 'radio' : 'checkbox'} name="output-to-submit" aria-label={`Include ${asset.originalName}`} checked={included} disabled={disabled || (!included && !isProduction && selected.length >= limit)} onChange={event => toggle(assetId, event.target.checked)} className="mt-1 shrink-0" /><span className="min-w-0 break-words">{asset.originalName}{submittedIds.has(assetId) && <span className="mt-1 block text-xs text-gray-500">Previously submitted — uncheck to leave out of this revision.</span>}</span></label></div>
              {!isProduction && !grouped && <div role="cell"><fieldset className="min-w-0"><legend className="sr-only">Effects for {asset.originalName}</legend><div className="inline-flex flex-wrap rounded border text-xs">{[['without_effects', 'Without effects'], ['with_effects', 'With effects']].map(([value, label]) => <label key={value} className={`flex cursor-pointer items-center gap-1.5 px-2 py-2 ${((effects[assetId] || 'without_effects') === value) ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'}`}><input type="radio" name={`effects-${assetId}`} value={value} checked={(effects[assetId] || 'without_effects') === value} disabled={disabled} onChange={() => setEffects(current => ({ ...current, [assetId]: value }))} aria-label={`${label}: ${asset.originalName}`} />{label}</label>)}</div></fieldset></div>}
              <div role="cell" className="flex flex-col items-start gap-2">{isProduction ? <details className="text-sm"><summary className="cursor-pointer underline">Listen to your output</summary><EmbeddedReference token={token} asset={asset} hideName /></details> : <>{reviewed && <span className="text-xs font-medium text-emerald-700">Alignment checked ✓</span>}<button type="button" disabled={disabled} onClick={() => onReviewAssets([assetId])} className="text-left text-xs font-medium text-slate-700 underline">{reviewed ? 'Listen with project' : 'Check alignment'}</button></>}{(!submitted || editing) && !submittedIds.has(assetId) && <button type="button" aria-label={`Delete ${asset.originalName}`} disabled={disabled} onClick={() => deleteUpload(assetId)} className="min-h-9 text-xs font-medium text-red-700 underline disabled:opacity-40">{working === `delete:${assetId}` ? 'Deleting…' : 'Delete'}</button>}</div>
            </div>;
          })}
        </div>
      </div>}
      {!isProduction && grouped && <section className="mt-4 rounded-lg border p-3"><h3 className="text-sm font-semibold">Stereo listening mix — your part only</h3><p className="mt-1 text-xs text-gray-600">Mix the selected tracks together in your recording software. Exclude the guide, other musicians and click. Export stereo from the same start point, including opening silence and the full ending. This mix is used for listening; your separate tracks remain available for production.</p><input aria-label="Choose stereo listening mix" type="file" disabled={disabled} accept="audio/*,.wav,.aiff,.aif,.flac,.m4a" onChange={event => setMixFile(event.target.files?.[0] || null)} className="mt-3 block w-full text-sm" /><button type="button" disabled={disabled || !mixFile} onClick={uploadMix} className="mt-2 rounded border px-3 py-2 text-sm">{working === 'mix-upload' ? 'Checking & uploading…' : 'Upload stereo listening mix'}</button><label className="mt-3 block text-sm">Listening mix for this contribution<select aria-label="Listening mix for this contribution" value={listeningMixId} disabled={disabled} onChange={event => setListeningMixId(event.target.value)} className="mt-1 block w-full rounded border p-2"><option value="">Choose an uploaded mix</option>{mixes.map(asset => <option key={asset._id} value={idOf(asset._id)}>{asset.originalName}</option>)}</select></label>{mixes.find(asset => idOf(asset._id) === listeningMixId) && <EmbeddedReference token={token} asset={mixes.find(asset => idOf(asset._id) === listeningMixId)} showDownload />}</section>}
      {!isProduction && <fieldset className="mt-4 rounded-lg border p-3 text-sm"><legend className="px-1 font-semibold">Royalties if your take is accepted</legend><p className="text-xs text-gray-600">Master royalties are included for accepted recordings. <SectionLink to="project-royalties">View the royalty split</SectionLink>.</p><label className="mt-3 flex items-start gap-2"><input type="checkbox" checked={songwriting} disabled={disabled} onChange={event => setSongwriting(event.target.checked)} className="mt-1" /><span>Also request songwriting credit</span></label></fieldset>}
      <label className="mt-4 block text-sm font-medium">Notes for the project owner (optional)<textarea value={notes} disabled={disabled} onChange={event => setNotes(event.target.value)} className="mt-1 w-full rounded border px-3 py-2 font-normal" rows={2} /></label>
      <p id="take-submission-status" role="status" className="mt-3 text-sm text-gray-600">{isProduction ? productionReady ? 'Your output is ready to submit.' : 'Upload your finished output to continue.' : stemSubmission.message || (pendingAlignment.length ? `Check alignment for ${pendingAlignment.length} stem${pendingAlignment.length === 1 ? '' : 's'} before submitting.` : `${selected.length} stem${selected.length === 1 ? '' : 's'} included. Ready to send for review.`)}</p>
      </>}
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      <button type="button" aria-describedby={reservation ? "take-submission-status" : "recording-availability"} disabled={disabled || !reservation || (isProduction ? !productionReady : !stemSubmission.ready)} onClick={submit} className="mt-3 rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{working === 'submit' ? 'Submitting…' : isProduction ? `Submit ${currentRound.type} for review` : editing ? 'Submit revised take for review' : 'Submit take for review'}</button>
      {reservation && !editing && <p className="mt-3 text-xs text-gray-600">Need longer? <SectionLink to="project-extensions">Request an extension</SectionLink> before your reservation expires.</p>}
    </>
    {canManage && <ReferenceUpload token={token} roles={project.requestedRoles || []} temporaryAllowed={['draft', 'changes_requested', 'live', 'foundation_open', 'role_round_open', 'owner_review'].includes(project.state)} projectId={project._id} roundId={currentRound?._id} disabled={disabled} onBusyChange={onBusyChange} onRefresh={onRefresh} />}
    {!!otherFiles.length && <details className="mt-4 rounded-lg border p-3"><summary className="cursor-pointer text-sm font-semibold">Project files{reservation ? ' & earlier uploads' : ''}</summary><OriginalsFilesPlayback token={token} assets={otherFiles} submissions={submissions} viewerId={viewerId} canManage={canManage} /></details>}
  </section>;
}
