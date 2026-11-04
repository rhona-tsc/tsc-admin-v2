import OriginalsRoles from "../components/OriginalsRoles";
import OriginalsRecordingGuide from "../components/OriginalsRecordingGuide";
import { openWorkspaceSection } from "../utils/originalsWorkspace";
import OriginalsChat from "../components/OriginalsChat";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Title from "../components/Title";
import OriginalsLayeredPlayer from "../components/OriginalsLayeredPlayer";
import OriginalsRoyalties from "../components/OriginalsRoyalties";
import OriginalsProjectListening from "../components/OriginalsProjectListening";
import { originalsRequest } from "../utils/originalsApi";

const SectionLink = ({ to, children }) => <a href={`#${to}`} onClick={event => { event.preventDefault(); openWorkspaceSection(to); }} className="font-medium underline">{children}</a>;

const dateTime = (value) => value ? new Date(value).toLocaleString("en-GB") : "—";

const ChatWhenOpen = (props) => {
  const [open, setOpen] = useState(false);
  const wrapper = React.useRef(null);
  useEffect(() => {
    const details = wrapper.current?.closest("details");
    const toggle = () => setOpen(details.open);
    toggle();
    details?.addEventListener("toggle", toggle);
    return () => details?.removeEventListener("toggle", toggle);
  }, []);
  return <div ref={wrapper}>{open && <OriginalsChat {...props} />}</div>;
};

