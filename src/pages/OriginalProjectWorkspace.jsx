import OriginalsRoleCard from '../components/OriginalsRoleCard';
import OriginalsReviewDeadline from '../components/OriginalsReviewDeadline';
import OriginalsStemReview from '../components/OriginalsStemReview';
import { originalRecordingTracks } from '../utils/originalsListening';
import OriginalsAiDeclaration from "../components/OriginalsAiDeclaration";
import OriginalsDialog from "../components/OriginalsDialog";
import OriginalsMusicianBrowser from "../components/OriginalsMusicianBrowser";
import OriginalsReservationAgreement from "../components/OriginalsReservationAgreement";
import OriginalsFilesPlayback from "../components/OriginalsFilesPlayback";
import OriginalsRoles from "../components/OriginalsRoles";
import OriginalsRecordingGuide from "../components/OriginalsRecordingGuide";
import OriginalsTakePreviews from "../components/OriginalsTakePreviews";
import { originalStemSubmission } from "../utils/originalsSubmission";
import SectionLink from "../components/OriginalsSectionLink";
import { openWorkspaceSection } from "../utils/originalsWorkspace";
import OriginalsProjectChat from "../components/OriginalsProjectChat";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Title from "../components/Title";
import OriginalsLayeredPlayer from "../components/OriginalsLayeredPlayer";
import OriginalsRoyalties from "../components/OriginalsRoyalties";
import OriginalsMasterRoyaltySplit from "../components/OriginalsMasterRoyaltySplit";
import OriginalsProjectListening from "../components/OriginalsProjectListening";
import { originalsRequest } from "../utils/originalsApi";
import { formatOriginalsDeadline } from "../utils/originalsDeadlines";

const heading = "text-sm font-bold uppercase tracking-wide text-slate-800";
const dateTime = (value) => formatOriginalsDeadline(value) || "—";