const OriginalProjectWorkspace = ({ token, canModerate = false }) => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [participantPreview, setParticipantPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [roleName, setRoleName] = useState("");
  const [creditName, setCreditName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const uploadInput = React.useRef(null);
  const [upload, setUpload] = useState({ file: null, kind: "demo", reservationId: "" });
  const [submission, setSubmission] = useState({ reservationId: "", stemAssetId: "", mixdownAssetId: "", wetStemAssetId: "", songwritingChoice: "master_only", notes: "" });
  const [review, setReview] = useState({});
  const [nextRound, setNextRound] = useState({ type: "instrument", roleName: "" });
  const [invitation, setInvitation] = useState({ musicianId: "", message: "" });
  const [musicianSearch, setMusicianSearch] = useState("");
  const [musicianResults, setMusicianResults] = useState([]);
  const [production, setProduction] = useState({ reservationId: "", outputAssetId: "", notes: "" });
  const [creditOverrideReason, setCreditOverrideReason] = useState("");
  const [concern, setConcern] = useState({ submissionId: "", category: "creative_direction", reason: "" });
  const [issueReplies, setIssueReplies] = useState({});
  const [replacements, setReplacements] = useState({});

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
  const isManager = data?.permissions?.canManage === true;
  const canManage = isManager && !participantPreview;
  const ownReservations = participantPreview ? [] : (data?.reservations || []).filter(item => String(item.musicianId) === String(data?.viewerId) && String(item.roundId) === String(currentRound?._id));
  const activeReservations = ownReservations.filter(item => item.state === "active" && new Date(item.expiresAt) > new Date());
  const ownSubmissions = (data?.submissions || []).filter(item => String(item.musicianId) === String(data?.viewerId));
  const hasParticipation = activeReservations.length > 0 || ownSubmissions.length > 0;
  const roundOpen = currentRound && ["open", "reopened"].includes(currentRound.state) && (!currentRound.closesAt || new Date(currentRound.closesAt) > new Date());
  const slotCount = data?.activeSlotCount || 0;

  useEffect(() => {
    if (!data || participantPreview) return;
    const reservationId = activeReservations[0]?._id || "";
    if (!isManager) setUpload(value => ({ ...value, kind: ["mix", "master"].includes(currentRound?.type) ? currentRound.type : "take_stem", reservationId }));
    setSubmission(value => value.reservationId === reservationId ? value : { ...value, reservationId, stemAssetId: "", mixdownAssetId: "" });
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

  const reserve = () => act({ method: "post", url: `/rounds/${currentRound._id}/reservations`, data: { roleName, anonymous, creditName } }, "24-hour slot reserved");
  const uploadFile = async () => {
    if (!upload.file) return toast.error("Choose a file");
    const body = new FormData();
    body.append("file", upload.file); body.append("kind", upload.kind);
    if (currentRound?._id) body.append("roundId", currentRound._id);
    if (upload.reservationId) body.append("reservationId", upload.reservationId);
    const saved = await act({ method: "post", url: `/projects/${id}/assets`, data: body }, "File uploaded. Choose it in Submit a take when you are ready.");
    if (saved?.asset) {
      setSubmission(current => String(current.reservationId) !== String(upload.reservationId) ? current : {
        ...current,
        ...(upload.kind === "take_stem" && !current.stemAssetId ? { stemAssetId: saved.asset._id } : {}),
        ...(upload.kind === "take_mixdown" && !current.mixdownAssetId ? { mixdownAssetId: saved.asset._id } : {}),
      });
      setUpload(current => ({ ...current, file: null }));
      if (uploadInput.current) uploadInput.current.value = "";
    }
  };
  const openAsset = async (assetId) => {
    try { const response = await originalsRequest(token, { method: "get", url: `/assets/${assetId}/access` }); window.open(response.data.url, "_blank", "noopener,noreferrer"); }
    catch (requestError) { toast.error(requestError?.response?.data?.message || "Could not open file"); }
  };
  const submitTake = () => act({
    method: "post",
    url: `/reservations/${submission.reservationId}/submissions`,
    data: {
      songwritingChoice: submission.songwritingChoice,
      notes: submission.notes,
      takes: [{ label: "Take 1", stemAssetId: submission.stemAssetId, mixdownAssetId: submission.mixdownAssetId, ...(submission.wetStemAssetId ? { wetStemAssetId: submission.wetStemAssetId } : {}) }],
    },
  }, "Take submitted for review");
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
    const takeAssetIds = new Set([String(item.outputAssetId || ""), ...(item.takes || []).flatMap((take) => [String(take.stemAssetId)])]);
    return data.assets.filter((asset) => ["initial_stem", "guide_track", "click_track"].includes(asset.kind) || takeAssetIds.has(String(asset._id)));
  };
  const setRange = (submissionId, index, changes) => {
    const value = review[submissionId] || { selectionMode: "selected_ranges", ranges: [{ startSeconds: "", endSeconds: "", note: "" }], note: "" };
    const ranges = (value.ranges || []).map((range, rangeIndex) => rangeIndex === index ? { ...range, ...changes } : range);
    setReviewField(submissionId, "ranges", ranges);
  };
  const openRound = () => act({ method: "post", url: `/projects/${id}/rounds`, data: nextRound }, `${nextRound.type} round opened`);
  const sendInvitation = () => act({ method: "post", url: `/rounds/${currentRound._id}/invitations`, data: { ...invitation, roleName: currentRound.roleName || roleName } }, "Private invitation queued");
  const searchMusicians = async () => {
    if (musicianSearch.trim().length < 2) return toast.error("Enter at least two letters");
    try {
      const response = await originalsRequest(token, { method: "get", url: "/musicians/search", params: { q: musicianSearch.trim(), projectId: id } });
      setMusicianResults(response.data.musicians || []);
    } catch (requestError) { toast.error(requestError?.response?.data?.message || "Could not search musicians"); }
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/originals" className="mb-4 inline-block text-sm underline md:hidden">← All Originals projects</Link>
      <Title text1="ORIGINALS" text2="WORKSPACE" />
      <div className="mt-4 rounded-xl border bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-xl font-semibold">{data.project.title}</h1><p className="mt-2 text-sm text-gray-600">{data.project.description}</p><p className="mt-3 text-xs uppercase text-gray-500">{String(data.project.state).replaceAll("_", " ")}</p></div>{canManage && canModerate && data.project.moderation?.status === "approved" ? <button disabled={busy} onClick={resendLaunchNotifications} className="rounded border px-4 py-2 text-sm font-semibold disabled:opacity-40">Email preview group</button> : null}</div></div>
      {isManager && <div className="mt-3 flex flex-wrap items-center gap-3"><button type="button" onClick={() => setParticipantPreview(value => !value)} className="rounded border bg-white px-4 py-2 text-sm font-semibold">{participantPreview ? "Return to owner view" : "View as participant"}</button>{participantPreview && <span className="text-sm text-gray-600">Read-only preview of the initial participant screen.</span>}</div>}

      {currentRound ? <section className="mt-6 rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Current {currentRound.type} round</h2>
        <p className="mt-1 text-sm text-gray-600">{currentRound.closesAt ? `Closes ${dateTime(currentRound.closesAt)}` : "The seven-day round starts when the first person reserves a slot."} · {slotCount}/{currentRound.slotLimit} active slots</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <select aria-label="Instrument to reserve" value={roleName} onChange={(event) => setRoleName(event.target.value)} className="w-full min-w-0 rounded border px-3 py-2"><option value="">Choose instrument</option>{(currentRound.type === "foundation" ? currentRound.eligibleRoles : [currentRound.roleName]).map((role) => <option key={role}>{role}</option>)}</select>
          <button disabled={busy || participantPreview || !roleName || !roundOpen || activeReservations.length > 0 || slotCount >= currentRound.slotLimit} onClick={reserve} className="rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{activeReservations.length ? "Your slot is reserved" : "Reserve for 24 hours"}</button>
        </div>
        <details className="mt-3 text-sm"><summary className="cursor-pointer text-gray-600">Credit preferences (optional)</summary><div className="mt-2 flex flex-wrap gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} /> Anonymous</label>
          <input disabled={!anonymous} value={creditName} onChange={(event) => setCreditName(event.target.value)} placeholder="Artistic name" className="rounded border px-3 py-2 disabled:bg-gray-100" /></div></details>
        {!roundOpen && <p className="mt-3 text-sm text-amber-800">This round is awaiting review. The owner will open the next opportunity.</p>}
        {!participantPreview && activeReservations.map(item => <p key={item._id} className="mt-3 rounded bg-emerald-50 p-3 text-sm text-emerald-900">Your {item.roleName} slot is reserved until {dateTime(item.expiresAt)}. Upload your recordings in <SectionLink to="project-files">Files and uploads</SectionLink>, then send them for review in <SectionLink to="submit-take">Submit a take</SectionLink>.</p>)}
        {canManage && <details className="mt-4 border-t pt-3"><summary className="cursor-pointer text-sm font-semibold">Invite musicians privately</summary>        <div className="mt-4 space-y-3 border-t pt-4"><div className="flex gap-2"><input value={musicianSearch} onChange={(event) => setMusicianSearch(event.target.value)} placeholder="Search musicians by name, email or instrument" className="min-w-0 flex-1 rounded border px-3 py-2" /><button onClick={searchMusicians} className="rounded border px-4 py-2 text-sm">Search</button></div>{musicianResults.length ? <select value={invitation.musicianId} onChange={(event) => setInvitation((value) => ({ ...value, musicianId: event.target.value }))} className="w-full rounded border px-3 py-2"><option value="">Choose musician</option>{musicianResults.map((musician) => <option key={musician._id} value={musician._id}>{[musician.firstName, musician.lastName].filter(Boolean).join(" ")} — {musician.instrument || musician.instruments?.join?.(", ") || musician.email}</option>)}</select> : null}<div className="grid gap-3 md:grid-cols-[1fr_auto]"><input value={invitation.message} onChange={(event) => setInvitation((value) => ({ ...value, message: event.target.value }))} placeholder="Optional private invitation message" className="rounded border px-3 py-2" /><button disabled={busy || !invitation.musicianId} onClick={sendInvitation} className="rounded border px-4 py-2 text-sm font-semibold disabled:opacity-40">Invite musician</button></div></div></details>}
      </section> : null}
      <OriginalsRoyalties project={data.project} preview={data.royaltyPreview} credits={latestCredits} />
      <section id="project-guidance" tabIndex={-1} className="scroll-mt-6 mt-4 rounded-xl border bg-white p-4"><h2 className="font-semibold">Guidance for the project</h2><p className="mt-1 text-sm text-gray-600">Listen to the guide or sample before recording. Approved musical parts appear separately as the project develops.</p><OriginalsProjectListening token={token} assets={data.assets} submissions={data.submissions} /></section>
      <OriginalsRoles token={token} projectId={id} roles={data.roleProgress || data.project.requestedRoles.map(role => ({ name: role.name, status: "Awaiting a recording", canRecommend: true }))} readOnly={participantPreview} />

      <>{(canManage && data.submissions.some(item => item.state === "accepted")) && <details className="mt-4 rounded-xl border bg-white p-4"><summary className="cursor-pointer font-semibold">Owner tools: next stage</summary><section className="mt-6 rounded-xl border bg-white p-5"><h2 className="font-semibold">Open the next stage</h2><p className="mt-1 text-sm text-gray-600">At least one appropriate submission must be accepted first. Opening a stage closes the current round.</p><div className="mt-3 grid gap-3 md:grid-cols-3"><select value={nextRound.type} onChange={(event) => setNextRound((value) => ({ ...value, type: event.target.value }))} className="rounded border px-3 py-2"><option value="instrument">Next instrument</option><option value="mix">Competitive mixing</option><option value="master">Competitive mastering</option></select>{nextRound.type === "instrument" ? <select value={nextRound.roleName} onChange={(event) => setNextRound((value) => ({ ...value, roleName: event.target.value }))} className="rounded border px-3 py-2"><option value="">Choose role</option>{data.project.requestedRoles.map((role) => <option key={role.name}>{role.name}</option>)}</select> : <div className="rounded bg-gray-50 px-3 py-2 text-sm text-gray-600">Three 24-hour competitive slots</div>}<button disabled={busy || (nextRound.type === "instrument" && !nextRound.roleName)} onClick={openRound} className="rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Open stage</button></div></section></details>}</>

      <><details id="project-files" tabIndex={-1} className="scroll-mt-6 mt-4 rounded-xl border bg-white p-4"><summary className="cursor-pointer font-semibold">Files and uploads</summary><section className="mt-4 min-w-0">
        <h2 className="font-semibold">Project files & your uploads</h2><p className="mt-2 text-sm text-gray-600">1. Upload your recordings here. 2. Choose those uploaded files in <SectionLink to="submit-take">Submit a take</SectionLink> and send them for review. An upload alone is not a submission. Your unsubmitted recordings are visible to you and the owner. The expiry time shown is your reservation deadline, not an automatic deletion time for files.</p>
        {(canManage || (!participantPreview && activeReservations.length > 0)) && <><div className="mt-3 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-4">
          <select value={upload.kind} onChange={(event) => setUpload((value) => ({ ...value, kind: event.target.value }))} aria-label="Type of recording to upload" className="w-full min-w-0 rounded border px-3 py-2">{(canManage ? [["demo", "Demo"], ["guide_track", "Guide track"], ["video_submission", "Video submission"], ["click_track", "Click track"], ["initial_stem", "Initial stem"], ["take_stem", "Your part only (stem)"], ["take_mixdown", "Listening mix with the project"], ["mix", "Mix output"], ["master", "Master output"]] : [["take_stem", "Your part only (stem)"], ["take_mixdown", "Listening mix with the project"], ...(["mix", "master"].includes(currentRound?.type) ? [[currentRound.type, `${currentRound.type} output`]] : [])]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <select value={upload.reservationId} onChange={(event) => setUpload((value) => ({ ...value, reservationId: event.target.value }))} aria-label="Reservation for this upload" className="w-full min-w-0 rounded border px-3 py-2"><option value="">Project reference (no reservation)</option>{activeReservations.map((item) => <option key={item._id} value={item._id}>{item.roleName} — expires {dateTime(item.expiresAt)}</option>)}</select>
          <input ref={uploadInput} type="file" accept="audio/*,video/mp4,video/quicktime,.wav,.aiff,.flac,.m4a,.mov" onChange={(event) => setUpload((value) => ({ ...value, file: event.target.files?.[0] || null }))} className="w-full min-w-0 max-w-full rounded border p-2 text-sm" />
          <button disabled={busy || !upload.file} onClick={uploadFile} className="rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Upload file</button>
        </div>
        </>}<p className="mt-3 text-xs text-gray-600">For voice notes and messages, use <SectionLink to="project-chat">Project chat</SectionLink>.</p>
        <div className="mt-4 space-y-2">{!data.assets.length && <p className="rounded bg-gray-50 p-3 text-sm text-gray-600">No files uploaded yet.</p>}{data.assets.map((asset) => <div key={asset._id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm"><span className="min-w-0 break-all">{asset.originalName} <span className="text-gray-400">{({ take_stem: "your part only", take_mixdown: "listening mix", guide_track: "guide", initial_stem: "original stem", demo: "sample", voice_note: "voice note" })[asset.kind] || asset.kind}</span></span><button onClick={() => openAsset(asset._id)} className="text-[#b53639] hover:underline">Open secure link</button></div>)}</div>
      </section></details></>

      <details id="project-chat" tabIndex={-1} className="scroll-mt-6 mt-4 rounded-xl border bg-white p-4"><summary className="cursor-pointer font-semibold">Project chat</summary><ChatWhenOpen key={id} token={token} projectId={id} viewerId={data.viewerId} initialMessages={data.messages} readOnly={participantPreview} onAccessLost={setError} /></details>



      {!currentRound || !["mix", "master"].includes(currentRound.type) ? <>{(canManage) && <details className="mt-4 rounded-xl border bg-white p-4"><summary className="cursor-pointer font-semibold">Owner tools: review submissions</summary><section className="mt-6 rounded-xl border bg-white p-5">
        <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Submission review</h2>{currentRound && !["open", "reopened"].includes(currentRound.state) ? <button disabled={busy} onClick={() => act({ method: "post", url: `/rounds/${currentRound._id}/reopen`, data: { reason: "Reopened from admin preview" } }, "Round reopened; the seven-day clock starts with the first reservation")} className="rounded border px-3 py-2 text-sm">Reopen round</button> : null}</div>
        <div className="mt-4 space-y-5">{data.submissions.map((item) => {
          const value = review[item._id] || { selectionMode: "whole_take", selectedTakeId: item.takes?.[0]?._id || "", ranges: [{ startSeconds: "", endSeconds: "", note: "" }], note: "" };
          return <article key={item._id} className="rounded-lg border p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><b>{item.roleName}</b><span className="ml-2 text-xs text-gray-500">{item.songwritingChoice.replaceAll("_", " ")}</span></div><span className="rounded bg-gray-100 px-2 py-1 text-xs capitalize">{item.state}</span></div>
            <OriginalsLayeredPlayer token={token} tracks={playerTracks(item)} onTimeChange={(seconds) => setReviewField(item._id, "cursorSeconds", seconds.toFixed(2))} />
            {item.takes?.some(take => take.wetStemAssetId) && <details className="mt-3 text-sm"><summary className="cursor-pointer">Optional effects versions — reference for the mix</summary><OriginalsLayeredPlayer token={token} tracks={data.assets.filter(asset => item.takes.some(take => String(take.wetStemAssetId) === String(asset._id)))} /></details>}
            {item.state === "submitted" ? <div className="mt-4 grid gap-3 md:grid-cols-2">
              <select disabled={item.category !== "contribution"} value={value.selectionMode} onChange={(event) => setReviewField(item._id, "selectionMode", event.target.value)} className="rounded border px-3 py-2 disabled:bg-gray-100"><option value="whole_take">Approve entire take/output</option>{item.category === "contribution" ? <option value="selected_ranges">Approve selected time ranges</option> : null}</select>
              {item.category === "contribution" ? <select value={value.selectedTakeId} onChange={(event) => setReviewField(item._id, "selectedTakeId", event.target.value)} className="rounded border px-3 py-2">{item.takes.map((take) => <option key={take._id} value={take._id}>{take.label}</option>)}</select> : <div className="rounded bg-gray-50 px-3 py-2 text-sm capitalize">Complete {item.category} output</div>}
              {value.selectionMode === "selected_ranges" ? <div className="space-y-2 md:col-span-2">{value.ranges.map((range, rangeIndex) => <div key={rangeIndex} className="grid gap-2 rounded border p-2 md:grid-cols-[1fr_1fr_2fr_auto]"><input type="number" min="0" step="0.01" value={range.startSeconds} onChange={(event) => setRange(item._id, rangeIndex, { startSeconds: event.target.value })} placeholder={`Start${value.cursorSeconds ? ` · player ${value.cursorSeconds}` : ""}`} className="rounded border px-3 py-2" /><input type="number" min="0" step="0.01" value={range.endSeconds} onChange={(event) => setRange(item._id, rangeIndex, { endSeconds: event.target.value })} placeholder="End seconds" className="rounded border px-3 py-2" /><input value={range.note} onChange={(event) => setRange(item._id, rangeIndex, { note: event.target.value })} placeholder="Why this section?" className="rounded border px-3 py-2" /><button onClick={() => setReviewField(item._id, "ranges", value.ranges.filter((_, index) => index !== rangeIndex))} className="text-sm text-red-600">Remove</button></div>)}<button onClick={() => setReviewField(item._id, "ranges", [...value.ranges, { startSeconds: value.cursorSeconds || "", endSeconds: "", note: "" }])} className="rounded border px-3 py-2 text-sm">+ Add another range at player position</button></div> : null}
              <textarea value={value.note} onChange={(event) => setReviewField(item._id, "note", event.target.value)} placeholder="Decision note (required when rejecting)" className="rounded border px-3 py-2 md:col-span-2" />
              <button disabled={busy} onClick={() => decideSubmission(item, "accept")} className="rounded bg-emerald-700 px-4 py-2 font-semibold text-white">Accept selection</button><button disabled={busy || !value.note.trim()} onClick={() => decideSubmission(item, "reject")} className="rounded bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-40">Reject and reopen slot</button>
              {item.category === "contribution" ? <div className="rounded border border-dashed p-3 md:col-span-2"><p className="text-sm font-semibold">Replace this submission before the next stage</p><div className="mt-2 grid gap-2 md:grid-cols-2"><select value={replacements[item._id]?.stemAssetId || ""} onChange={(e) => setReplacements((current) => ({ ...current, [item._id]: { ...(current[item._id] || {}), stemAssetId: e.target.value } }))} className="rounded border px-3 py-2"><option value="">New stem</option>{data.assets.filter((asset) => asset.kind === "take_stem" && asset.state === "active" && String(asset.reservationId) === String(item.reservationId) && asset.state === "active").map((asset) => <option key={asset._id} value={asset._id}>{asset.originalName}</option>)}</select><select value={replacements[item._id]?.mixdownAssetId || ""} onChange={(e) => setReplacements((current) => ({ ...current, [item._id]: { ...(current[item._id] || {}), mixdownAssetId: e.target.value } }))} className="rounded border px-3 py-2"><option value="">New mixdown</option>{data.assets.filter((asset) => asset.kind === "take_mixdown" && asset.state === "active" && String(asset.reservationId) === String(item.reservationId) && asset.state === "active").map((asset) => <option key={asset._id} value={asset._id}>{asset.originalName}</option>)}</select><button disabled={busy || !replacements[item._id]?.stemAssetId || !replacements[item._id]?.mixdownAssetId} onClick={() => replaceSubmission(item)} className="rounded border px-3 py-2 text-sm font-semibold md:col-span-2">Replace with updated revision</button></div></div> : null}
            </div> : item.decisionNote ? <p className="mt-3 text-sm text-gray-600">Decision note: {item.decisionNote}</p> : null}
          </article>;
        })}{!data.submissions.length ? <p className="text-sm text-gray-500">No submissions yet.</p> : null}</div>
      </section></details>}</> : null}

      <>{(canManage || (!participantPreview && latestCredits)) && <details className="mt-4 rounded-xl border bg-white p-4"><summary className="cursor-pointer font-semibold">Credits and royalties</summary><section className="mt-6 rounded-xl border bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Credits and royalty confirmation</h2><p className="mt-1 text-sm text-gray-600">Calculated only from accepted contributions, the selected mix and selected master.</p></div>{canManage && <button disabled={busy} onClick={() => act({ method: "post", url: `/projects/${id}/credits` }, "New credit version calculated")} className="rounded bg-black px-4 py-2 text-sm font-semibold text-white">Calculate new version</button>}</div>
        {latestCredits ? <div className="mt-4 space-y-4"><div className="flex items-center justify-between"><b>Version {latestCredits.version}</b><span className="rounded bg-gray-100 px-2 py-1 text-xs capitalize">{latestCredits.state.replaceAll("_", " ")}</span></div><div className="grid gap-4 lg:grid-cols-2"><div><h3 className="text-sm font-semibold">Master income</h3><div className="mt-2 divide-y rounded border">{latestCredits.masterShares.map((share, index) => <div key={`${share.role}-${index}`} className="flex justify-between p-2 text-sm"><span>{share.role}</span><b>{share.percent.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}%</b></div>)}</div></div><div><h3 className="text-sm font-semibold">Songwriting composition</h3><div className="mt-2 divide-y rounded border">{latestCredits.compositionShares.map((share, index) => <div key={`${share.role}-${index}`} className="flex justify-between p-2 text-sm"><span>{share.role}</span><b>{share.percent.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}%</b></div>)}</div></div></div><p className="text-xs text-gray-500">Confirmed by {latestCredits.confirmations.length} of {latestCredits.requiredMusicianIds.length} credited participants.</p>{latestCredits.state === "awaiting_confirmation" ? <div className="grid gap-3 md:grid-cols-[auto_1fr_auto]"><button disabled={busy} onClick={() => act({ method: "post", url: `/credit-versions/${latestCredits._id}/confirm` }, "Your credits are confirmed")} className="rounded border px-4 py-2 text-sm font-semibold">Confirm my credits</button>{canManage && canModerate && <><input value={creditOverrideReason} onChange={(event) => setCreditOverrideReason(event.target.value)} placeholder="Reason for TSC finalisation after response deadline" className="rounded border px-3 py-2" /><button disabled={busy || !creditOverrideReason.trim()} onClick={() => act({ method: "post", url: `/credit-versions/${latestCredits._id}/finalise`, data: { reason: creditOverrideReason } }, "Credits finalised by TSC")} className="rounded bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">TSC finalise</button></>}</div> : canManage ? <button disabled={busy || data.project.state === "approved_master"} onClick={() => act({ method: "post", url: `/projects/${id}/complete` }, "Project completed with approved master")} className="rounded bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-40">Mark approved master complete</button> : null}</div> : <p className="mt-4 text-sm text-gray-500">No credit version calculated yet.</p>}
      </section></details>}</>

      <>{(canManage || (!participantPreview && ownSubmissions.length > 0)) && <details className="mt-4 rounded-xl border bg-white p-4"><summary className="cursor-pointer font-semibold">Concerns and amendments</summary><section className="mt-6 rounded-xl border bg-white p-5"><h2 className="font-semibold">Concerns, remedies and retractions</h2><p className="mt-1 text-sm text-gray-600">A contributor states the reason first, giving the project an opportunity to resolve it. Retraction is confirmed only after that discussion.</p><div className="mt-3 grid gap-2 md:grid-cols-4"><select value={concern.submissionId} onChange={(e) => setConcern((value) => ({ ...value, submissionId: e.target.value }))} className="rounded border px-3 py-2"><option value="">Choose contribution</option>{data.submissions.filter((item) => ["submitted", "accepted"].includes(item.state)).map((item) => <option key={item._id} value={item._id}>{item.roleName} · revision {item.revision || 1}</option>)}</select><select value={concern.category} onChange={(e) => setConcern((value) => ({ ...value, category: e.target.value }))} className="rounded border px-3 py-2"><option value="lyrics">Lyrics</option><option value="creative_direction">Creative direction</option><option value="credit">Credit</option><option value="conduct">Conduct</option><option value="other">Other</option></select><input value={concern.reason} onChange={(e) => setConcern((value) => ({ ...value, reason: e.target.value }))} placeholder="Reason for considering retraction" className="rounded border px-3 py-2" /><button disabled={busy || !concern.submissionId || !concern.reason.trim()} onClick={openConcern} className="rounded border px-3 py-2 font-semibold disabled:opacity-40">Open concern</button></div><div className="mt-4 space-y-3">{(data.issues || []).map((issue) => <article key={issue._id} className="rounded border p-3"><div className="flex justify-between"><b className="capitalize">{issue.category.replaceAll("_", " ")}</b><span className="text-xs capitalize">{issue.state.replaceAll("_", " ")}</span></div><div className="mt-2 space-y-1">{issue.messages.map((message) => <p key={message._id} className="text-sm"><span className="font-semibold capitalize">{message.type.replaceAll("_", " ")}:</span> {message.body}</p>)}</div>{!["resolved", "retraction_confirmed", "cancelled"].includes(issue.state) ? <div className="mt-3"><input value={issueReplies[issue._id] || ""} onChange={(e) => setIssueReplies((current) => ({ ...current, [issue._id]: e.target.value }))} placeholder="Response, remedy or further amendment request" className="w-full rounded border px-3 py-2" /><div className="mt-2 flex flex-wrap gap-2"><button onClick={() => updateIssue(issue._id, "propose_remedy")} className="rounded border px-3 py-1 text-sm">Propose remedy</button><button onClick={() => updateIssue(issue._id, "request_amendments")} className="rounded border px-3 py-1 text-sm">Request further amendments</button><button onClick={() => updateIssue(issue._id, "resolve")} className="rounded bg-emerald-700 px-3 py-1 text-sm text-white">Resolved — remain involved</button><button onClick={() => updateIssue(issue._id, "confirm_retraction")} className="rounded bg-red-700 px-3 py-1 text-sm text-white">Confirm retraction</button></div></div> : null}</article>)}</div></section></details>}</>

      {currentRound && ["mix", "master"].includes(currentRound.type) ? <>{(!participantPreview && activeReservations.length > 0) && <section className="mt-6 rounded-xl border bg-white p-5"><h2 className="font-semibold">Submit {currentRound.type} output</h2><p className="mt-1 text-sm text-gray-600">Upload the finished output above using the matching file type, then submit it here.</p><div className="mt-3 grid gap-3 md:grid-cols-2"><select value={production.reservationId} onChange={(event) => setProduction((value) => ({ ...value, reservationId: event.target.value, outputAssetId: "" }))} className="rounded border px-3 py-2"><option value="">Choose reservation</option>{activeReservations.map((item) => <option key={item._id} value={item._id}>{item.roleName}</option>)}</select><select value={production.outputAssetId} onChange={(event) => setProduction((value) => ({ ...value, outputAssetId: event.target.value }))} className="rounded border px-3 py-2"><option value="">Choose uploaded {currentRound.type}</option>{data.assets.filter((asset) => asset.kind === currentRound.type && String(asset.reservationId) === production.reservationId).map((asset) => <option key={asset._id} value={asset._id}>{asset.originalName}</option>)}</select><textarea value={production.notes} onChange={(event) => setProduction((value) => ({ ...value, notes: event.target.value }))} placeholder="Production notes" className="rounded border px-3 py-2 md:col-span-2" /><button disabled={busy || !production.reservationId || !production.outputAssetId} onClick={submitProduction} className="rounded bg-black px-4 py-2 font-semibold text-white disabled:opacity-40 md:col-span-2">Submit {currentRound.type}</button></div></section>}</> : null}

      <>{(!participantPreview && activeReservations.length > 0 && !["mix", "master"].includes(currentRound?.type)) && <section id="submit-take" tabIndex={-1} className="scroll-mt-6 mt-6 rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Submit a take{activeReservations.find(item => String(item._id) === submission.reservationId)?.roleName ? ` — ${activeReservations.find(item => String(item._id) === submission.reservationId).roleName}` : ""}</h2>
        <p className="mt-1 text-sm text-gray-600">Before submitting, check <SectionLink to="project-chat">Project chat</SectionLink>, <SectionLink to="project-guidance">Guidance for the project</SectionLink> and <SectionLink to="project-files">Files and uploads</SectionLink>. Then choose your uploaded recordings below to request a review.</p><OriginalsRecordingGuide />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium">Your reserved role<select aria-label="Your reserved role" value={submission.reservationId} onChange={(event) => setSubmission((value) => ({ ...value, reservationId: event.target.value, stemAssetId: "", mixdownAssetId: "", wetStemAssetId: "" }))} className="rounded border px-3 py-2"><option value="">Choose active reservation</option>{activeReservations.map((item) => <option key={item._id} value={item._id}>{item.roleName}</option>)}</select></label>
          <fieldset className="rounded border p-3 text-sm"><legend className="px-1 font-semibold">Royalty request if your take is accepted</legend><label className="flex items-center gap-2"><input type="checkbox" checked disabled /> Master royalties — included for accepted recordings</label><label className="mt-2 flex items-center gap-2"><input type="checkbox" checked={submission.songwritingChoice === "songwriting_claim"} onChange={event => setSubmission(value => ({ ...value, songwritingChoice: event.target.checked ? "songwriting_claim" : "master_only" }))} /> Also request songwriting credit</label><p className="mt-2 text-xs text-gray-600">{submission.songwritingChoice === "songwriting_claim" ? "Requesting master royalties and a songwriting contribution. Songwriting shares are confirmed with the project credits." : "Master royalties only. Add songwriting if you contributed to writing the song."}</p></fieldset>
          <label className="text-sm font-medium">Your part only (individual stem)<span className="my-1 block text-xs font-normal text-gray-600">Only your vocal or instrument, without the backing track. Prefer the clean version.</span><select aria-label="Your part only" value={submission.stemAssetId} onChange={(event) => setSubmission((value) => ({ ...value, stemAssetId: event.target.value, wetStemAssetId: value.wetStemAssetId === event.target.value ? "" : value.wetStemAssetId }))} className="w-full min-w-0 rounded border px-3 py-2"><option value="">Choose your uploaded separate recording</option>{data.assets.filter((asset) => asset.kind === "take_stem" && asset.state === "active" && String(asset.reservationId) === submission.reservationId).map((asset) => <option key={asset._id} value={asset._id}>{asset.originalName}</option>)}</select></label>
          <label className="text-sm font-medium">Listening mix with the project<span className="my-1 block text-xs font-normal text-gray-600">Your part and the project track together, so the owner can hear how they fit.</span><select aria-label="Listening mix" value={submission.mixdownAssetId} onChange={(event) => setSubmission((value) => ({ ...value, mixdownAssetId: event.target.value }))} className="w-full min-w-0 rounded border px-3 py-2"><option value="">Choose your uploaded listening mix</option>{data.assets.filter((asset) => asset.kind === "take_mixdown" && asset.state === "active" && String(asset.reservationId) === submission.reservationId).map((asset) => <option key={asset._id} value={asset._id}>{asset.originalName}</option>)}</select></label>
          <label className="text-sm font-medium">Effects version of your part (optional)<select aria-label="Optional effects stem" value={submission.wetStemAssetId} onChange={event => setSubmission(value => ({ ...value, wetStemAssetId: event.target.value }))} className="mt-1 w-full min-w-0 rounded border p-2"><option value="">No additional effects version</option>{data.assets.filter(asset => asset.kind === "take_stem" && asset.state === "active" && String(asset.reservationId) === submission.reservationId && String(asset._id) !== submission.stemAssetId).map(asset => <option key={asset._id} value={asset._id}>{asset.originalName}</option>)}</select></label>
          <p className="text-sm text-gray-600">Missing a file? <SectionLink to="project-files">Upload it first</SectionLink>. The same performance can be supplied clean and with effects.</p>
          <textarea value={submission.notes} onChange={(event) => setSubmission((value) => ({ ...value, notes: event.target.value }))} placeholder="Notes for the project owner" className="rounded border px-3 py-2 md:col-span-2" />
          <button disabled={busy || !submission.reservationId || !submission.stemAssetId || !submission.mixdownAssetId} onClick={submitTake} className="rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 md:col-span-2">Submit take for review</button>
        </div>
        <p className="mt-4 text-sm text-gray-600">Need longer? <SectionLink to="project-extensions">Request an extension</SectionLink> before your reservation expires.</p>
      </section>}</>
      <>{(canManage || (!participantPreview && hasParticipation)) && <details id="project-extensions" tabIndex={-1} className="mt-4 rounded-xl border bg-white p-4"><summary className="cursor-pointer font-semibold">Reservations and extensions</summary><section className="mt-6 rounded-xl border bg-white p-5"><h2 className="font-semibold">Reservations and extensions</h2><div className="mt-3 space-y-3">{(canManage ? data.reservations : ownReservations).map((reservation) => <div key={reservation._id} className="rounded border p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span><b>{reservation.roleName}</b> · {reservation.state} · expires {dateTime(reservation.expiresAt)}</span>{String(reservation.musicianId) === String(data.viewerId) && reservation.state === "active" && reservation.extensionCount < 3 ? <button disabled={busy} onClick={() => act({ method: "post", url: `/reservations/${reservation._id}/request-extension` }, "Extension requested") } className="rounded border px-3 py-1">Request extension</button> : null}</div>{canManage && reservation.extensionRequest?.status === "pending" ? <div className="mt-2 flex gap-2"><button onClick={() => act({ method: "post", url: `/reservations/${reservation._id}/grant-extension`, data: { hours: 12 } }, "12-hour extension granted")} className="rounded bg-black px-3 py-1 text-white">Grant 12h</button><button onClick={() => act({ method: "post", url: `/reservations/${reservation._id}/grant-extension`, data: { hours: 24 } }, "24-hour extension granted")} className="rounded bg-black px-3 py-1 text-white">Grant 24h</button></div> : null}</div>)}</div></section></details>}</>
    </div>
  );
};

export default OriginalProjectWorkspace;