const OriginalProjectWorkspace = ({ token, canModerate = false }) => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [participantPreview, setParticipantPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [roleName, setRoleName] = useState("");
  const [reservationReview, setReservationReview] = useState(null);
  const [creditName, setCreditName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const uploadInput = React.useRef(null);
  const [upload, setUpload] = useState({ file: null, kind: "demo", reservationId: "", createdEntirelyWithAi: false });
  const [submission, setSubmission] = useState({ reservationId: "", stemAssetIds: [], mixdownAssetIds: {}, wetStemAssetId: "", songwritingChoice: "master_only", notes: "" });
  const [review, setReview] = useState({});
  const [stemReviewId, setStemReviewId] = useState("");
  const [nextRound, setNextRound] = useState({ type: "instrument", roleName: "" });
  const [stagePrompt, setStagePrompt] = useState(null);
  const [stageError, setStageError] = useState("");
  const promptedRounds = React.useRef(new Set());
  const [invitation, setInvitation] = useState({ musicianId: "", roleName: "", message: "" });
  const [inviteLookupOpen, setInviteLookupOpen] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState(null);
  const [production, setProduction] = useState({ reservationId: "", outputAssetId: "", notes: "" });
  const [creditOverrideReason, setCreditOverrideReason] = useState("");
  const [concern, setConcern] = useState({ submissionId: "", category: "creative_direction", reason: "" });
  const [issueReplies, setIssueReplies] = useState({});
  const [replacements, setReplacements] = useState({});
  const [reviewRefreshError, setReviewRefreshError] = useState(false);
  const reviewSnapshot = React.useRef(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const address = new URL(window.location.href);
      const referral = address.searchParams.get("referral");
      if (referral) {
        await originalsRequest(token, { method: "post", url: `/projects/${id}/referrals/claim`, data: { token: referral } });
        address.searchParams.delete("referral");
        window.history.replaceState(window.history.state, "", `${address.pathname}${address.search}${address.hash}`);
      }
      const { data: response } = await originalsRequest(token, { method: "get", url: `/projects/${id}/workspace` });
      setData(response);
      reviewSnapshot.current = response.reviewStatus?.signature ?? null;
    } catch (failure) { setError(failure.response?.data?.message || "Could not load workspace"); }
  }, [id, token]);

  useEffect(() => { load(); }, [load]);
  // Participants whose involvement has ended also lose an already-open workspace, including when chat is collapsed.
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    const verify = async () => {
      if (document.hidden || pending) return;
      pending = true;
      try { await originalsRequest(token, { method: "get", url: `/projects/${id}/access`, signal: controller.signal }); }
      catch (failure) { if (failure.response?.status === 403 || failure.response?.data?.code === "ORIGINALS_PARTICIPATION_ENDED") setError(failure.response.data.message); }
      finally { pending = false; }
    };
    const timer = setInterval(verify, 15000);
    document.addEventListener("visibilitychange", verify);
    return () => { clearInterval(timer); controller.abort(); document.removeEventListener("visibilitychange", verify); };
  }, [id, token]);
  const currentRound = useMemo(() => data?.rounds?.find((round) => String(round._id) === String(data?.project?.currentRoundId)) || data?.rounds?.at(-1), [data]);
  const recordingTracks = useMemo(() => originalRecordingTracks({ assets: data?.assets || [], submissions: data?.submissions || [] }), [data]);
  const isManager = data?.permissions?.canManage === true;
  const canManage = isManager && !participantPreview;
  const remainingRoles = useMemo(() => {
    const approved = new Set((data?.submissions || []).filter(item => item.state === "accepted" && item.category === "contribution").map(item => item.roleName.toLowerCase()));
    return (data?.project?.requestedRoles || []).filter(role => !approved.has(role.name.toLowerCase()));
  }, [data]);
  const nextStageReady = canManage && currentRound && currentRound.type !== "master" && (data?.submissions || []).some(item => item.state === "accepted" && String(item.roundId) === String(currentRound._id));
  const showNextStage = useCallback(() => {
    if (!currentRound) return;
    promptedRounds.current.add(String(currentRound._id));
    setNextRound(data?.recordingPlan?.nextRound || { type: currentRound.type === "mix" ? "master" : remainingRoles.length ? "instrument" : "mix", roleName: remainingRoles[0]?.name || "" });
    setStageError(""); setStagePrompt({ fromRoundId: String(currentRound._id), label: currentRound.roleName || "foundation" });
  }, [currentRound, remainingRoles, data?.recordingPlan]);
  useEffect(() => {
    if (nextStageReady && !inviteLookupOpen && !reservationReview && !promptedRounds.current.has(String(currentRound._id))) showNextStage();
  }, [nextStageReady, currentRound, inviteLookupOpen, reservationReview, showNextStage]);
  const workspaceReady = Boolean(data);
  const pendingReviewCount = (data?.submissions || []).filter(item => item.state === "submitted").length;
  useEffect(() => {
    if (!canManage) return;
    const controller = new AbortController();
    let pending = false;
    const refresh = async () => {
      if (document.hidden || pending) return;
      pending = true;
      try {
        const { data: status } = await originalsRequest(token, { method: "get", url: `/projects/${id}/review-status`, signal: controller.signal });
        if (typeof status.signature !== "string") throw new Error("Review status unavailable");
        if (status.signature !== reviewSnapshot.current) {
          const { data: workspace } = await originalsRequest(token, { method: "get", url: `/projects/${id}/workspace`, signal: controller.signal });
          if (!controller.signal.aborted) { reviewSnapshot.current = workspace.reviewStatus?.signature ?? status.signature; setData(workspace); }
        }
        if (!controller.signal.aborted) setReviewRefreshError(false);
      } catch (failure) {
        if (!controller.signal.aborted) {
          setReviewRefreshError(true);
          if (failure.response?.status === 403) setError(failure.response.data.message || "Project access has ended.");
        }
      } finally { pending = false; }
    };
    refresh();
    const timer = setInterval(refresh, 15000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => { controller.abort(); clearInterval(timer); document.removeEventListener("visibilitychange", refresh); window.removeEventListener("focus", refresh); };
  }, [canManage, token, id]);
  useEffect(() => {
    if (!workspaceReady) return;
    const openLinkedSection = () => {
      if (window.location.hash === "#project-chat") openWorkspaceSection("project-chat");
      if (canManage && window.location.hash === "#project-review") openWorkspaceSection("project-review");
    };
    openLinkedSection();
    window.addEventListener("hashchange", openLinkedSection);
    return () => window.removeEventListener("hashchange", openLinkedSection);
  }, [id, canManage, workspaceReady]);
  const ownReservations = participantPreview ? [] : (data?.reservations || []).filter(item => String(item.musicianId) === String(data?.viewerId) && String(item.roundId) === String(currentRound?._id));
  const activeReservations = ownReservations.filter(item => item.state === "active" && new Date(item.expiresAt) > new Date());
  const ownSubmissions = (data?.submissions || []).filter(item => String(item.musicianId) === String(data?.viewerId));
  const hasParticipation = activeReservations.length > 0 || ownSubmissions.length > 0;
  const roundOpen = currentRound && ["open", "reopened"].includes(currentRound.state) && (!currentRound.closesAt || new Date(currentRound.closesAt) > new Date());
  const slotCount = data?.activeSlotCount || 0;

  useEffect(() => {
    if (!data || participantPreview) return;
    const reservationId = activeReservations[0]?._id || "";
    setNextRound(value => value.type === "instrument" && value.roleName && !data.project.requestedRoles.some(role => role.name === value.roleName) ? { ...value, roleName: "" } : value);
    if (!isManager) setUpload(value => ({ ...value, kind: ["mix", "master"].includes(currentRound?.type) ? currentRound.type : "take_stem", reservationId }));
    setSubmission(value => value.reservationId === reservationId ? value : { ...value, reservationId, stemAssetIds: [], mixdownAssetIds: {}, wetStemAssetId: "" });
    setProduction(value => value.reservationId === reservationId ? value : { ...value, reservationId, outputAssetId: "" });
  // Re-select the current personal reservation after an action reloads the data.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, participantPreview]);

  const act = async (request, success) => {
    if (participantPreview) return toast.info("Participant preview is read-only. Return to owner view to make changes.");
    try { setBusy(true); const response = await originalsRequest(token, request); toast.success(success); await load(); return response.data; }
    catch (requestError) { toast.error(requestError?.response?.data?.message || "Action failed"); }
    finally { setBusy(false); }
  };

  const reserve = () => setReservationReview({ roleName, type: ["mix", "master"].includes(currentRound.type) ? currentRound.type : "contributor", request: { method: "post", url: `/rounds/${currentRound._id}/reservations`, data: { roleName, anonymous, creditName } } });
  const uploadFile = async () => {
    if (!upload.file) return toast.error("Choose a file");
    const body = new FormData();
    body.append("file", upload.file); body.append("kind", upload.kind);
    if (["initial_stem", "take_stem", "click_track"].includes(upload.kind)) body.append("createdEntirelyWithAi", String(upload.createdEntirelyWithAi));
    if (currentRound?._id) body.append("roundId", currentRound._id);
    if (upload.reservationId) body.append("reservationId", upload.reservationId);
    const saved = await act({ method: "post", url: `/projects/${id}/assets`, data: body }, "File uploaded. Choose it in Submit a take when you are ready.");
    if (saved?.asset) {
      setSubmission(current => String(current.reservationId) !== String(upload.reservationId) ? current : {
        ...current,
        ...(upload.kind === "take_stem" && !current.stemAssetIds.length ? { stemAssetIds: [saved.asset._id] } : {}),
      });
      setUpload(current => ({ ...current, file: null, createdEntirelyWithAi: false }));
      if (uploadInput.current) uploadInput.current.value = "";
      if (upload.kind === "take_stem") setStemReviewId(saved.asset._id);
    }
  };
  const stemSubmission = originalStemSubmission(submission, data?.assets || []);
  const submitTake = async () => {
    if (participantPreview || busy) return;
    if (!stemSubmission.ready) return toast.error(stemSubmission.message);
    const selectedIds = [...submission.stemAssetIds, submission.wetStemAssetId].filter(Boolean);
    const pending = data.assets.find(asset => selectedIds.includes(String(asset._id)) && asset.alignmentReviewRequired && !asset.alignmentReview?.reviewedAt);
    if (pending) { setStemReviewId(pending._id); return; }
    setBusy(true);
    try {
      await originalsRequest(token, { method: 'post', url: `/reservations/${submission.reservationId}/submissions`, data: {
        songwritingChoice: submission.songwritingChoice, notes: submission.notes, takes: stemSubmission.takes,
      } });
      toast.success('Take submitted for review'); await load();
    } catch (failure) {
      if (failure.response?.data?.code === 'ORIGINALS_ALIGNMENT_REVIEW_REQUIRED') setStemReviewId(failure.response.data.assetId);
      toast.error(failure.response?.data?.message || 'Could not submit this take');
    } finally { setBusy(false); }
  };
  const setReviewField = (submissionId, field, value) => setReview((current) => ({
    ...current,
    [submissionId]: { selectionMode: "whole_take", ranges: [{ startSeconds: "", endSeconds: "", note: "" }], note: "", ...(current[submissionId] || {}), [field]: value },
  }));
  const decideSubmission = (item, decision) => {
    const value = review[item._id] || { selectionMode: "whole_take", note: "" };
    const firstTake = item.takes?.[0];
    const payload = { decision, note: value.note, selectionMode: value.selectionMode };
    if (decision === "accept" && value.selectionMode === "whole_take" && item.category === "contribution") payload.selectedTakeId = value.selectedTakeId || firstTake?._id;
    if (decision === "accept" && value.selectionMode === "selected_ranges") payload.selectedRanges = (value.ranges || []).map((range) => ({ takeId: value.selectedTakeId || firstTake?._id, startSeconds: Number(range.startSeconds), endSeconds: Number(range.endSeconds), note: range.note }));
    return act({ method: "post", url: `/submissions/${item._id}/decision`, data: payload }, decision === "accept" ? "Submission accepted" : "Submission rejected and slot reopened");
  };
  const playerTracks = (item) => {
    const takeAssetIds = new Set([String(item.outputAssetId || ""), ...(item.takes || []).flatMap((take) => (take.stemAssetIds?.length ? take.stemAssetIds : [take.stemAssetId]).map(String))]);
    return [...recordingTracks.filter(asset => !takeAssetIds.has(String(asset._id))), ...data.assets.filter(asset => takeAssetIds.has(String(asset._id)))];
  };
  const setRange = (submissionId, index, changes) => {
    const value = review[submissionId] || { selectionMode: "selected_ranges", ranges: [{ startSeconds: "", endSeconds: "", note: "" }], note: "" };
    const ranges = (value.ranges || []).map((range, rangeIndex) => rangeIndex === index ? { ...range, ...changes } : range);
    setReviewField(submissionId, "ranges", ranges);
  };
  const openRound = async () => {
    if (busy || !stagePrompt) return;
    setBusy(true); setStageError("");
    try {
      const { data: result } = await originalsRequest(token, { method: "post", url: `/projects/${id}/rounds`, data: { ...nextRound, fromRoundId: stagePrompt.fromRoundId } });
      await load();
      setStagePrompt(null);
      setInvitation({ musicianId: "", roleName: result.round.roleName, message: "" });
      setInviteFeedback({ success: true, message: `${result.round.roleName} round is open. The previous round’s remaining places are closed; affected musicians will be emailed.` });
      setInviteLookupOpen(true);
    } catch (failure) { setStageError(failure.response?.data?.message || "Could not open the next round. Please try again."); }
    finally { setBusy(false); }
  };
  const invitationRoles = currentRound?.type === "foundation" ? currentRound.eligibleRoles || [] : currentRound?.roleName ? [currentRound.roleName] : [];
  const invitationRole = invitationRoles.includes(invitation.roleName) ? invitation.roleName : invitationRoles.includes(roleName) ? roleName : invitationRoles[0] || "";
  const sendInvitation = async () => {
    if (busy || participantPreview || !invitation.musicianId || !invitationRole) return;
    setBusy(true); setInviteFeedback(null);
    try {
      await originalsRequest(token, { method: "post", url: `/rounds/${currentRound._id}/invitations`, data: { ...invitation, roleName: invitationRole } });
      setInviteFeedback({ success: true, message: `Private invitation for ${invitationRole} queued.` });
      setInvitation(current => ({ ...current, musicianId: "", message: "" }));
      await load();
    } catch (failure) { setInviteFeedback({ success: false, message: failure.response?.data?.message || "Could not send this invitation. Please try again." }); }
    finally { setBusy(false); }
  };
  const submitProduction = () => act({ method: "post", url: `/reservations/${production.reservationId}/production-submissions`, data: { outputAssetId: production.outputAssetId, notes: production.notes } }, "Production output submitted");
  const latestCredits = data?.creditVersions?.[0];
  const openConcern = () => act({ method: "post", url: `/submissions/${concern.submissionId}/issues`, data: { category: concern.category, reason: concern.reason } }, "Concern opened for remedy before retraction");
  const updateIssue = (issueId, action) => act({ method: "post", url: `/issues/${issueId}`, data: { action, body: issueReplies[issueId] || "" } }, action === "confirm_retraction" ? "Retraction confirmed" : "Concern updated");
  const replaceSubmission = (item) => {
    const replacement = replacements[item._id] || {};
    return act({ method: "post", url: `/submissions/${item._id}/replace`, data: { takes: [{ label: "Updated take", stemAssetId: replacement.stemAssetId, mixdownAssetId: replacement.mixdownAssetId }], notes: replacement.notes || "" } }, "Submission replaced with a new revision");
  };
  const resendLaunchNotifications = async () => {
    try {
      setBusy(true);
      const response = await originalsRequest(token, { method: "post", url: `/projects/${id}/notify-launch` });
      const notification = response.data.notification;
      if (notification?.failed) {
        toast.warning(`${notification.sent || 0} notification emails sent; ${notification.failed} failed.`);
      } else {
        toast.success(`${notification?.sent || 0} notification emails sent`);
      }
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || "Could not send launch notifications");
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div className="p-8 text-red-700">{error}</div>;
  if (!data) return <div className="p-8">Loading workspace…</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 pb-24">
      <Link to="/originals" className="mb-4 inline-block text-sm underline md:hidden">← All Originals projects</Link>
      <Title text1="ORIGINALS" text2="WORKSPACE" />
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
      <div className="min-w-0 space-y-4">
      <div id="project-brief" tabIndex={-1} className="scroll-mt-6 min-w-0 rounded-xl border bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-xl font-semibold">{data.project.title}</h1><p className="mt-2 text-sm text-gray-600">{data.project.description}</p><p className="mt-3 text-xs uppercase text-gray-500">{String(data.project.state).replaceAll("_", " ")}</p></div>{canManage && canModerate && data.project.moderation?.status === "approved" ? <button disabled={busy} onClick={resendLaunchNotifications} className="rounded border px-4 py-2 text-sm font-semibold disabled:opacity-40">Email preview group</button> : null}</div></div>
      {currentRound ? <section className="rounded-xl border bg-white p-5">
        {["mix", "master"].includes(currentRound.type) ? <OriginalsRoleCard as="div" compact roleName={currentRound.type}>
          <h2 className="text-sm font-bold uppercase tracking-wide">Current {currentRound.type} round</h2>
          <p className="mt-1 text-sm text-gray-600">{currentRound.closesAt ? `Closes ${dateTime(currentRound.closesAt)}` : "The seven-day round starts when the first person reserves a slot."} · {slotCount}/{currentRound.slotLimit} places in use</p>
        </OriginalsRoleCard> : <>
          <h2 className={heading}>Current {currentRound.type} round</h2>
          <p className="mt-1 text-sm text-gray-600">{currentRound.closesAt ? `Closes ${dateTime(currentRound.closesAt)}` : "The seven-day round starts when the first person reserves a slot."} · {slotCount}/{currentRound.slotLimit} places in use</p>
        </>}
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <select aria-label="Instrument to reserve" value={roleName} onChange={(event) => setRoleName(event.target.value)} className="w-full min-w-0 rounded border px-3 py-2"><option value="">Choose instrument</option>{(currentRound.type === "foundation" ? currentRound.eligibleRoles : [currentRound.roleName]).map((role) => <option key={role}>{role}</option>)}</select>
          <button disabled={busy || participantPreview || !roleName || !roundOpen || activeReservations.length > 0 || slotCount >= currentRound.slotLimit} onClick={reserve} className="rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{activeReservations.length ? "Your slot is reserved" : "Reserve for 24 hours"}</button>
        </div>
        <p className="mt-3 text-sm text-gray-600">Interested in a later instrument? <SectionLink to="project-roles">Reserve a future place</SectionLink> and we will email when its round opens.</p>
        <details className="mt-3 text-sm"><summary className="cursor-pointer text-gray-600">Credit preferences (optional)</summary><div className="mt-2 flex flex-wrap gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} /> Anonymous</label>
          <input disabled={!anonymous} value={creditName} onChange={(event) => setCreditName(event.target.value)} placeholder="Artistic name" className="rounded border px-3 py-2 disabled:bg-gray-100" /></div></details>
        {!roundOpen && <p className="mt-3 text-sm text-amber-800">This round is awaiting review. The owner will open the next opportunity.</p>}
        {!participantPreview && activeReservations.map(item => <p key={item._id} className="mt-3 rounded bg-emerald-50 p-3 text-sm text-emerald-900">Your {item.roleName} slot is reserved until {dateTime(item.expiresAt)}. Upload your recordings in <SectionLink to="project-files">Files and uploads</SectionLink>, then send them for review in <SectionLink to="submit-take">Submit a take</SectionLink>. <button type="button" disabled={busy} onClick={() => act({ method: "post", url: `/reservations/${item._id}/release` }, "Reservation released; the place is available again")} className="mt-2 block underline">Release this reservation</button></p>)}
        {canManage && <div className="mt-4 border-t pt-3"><button type="button" onClick={() => { setInviteFeedback(null); setInviteLookupOpen(true); }} className="rounded border px-4 py-2 text-sm font-semibold">Invite musicians privately</button>{inviteLookupOpen && <OriginalsDialog title="Invite musicians privately" busy={busy} onClose={() => setInviteLookupOpen(false)}><div className="space-y-4">
          <label className="block text-sm font-medium">Role for this invitation<select aria-label="Role for this invitation" disabled={busy} value={invitationRole} onChange={event => setInvitation(current => ({ ...current, roleName: event.target.value, musicianId: "" }))} className="mt-1 w-full rounded border p-2 font-normal">{invitationRoles.map(role => <option key={role}>{role}</option>)}</select></label>
          {inviteLookupOpen && <OriginalsMusicianBrowser key={`${currentRound._id}:${invitationRole}`} token={token} projectId={id} ownerLookup initialInstrument={invitationRole} selectedId={invitation.musicianId} onSelect={musicianId => setInvitation(current => ({ ...current, musicianId }))} disabled={busy} />}
          <div className="grid gap-3 md:grid-cols-[1fr_auto]"><input value={invitation.message} onChange={event => setInvitation(current => ({ ...current, message: event.target.value }))} placeholder="Optional private invitation message" disabled={busy} className="rounded border px-3 py-2 text-sm" /><button disabled={busy || !invitation.musicianId || !invitationRole} onClick={sendInvitation} className="rounded border px-4 py-2 text-sm font-semibold disabled:opacity-40">{busy ? "Sending invitation…" : "Invite musician"}</button></div>
          {inviteFeedback && <p role={inviteFeedback.success ? "status" : "alert"} className={`rounded p-3 text-sm ${inviteFeedback.success ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-800"}`}>{inviteFeedback.message}</p>}
        </div></OriginalsDialog>}</div>}
      </section> : null}
      {canManage && <OriginalsReviewDeadline plan={data.recordingPlan} isOwner={String(data.viewerId) === String(data.project.ownerId)} />}
      </div>
      <OriginalsRoyalties compact project={data.project} preview={data.royaltyPreview} credits={latestCredits} canIllustrateTscShare={!participantPreview && data.permissions?.canIllustrateTscShare === true} />
      </div>
      {isManager && <div className="mt-3 flex flex-wrap items-center gap-3"><button type="button" onClick={() => setParticipantPreview(value => !value)} className="rounded border bg-white px-4 py-2 text-sm font-semibold">{participantPreview ? "Return to owner view" : "View as participant"}</button>{participantPreview && <span className="text-sm text-gray-600">Read-only preview of the initial participant screen.</span>}</div>}

      {reservationReview && <OriginalsReservationAgreement token={token} projectId={id} {...reservationReview} onCancel={() => setReservationReview(null)} onSaved={() => { setReservationReview(null); toast.success("Agreement accepted and 24-hour slot reserved"); load(); }} />}
      {stagePrompt && canManage && <OriginalsDialog title="Choose the next round" busy={busy} onClose={() => setStagePrompt(null)}><div className="space-y-4">
        <p className="text-sm">The approved recording is saved. {data.recordingPlan?.nextRound?.fromPreference ? <>Your project settings specify <strong>{data.recordingPlan.nextRound.roleName}</strong> next. Confirm this round, or choose a different instrument below.</> : 'Choose the next instrument or production stage, then invite musicians to take part.'}</p>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Opening the next round closes the {stagePrompt.label} round and ends its remaining recording places. Musicians who were not selected will be emailed, and unselected recordings will not be used.</div>
        <label className="block text-sm font-medium">Next stage<select aria-label="Next stage" disabled={busy} value={nextRound.type} onChange={event => setNextRound(value => ({ ...value, type: event.target.value }))} className="mt-1 w-full rounded border p-2"><option value="instrument" disabled={!remainingRoles.length}>Next instrument</option><option value="mix">Competitive mixing</option><option value="master" disabled={!data.submissions.some(item => item.state === "accepted" && item.category === "mix")}>Competitive mastering</option></select></label>
        {nextRound.type === "instrument" && <label className="block text-sm font-medium">Instrument<select aria-label="Next instrument" disabled={busy} value={nextRound.roleName} onChange={event => setNextRound(value => ({ ...value, roleName: event.target.value }))} className="mt-1 w-full rounded border p-2"><option value="">Choose instrument</option>{remainingRoles.map(role => <option key={role.name}>{role.name}</option>)}</select></label>}
        <p className="text-xs text-gray-600">Future places already reserved for the chosen instrument will activate when eligible, and those musicians will be notified. Otherwise the new round’s clock starts with its first recording reservation.</p>
        {stageError && <p role="alert" className="text-sm text-red-700">{stageError}</p>}
        <div className="flex flex-wrap gap-3"><button type="button" disabled={busy || (nextRound.type === "instrument" && !nextRound.roleName)} onClick={openRound} className="rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{busy ? "Opening next round…" : "Open round & invite musicians"}</button><button type="button" disabled={busy} onClick={() => setStagePrompt(null)} className="rounded border px-4 py-2 text-sm">Not now</button></div>
      </div></OriginalsDialog>}
      {stemReviewId && <OriginalsStemReview key={stemReviewId} token={token} assetId={stemReviewId} onClose={() => setStemReviewId('')} onConfirmed={({ assetId, alignmentReview }) => { setData(current => ({ ...current, assets: current.assets.map(asset => String(asset._id) === String(assetId) ? { ...asset, alignmentReview } : asset) })); setStemReviewId(''); }} />}
      <section id="project-guidance" tabIndex={-1} className="scroll-mt-6 mt-4 rounded-xl border bg-white p-4"><OriginalsProjectListening token={token} assets={data.assets} submissions={data.submissions} title={data.project.title} /></section>
      <OriginalsProjectChat key={`${id}:${data.viewerId}`} token={token} projectId={id} viewerId={data.viewerId} initialMessages={data.messages} readOnly={participantPreview} blocked={Boolean(stagePrompt || inviteLookupOpen || reservationReview || stemReviewId || (nextStageReady && !promptedRounds.current.has(String(currentRound?._id))))} onAccessLost={setError} />
      <OriginalsRoles token={token} projectId={id} canManage={canManage} roleManagement={data.roleManagement} roles={data.roleProgress || data.project.requestedRoles.map(role => ({ name: role.name, status: "Awaiting a recording", canRecommend: true }))} readOnly={participantPreview} futureReservations={(data.futureReservations || []).filter(item => String(item.musicianId) === String(data.viewerId))} onChange={load} creditPreferences={{ anonymous, creditName }} />

      {canManage && <details className="mt-4 rounded-xl border bg-white p-4"><summary className={`cursor-pointer ${heading}`}>Owner tools: next stage</summary><p className="mt-3 text-sm text-gray-600">{nextStageReady ? "An approved contribution is ready. Choose the next instrument or production round when you are ready to close this round." : "Approve a contribution in the current round before opening the next one."}</p><button type="button" disabled={busy || !nextStageReady} onClick={showNextStage} className="mt-3 rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Choose next round</button></details>}

      <><details id="project-files" tabIndex={-1} className="scroll-mt-6 mt-4 rounded-xl border bg-white p-4"><summary className={`cursor-pointer ${heading}`}>Files and uploads</summary><section className="mt-4 min-w-0">
        <h2 className={heading}>Project files & your uploads</h2><p className="mt-2 text-sm text-gray-600">1. Upload at least one stem (up to three stem files in total). Each stem can be reviewed with the project tracks on this page. Check each new stem in its listening preview before submitting. 2. Choose those uploaded files in <SectionLink to="submit-take">Submit a take</SectionLink> and send them for review. An upload alone is not a submission. Your unsubmitted recordings are visible to you and the owner. The expiry time shown is your reservation deadline.</p>
        {(canManage || (!participantPreview && activeReservations.length > 0)) && <><div className="mt-3 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-4">
          <select disabled={busy} value={upload.kind} onChange={(event) => setUpload((value) => ({ ...value, kind: event.target.value, createdEntirelyWithAi: false }))} aria-label="Type of recording to upload" className="w-full min-w-0 rounded border px-3 py-2">{(canManage ? [["demo", "Demo"], ["guide_track", "Guide track"], ["video_submission", "Video submission"], ["click_track", "Click track"], ["initial_stem", "Initial stem"], ["take_stem", "Your part only (stem)"], ["mix", "Mix output"], ["master", "Master output"]] : [["take_stem", "Your part only (stem)"], ...(["mix", "master"].includes(currentRound?.type) ? [[currentRound.type, `${currentRound.type} output`]] : [])]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <select disabled={busy} value={upload.reservationId} onChange={(event) => setUpload((value) => ({ ...value, reservationId: event.target.value }))} aria-label="Reservation for this upload" className="w-full min-w-0 rounded border px-3 py-2"><option value="">Project reference (no reservation)</option>{activeReservations.map((item) => <option key={item._id} value={item._id}>{item.roleName} — expires {dateTime(item.expiresAt)}</option>)}</select>
          <input ref={uploadInput} disabled={busy} type="file" accept="audio/*,video/mp4,video/quicktime,.wav,.aiff,.flac,.m4a,.mov" onChange={(event) => setUpload((value) => ({ ...value, file: event.target.files?.[0] || null, createdEntirelyWithAi: false }))} className="w-full min-w-0 max-w-full rounded border p-2 text-sm" />
          <button disabled={busy || !upload.file} onClick={uploadFile} className="rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Upload file</button>
        </div>
        {["initial_stem", "take_stem", "click_track"].includes(upload.kind) && <OriginalsAiDeclaration checked={upload.createdEntirelyWithAi} onChange={checked => setUpload(value => ({ ...value, createdEntirelyWithAi: checked }))} disabled={busy || !upload.file} />}
        </>}<p className="mt-3 text-xs text-gray-600">For voice notes and messages, use <SectionLink to="project-chat">Project chat</SectionLink>.</p>
        <OriginalsFilesPlayback token={token} assets={data.assets} submissions={data.submissions} viewerId={data.viewerId} canManage={canManage} />
      </section></details></>



      {canManage && <details id="project-review" tabIndex={-1} className="scroll-mt-6 mt-4 rounded-xl border bg-white p-4"><summary className={`cursor-pointer ${heading}`}>Owner tools: review submissions{pendingReviewCount > 0 && <span role="status" aria-label={`${pendingReviewCount} submissions awaiting review`} className="ml-2 inline-flex rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">{pendingReviewCount} awaiting review</span>}</summary>{reviewRefreshError && <p role="status" className="mt-2 text-xs text-amber-800">Could not refresh new submissions. Retrying…</p>}<section className="mt-6 rounded-xl border bg-white p-5">
        <div className="flex items-center justify-between gap-3"><h2 className={heading}>Submission review</h2>{currentRound && !["open", "reopened"].includes(currentRound.state) ? <button disabled={busy} onClick={() => act({ method: "post", url: `/rounds/${currentRound._id}/reopen`, data: { reason: "Reopened from admin preview" } }, "Round reopened; the seven-day clock starts with the first reservation")} className="rounded border px-3 py-2 text-sm">Reopen round</button> : null}</div>
        <div className="mt-4 space-y-5">{data.submissions.map((item) => {
          const value = review[item._id] || { selectionMode: "whole_take", selectedTakeId: item.takes?.[0]?._id || "", ranges: [{ startSeconds: "", endSeconds: "", note: "" }], note: "" };
          return <article key={item._id} className="rounded-lg border p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><b>{item.roleName}</b><span className="ml-2 text-xs text-gray-500">Revision {item.revision || 1}</span><span className="ml-2 text-xs text-gray-500">{item.songwritingChoice.replaceAll("_", " ")}</span></div><span className="rounded bg-gray-100 px-2 py-1 text-xs capitalize">{item.state}</span></div>
            <OriginalsTakePreviews token={token} takes={item.takes} assets={data.assets} backgroundTracks={recordingTracks} />
            <OriginalsLayeredPlayer token={token} tracks={playerTracks(item)} title={data.project.title} onTimeChange={(seconds) => setReviewField(item._id, "cursorSeconds", seconds.toFixed(2))} />
            {item.takes?.some(take => take.wetStemAssetId) && <details className="mt-3 text-sm"><summary className="cursor-pointer">Optional effects versions — reference for the mix</summary><OriginalsLayeredPlayer token={token} tracks={data.assets.filter(asset => item.takes.some(take => String(take.wetStemAssetId) === String(asset._id)))} /></details>}
            {item.state === "submitted" ? <div className="mt-4 grid gap-3 md:grid-cols-2">
              <select disabled={item.category !== "contribution"} value={value.selectionMode} onChange={(event) => setReviewField(item._id, "selectionMode", event.target.value)} className="rounded border px-3 py-2 disabled:bg-gray-100"><option value="whole_take">Approve entire take/output</option>{item.category === "contribution" ? <option value="selected_ranges">Approve selected time ranges</option> : null}</select>
              {item.category === "contribution" ? <select aria-label={`Take to approve for ${item.roleName}`} value={value.selectedTakeId || item.takes?.[0]?._id || ""} onChange={(event) => setReviewField(item._id, "selectedTakeId", event.target.value)} className="rounded border px-3 py-2">{item.takes.map((take) => <option key={take._id} value={take._id}>{take.label}</option>)}</select> : <div className="rounded bg-gray-50 px-3 py-2 text-sm capitalize">Complete {item.category} output</div>}
              {value.selectionMode === "selected_ranges" ? <div className="space-y-2 md:col-span-2">{value.ranges.map((range, rangeIndex) => <div key={rangeIndex} className="grid gap-2 rounded border p-2 md:grid-cols-[1fr_1fr_2fr_auto]"><input type="number" min="0" step="0.01" value={range.startSeconds} onChange={(event) => setRange(item._id, rangeIndex, { startSeconds: event.target.value })} placeholder={`Start${value.cursorSeconds ? ` · player ${value.cursorSeconds}` : ""}`} className="rounded border px-3 py-2" /><input type="number" min="0" step="0.01" value={range.endSeconds} onChange={(event) => setRange(item._id, rangeIndex, { endSeconds: event.target.value })} placeholder="End seconds" className="rounded border px-3 py-2" /><input value={range.note} onChange={(event) => setRange(item._id, rangeIndex, { note: event.target.value })} placeholder="Why this section?" className="rounded border px-3 py-2" /><button onClick={() => setReviewField(item._id, "ranges", value.ranges.filter((_, index) => index !== rangeIndex))} className="text-sm text-red-600">Remove</button></div>)}<button onClick={() => setReviewField(item._id, "ranges", [...value.ranges, { startSeconds: value.cursorSeconds || "", endSeconds: "", note: "" }])} className="rounded border px-3 py-2 text-sm">+ Add another range at player position</button></div> : null}
              <textarea value={value.note} onChange={(event) => setReviewField(item._id, "note", event.target.value)} placeholder="Decision note (required when rejecting)" className="rounded border px-3 py-2 md:col-span-2" />
              <button disabled={busy} onClick={() => decideSubmission(item, "accept")} className="rounded bg-emerald-700 px-4 py-2 font-semibold text-white">Accept selection</button><button disabled={busy || !value.note.trim()} onClick={() => decideSubmission(item, "reject")} className="rounded bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-40">Reject and reopen slot</button>
              {item.category === "contribution" ? <div className="rounded border border-dashed p-3 md:col-span-2"><p className="text-sm font-semibold">Replace this submission before the next stage</p><div className="mt-2 grid gap-2 md:grid-cols-2"><select value={replacements[item._id]?.stemAssetId || ""} onChange={(e) => setReplacements((current) => ({ ...current, [item._id]: { ...(current[item._id] || {}), stemAssetId: e.target.value } }))} className="rounded border px-3 py-2"><option value="">New stem</option>{data.assets.filter((asset) => asset.kind === "take_stem" && asset.state === "active" && String(asset.reservationId) === String(item.reservationId) && asset.state === "active").map((asset) => <option key={asset._id} value={asset._id}>{asset.originalName}</option>)}</select><select value={replacements[item._id]?.mixdownAssetId || ""} onChange={(e) => setReplacements((current) => ({ ...current, [item._id]: { ...(current[item._id] || {}), mixdownAssetId: e.target.value } }))} className="rounded border px-3 py-2"><option value="">Listening mix optional — review the new stem directly</option>{data.assets.filter((asset) => asset.kind === "take_mixdown" && asset.state === "active" && String(asset.reservationId) === String(item.reservationId) && asset.state === "active").map((asset) => <option key={asset._id} value={asset._id}>{asset.originalName}</option>)}</select><button disabled={busy || !replacements[item._id]?.stemAssetId} onClick={() => replaceSubmission(item)} className="rounded border px-3 py-2 text-sm font-semibold md:col-span-2">Replace with updated revision</button></div></div> : null}
            </div> : item.decisionNote ? <p className="mt-3 text-sm text-gray-600">Decision note: {item.decisionNote}</p> : null}
          </article>;
        })}{!data.submissions.length ? <p className="text-sm text-gray-500">No submissions yet.</p> : null}</div>
      </section></details>}

      <>{(canManage || (!participantPreview && latestCredits)) && <details className="mt-4 rounded-xl border bg-white p-4"><summary className={`cursor-pointer ${heading}`}>Credits and royalties</summary><section className="mt-6 rounded-xl border bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className={heading}>Credits and royalty confirmation</h2><p className="mt-1 text-sm text-gray-600">Calculated only from accepted contributions, the selected mix and selected master.</p></div>{canManage && <button disabled={busy} onClick={() => act({ method: "post", url: `/projects/${id}/credits` }, "New credit version calculated")} className="rounded bg-black px-4 py-2 text-sm font-semibold text-white">Calculate new version</button>}</div>
        {latestCredits ? <div className="mt-4 space-y-4"><div className="flex items-center justify-between"><b>Version {latestCredits.version}</b><span className="rounded bg-gray-100 px-2 py-1 text-xs capitalize">{latestCredits.state.replaceAll("_", " ")}</span></div><div className="grid gap-4 lg:grid-cols-2"><OriginalsMasterRoyaltySplit title="Master royalty pool for this credit version" shares={latestCredits.masterShares} roles={data.project.requestedRoles} columns={2} /><div><h3 className="text-sm font-semibold">Songwriting composition</h3><div className="mt-2 divide-y rounded border">{latestCredits.compositionShares.map((share, index) => <div key={`${share.role}-${index}`} className="flex justify-between p-2 text-sm"><span>{share.role}</span><b>{share.percent.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}%</b></div>)}</div></div></div><p className="text-xs text-gray-500">Confirmed by {latestCredits.confirmations.length} of {latestCredits.requiredMusicianIds.length} credited participants.</p>{latestCredits.state === "awaiting_confirmation" ? <div className="grid gap-3 md:grid-cols-[auto_1fr_auto]"><button disabled={busy} onClick={() => act({ method: "post", url: `/credit-versions/${latestCredits._id}/confirm` }, "Your credits are confirmed")} className="rounded border px-4 py-2 text-sm font-semibold">Confirm my credits</button>{canManage && canModerate && <><input value={creditOverrideReason} onChange={(event) => setCreditOverrideReason(event.target.value)} placeholder="Reason for TSC finalisation after response deadline" className="rounded border px-3 py-2" /><button disabled={busy || !creditOverrideReason.trim()} onClick={() => act({ method: "post", url: `/credit-versions/${latestCredits._id}/finalise`, data: { reason: creditOverrideReason } }, "Credits finalised by TSC")} className="rounded bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">TSC finalise</button></>}</div> : canManage ? <button disabled={busy || data.project.state === "approved_master"} onClick={() => act({ method: "post", url: `/projects/${id}/complete` }, "Project completed with approved master")} className="rounded bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-40">Mark approved master complete</button> : null}</div> : <p className="mt-4 text-sm text-gray-500">No credit version calculated yet.</p>}
      </section></details>}</>

      <>{(canManage || (!participantPreview && ownSubmissions.length > 0)) && <details className="mt-4 rounded-xl border bg-white p-4"><summary className={`cursor-pointer ${heading}`}>Concerns and amendments</summary><section className="mt-6 rounded-xl border bg-white p-5"><h2 className={heading}>Concerns, remedies and retractions</h2><p className="mt-1 text-sm text-gray-600">A contributor states the reason first, giving the project an opportunity to resolve it. Retraction is confirmed only after that discussion.</p><div className="mt-3 grid gap-2 md:grid-cols-4"><select value={concern.submissionId} onChange={(e) => setConcern((value) => ({ ...value, submissionId: e.target.value }))} className="rounded border px-3 py-2"><option value="">Choose contribution</option>{data.submissions.filter((item) => ["submitted", "accepted"].includes(item.state)).map((item) => <option key={item._id} value={item._id}>{item.roleName} · revision {item.revision || 1}</option>)}</select><select value={concern.category} onChange={(e) => setConcern((value) => ({ ...value, category: e.target.value }))} className="rounded border px-3 py-2"><option value="lyrics">Lyrics</option><option value="creative_direction">Creative direction</option><option value="credit">Credit</option><option value="conduct">Conduct</option><option value="other">Other</option></select><input value={concern.reason} onChange={(e) => setConcern((value) => ({ ...value, reason: e.target.value }))} placeholder="Reason for considering retraction" className="rounded border px-3 py-2" /><button disabled={busy || !concern.submissionId || !concern.reason.trim()} onClick={openConcern} className="rounded border px-3 py-2 font-semibold disabled:opacity-40">Open concern</button></div><div className="mt-4 space-y-3">{(data.issues || []).map((issue) => <article key={issue._id} className="rounded border p-3"><div className="flex justify-between"><b className="capitalize">{issue.category.replaceAll("_", " ")}</b><span className="text-xs capitalize">{issue.state.replaceAll("_", " ")}</span></div><div className="mt-2 space-y-1">{issue.messages.map((message) => <p key={message._id} className="text-sm"><span className="font-semibold capitalize">{message.type.replaceAll("_", " ")}:</span> {message.body}</p>)}</div>{!["resolved", "retraction_confirmed", "cancelled"].includes(issue.state) ? <div className="mt-3"><input value={issueReplies[issue._id] || ""} onChange={(e) => setIssueReplies((current) => ({ ...current, [issue._id]: e.target.value }))} placeholder="Response, remedy or further amendment request" className="w-full rounded border px-3 py-2" /><div className="mt-2 flex flex-wrap gap-2"><button onClick={() => updateIssue(issue._id, "propose_remedy")} className="rounded border px-3 py-1 text-sm">Propose remedy</button><button onClick={() => updateIssue(issue._id, "request_amendments")} className="rounded border px-3 py-1 text-sm">Request further amendments</button><button onClick={() => updateIssue(issue._id, "resolve")} className="rounded bg-emerald-700 px-3 py-1 text-sm text-white">Resolved — remain involved</button><button onClick={() => updateIssue(issue._id, "confirm_retraction")} className="rounded bg-red-700 px-3 py-1 text-sm text-white">Confirm retraction</button></div></div> : null}</article>)}</div></section></details>}</>

      {currentRound && ["mix", "master"].includes(currentRound.type) ? <>{(!participantPreview && activeReservations.length > 0) && <section className="mt-6 rounded-xl border bg-white p-5"><h2 className={heading}>Submit {currentRound.type} output</h2><p className="mt-1 text-sm text-gray-600">Upload the finished output above using the matching file type, then submit it here.</p><div className="mt-3 grid gap-3 md:grid-cols-2"><select value={production.reservationId} onChange={(event) => setProduction((value) => ({ ...value, reservationId: event.target.value, outputAssetId: "" }))} className="rounded border px-3 py-2"><option value="">Choose reservation</option>{activeReservations.map((item) => <option key={item._id} value={item._id}>{item.roleName}</option>)}</select><select value={production.outputAssetId} onChange={(event) => setProduction((value) => ({ ...value, outputAssetId: event.target.value }))} className="rounded border px-3 py-2"><option value="">Choose uploaded {currentRound.type}</option>{data.assets.filter((asset) => asset.kind === currentRound.type && String(asset.reservationId) === production.reservationId).map((asset) => <option key={asset._id} value={asset._id}>{asset.originalName}</option>)}</select><textarea value={production.notes} onChange={(event) => setProduction((value) => ({ ...value, notes: event.target.value }))} placeholder="Production notes" className="rounded border px-3 py-2 md:col-span-2" /><button disabled={busy || !production.reservationId || !production.outputAssetId} onClick={submitProduction} className="rounded bg-black px-4 py-2 font-semibold text-white disabled:opacity-40 md:col-span-2">Submit {currentRound.type}</button></div></section>}</> : null}

      <>{(!participantPreview && activeReservations.length > 0 && !["mix", "master"].includes(currentRound?.type)) && <section id="submit-take" tabIndex={-1} className="scroll-mt-6 mt-6 rounded-xl border bg-white p-5">
        <h2 className={heading}>Submit a take{activeReservations.find(item => String(item._id) === submission.reservationId)?.roleName ? ` — ${activeReservations.find(item => String(item._id) === submission.reservationId).roleName}` : ""}</h2>
        <p className="mt-1 text-sm text-gray-600">Before submitting, check <SectionLink to="project-chat">Project chat</SectionLink>, <SectionLink to="project-guidance">Guidance for the project</SectionLink> and <SectionLink to="project-files">Files and uploads</SectionLink>. Submit one to three stems, without a separate mixdown. Review each new stem with the available project tracks and confirm that it lines up. The owner can compare each option on the page. Choose your uploaded files below to request a review.</p><OriginalsRecordingGuide />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium">Your reserved role<select aria-label="Your reserved role" value={submission.reservationId} onChange={(event) => setSubmission((value) => ({ ...value, reservationId: event.target.value, stemAssetIds: [], mixdownAssetIds: {}, wetStemAssetId: "" }))} className="rounded border px-3 py-2"><option value="">Choose active reservation</option>{activeReservations.map((item) => <option key={item._id} value={item._id}>{item.roleName}</option>)}</select></label>
          <fieldset className="rounded border p-3 text-sm"><legend className="px-1 font-semibold">Royalty request if your take is accepted</legend><p className="mb-3 text-xs text-gray-600">Accepted recordings share the remaining master-royalty pool after TSC’s separate 20% for management, marketing and promotion. The <SectionLink to="project-royalties">royalty split</SectionLink> shows how 100% of that remaining pool is shared.</p><label className="flex items-center gap-2"><input type="checkbox" checked disabled /> Master royalties — included for accepted recordings</label><label className="mt-2 flex items-center gap-2"><input type="checkbox" checked={submission.songwritingChoice === "songwriting_claim"} onChange={event => setSubmission(value => ({ ...value, songwritingChoice: event.target.checked ? "songwriting_claim" : "master_only" }))} /> Also request songwriting credit</label><p className="mt-2 text-xs text-gray-600">{submission.songwritingChoice === "songwriting_claim" ? "Requesting master royalties and a songwriting contribution. Songwriting shares are confirmed with the project credits." : "Master royalties only. Add songwriting if you contributed to writing the song."}</p></fieldset>
          <fieldset className="min-w-0 rounded border p-3 text-sm"><legend className="px-1 font-semibold">Your stems — choose 1 to 3</legend><p className="mb-2 text-xs text-gray-600">Separate recordings of your musical parts or alternative takes, without the backing track. All start at the same point. Review each new stem against the project before submitting; no separate listening mix is needed. Any optional effects reference also counts towards the three-file limit.</p>{data.assets.filter(asset => asset.kind === "take_stem" && asset.state === "active" && String(asset.reservationId) === submission.reservationId).map(asset => <div key={asset._id} className="mt-2 flex items-start gap-2"><label className="flex min-w-0 items-start gap-2 break-all"><input type="checkbox" aria-label={`Submit stem ${asset.originalName}`} checked={submission.stemAssetIds.includes(asset._id)} disabled={!submission.stemAssetIds.includes(asset._id) && submission.stemAssetIds.length + (submission.wetStemAssetId && submission.wetStemAssetId !== String(asset._id) ? 1 : 0) >= 3} onChange={event => setSubmission(value => {
              const stemAssetIds = event.target.checked ? [...value.stemAssetIds, asset._id] : value.stemAssetIds.filter(id => id !== asset._id);
              return { ...value, stemAssetIds, wetStemAssetId: !stemAssetIds.length || String(value.wetStemAssetId) === String(asset._id) ? "" : value.wetStemAssetId };
            })} /><span>{asset.originalName}</span></label><button type="button" onClick={() => setStemReviewId(asset._id)} className="ml-auto shrink-0 text-xs underline">{asset.alignmentReview?.reviewedAt ? "Review again ✓" : "Check alignment"}</button></div>)}{!data.assets.some(asset => asset.kind === "take_stem" && String(asset.reservationId) === submission.reservationId && asset.state === "active") && <p className="text-xs text-gray-500">Upload your stem files first in Files and uploads.</p>}</fieldset>
          <label className="text-sm font-medium">Effects reference for your first selected stem (optional, within the three-file limit)<select aria-label="Optional effects stem" disabled={!submission.stemAssetIds.length || submission.stemAssetIds.length >= 3} value={submission.wetStemAssetId} onChange={event => setSubmission(value => ({ ...value, wetStemAssetId: event.target.value }))} className="mt-1 w-full min-w-0 rounded border p-2"><option value="">No additional effects version</option>{data.assets.filter(asset => asset.kind === "take_stem" && asset.state === "active" && String(asset.reservationId) === submission.reservationId && !submission.stemAssetIds.includes(asset._id)).map(asset => <option key={asset._id} value={asset._id}>{asset.originalName}</option>)}</select></label>
          {!submission.stemAssetIds.length && <p className="text-xs text-gray-600">Select your main stem above first. An effects reference is an additional version of that performance.</p>}
          <p className="text-sm text-gray-600">Missing a file? <SectionLink to="project-files">Upload it first</SectionLink>. The same performance can be supplied clean and with effects.</p>
          <textarea value={submission.notes} onChange={(event) => setSubmission((value) => ({ ...value, notes: event.target.value }))} placeholder="Notes for the project owner" className="rounded border px-3 py-2 md:col-span-2" />
          <p id="take-submission-status" role="status" className="text-sm text-gray-600 md:col-span-2">{stemSubmission.message || `${submission.stemAssetIds.length} stem${submission.stemAssetIds.length === 1 ? '' : 's'} selected${submission.wetStemAssetId ? ' plus an effects reference' : ''}. No listening mix is needed.`}</p>
          <button aria-describedby="take-submission-status" disabled={busy || !stemSubmission.ready} onClick={submitTake} className="rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 md:col-span-2">Submit take for review</button>
        </div>
        <p className="mt-4 text-sm text-gray-600">Need longer? <SectionLink to="project-extensions">Request an extension</SectionLink> before your reservation expires.</p>
      </section>}</>
      <>{(canManage || (!participantPreview && (hasParticipation || (data.futureReservations || []).some(item => String(item.musicianId) === String(data.viewerId) && item.state === "waiting")))) && <details id="project-extensions" tabIndex={-1} className="mt-4 rounded-xl border bg-white p-4"><summary className={`cursor-pointer ${heading}`}>Reservations and extensions</summary><section className="mt-6 rounded-xl border bg-white p-5"><h2 className={heading}>Reservations and extensions</h2><div className="mt-3 space-y-3">{(data.futureReservations || []).filter(item => item.state === "waiting" && String(item.musicianId) === String(data.viewerId)).map(item => <div key={item._id} className="rounded border p-3 text-sm"><b>{item.roleName}</b> · reserved for a future round<p className="mt-1 text-gray-600">No countdown yet. We will email when the round opens.</p><button type="button" disabled={busy} onClick={() => act({ method: "post", url: `/projects/${id}/role-reservations/${item._id}/release` }, "Advance place released")} className="mt-2 underline">Release advance reservation</button></div>)}{(canManage ? data.reservations : ownReservations).map((reservation) => <div key={reservation._id} className="rounded border p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span><b>{reservation.roleName}</b> · {reservation.state} · expires {dateTime(reservation.expiresAt)}</span>{String(reservation.musicianId) === String(data.viewerId) && reservation.state === "active" && <button type="button" disabled={busy} onClick={() => act({ method: "post", url: `/reservations/${reservation._id}/release` }, "Reservation released")} className="rounded border px-3 py-1">Release reservation</button>}{String(reservation.musicianId) === String(data.viewerId) && reservation.state === "active" && reservation.extensionCount < 3 ? <button disabled={busy} onClick={() => act({ method: "post", url: `/reservations/${reservation._id}/request-extension` }, "Extension requested") } className="rounded border px-3 py-1">Request extension</button> : null}</div>{canManage && reservation.extensionRequest?.status === "pending" ? <div className="mt-2 flex gap-2"><button onClick={() => act({ method: "post", url: `/reservations/${reservation._id}/grant-extension`, data: { hours: 12 } }, "12-hour extension granted")} className="rounded bg-black px-3 py-1 text-white">Grant 12h</button><button onClick={() => act({ method: "post", url: `/reservations/${reservation._id}/grant-extension`, data: { hours: 24 } }, "24-hour extension granted")} className="rounded bg-black px-3 py-1 text-white">Grant 24h</button></div> : null}</div>)}</div></section></details>}</>
    </div>
  );
};

export default OriginalProjectWorkspace;
