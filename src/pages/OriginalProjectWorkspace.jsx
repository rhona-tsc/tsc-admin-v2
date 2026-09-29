import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Title from "../components/Title";
import OriginalsLayeredPlayer from "../components/OriginalsLayeredPlayer";
import { originalsRequest } from "../utils/originalsApi";

const dateTime = (value) => value ? new Date(value).toLocaleString("en-GB") : "—";

const OriginalProjectWorkspace = ({ token }) => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [roleName, setRoleName] = useState("");
  const [creditName, setCreditName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [upload, setUpload] = useState({ file: null, kind: "demo", reservationId: "" });
  const [submission, setSubmission] = useState({ reservationId: "", stemAssetId: "", mixdownAssetId: "", songwritingChoice: "master_only", notes: "" });
  const [review, setReview] = useState({});
  const [nextRound, setNextRound] = useState({ type: "instrument", roleName: "" });
  const [invitation, setInvitation] = useState({ musicianId: "", message: "" });
  const [musicianSearch, setMusicianSearch] = useState("");
  const [musicianResults, setMusicianResults] = useState([]);
  const [production, setProduction] = useState({ reservationId: "", outputAssetId: "", notes: "" });
  const [creditOverrideReason, setCreditOverrideReason] = useState("");

  const load = useCallback(() => {
    setError("");
    return originalsRequest(token, { method: "get", url: `/projects/${id}/workspace` })
      .then(({ data: response }) => setData(response))
      .catch((requestError) => setError(requestError?.response?.data?.message || "Could not load workspace"));
  }, [id, token]);

  useEffect(() => { load(); }, [load]);
  const currentRound = useMemo(() => data?.rounds?.find((round) => String(round._id) === String(data?.project?.currentRoundId)) || data?.rounds?.at(-1), [data]);
  const activeReservations = (data?.reservations || []).filter((item) => item.state === "active");

  const act = async (request, success) => {
    try { setBusy(true); await originalsRequest(token, request); toast.success(success); await load(); }
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
    await act({ method: "post", url: `/projects/${id}/assets`, data: body }, "Private file uploaded");
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
      takes: [{ label: "Take 1", stemAssetId: submission.stemAssetId, mixdownAssetId: submission.mixdownAssetId }],
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
    return data.assets.filter((asset) => ["initial_stem", "click_track"].includes(asset.kind) || takeAssetIds.has(String(asset._id)));
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
      const response = await originalsRequest(token, { method: "get", url: "/musicians/search", params: { q: musicianSearch.trim() } });
      setMusicianResults(response.data.musicians || []);
    } catch (requestError) { toast.error(requestError?.response?.data?.message || "Could not search musicians"); }
  };
  const submitProduction = () => act({ method: "post", url: `/reservations/${production.reservationId}/production-submissions`, data: { outputAssetId: production.outputAssetId, notes: production.notes } }, "Production output submitted");
  const latestCredits = data?.creditVersions?.[0];

  if (error) return <div className="p-8 text-red-700">{error}</div>;
  if (!data) return <div className="p-8">Loading workspace…</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Title text1="ORIGINALS" text2="WORKSPACE" />
      <div className="mt-4 rounded-xl border bg-white p-5"><h1 className="text-xl font-semibold">{data.project.title}</h1><p className="mt-2 text-sm text-gray-600">{data.project.description}</p><p className="mt-3 text-xs uppercase text-gray-500">{String(data.project.state).replaceAll("_", " ")}</p></div>

      {currentRound ? <section className="mt-6 rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Current {currentRound.type} round</h2>
        <p className="mt-1 text-sm text-gray-600">Closes {dateTime(currentRound.closesAt)} · {activeReservations.length}/{currentRound.slotLimit} active slots</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <select value={roleName} onChange={(event) => setRoleName(event.target.value)} className="rounded border px-3 py-2"><option value="">Choose instrument</option>{(currentRound.type === "foundation" ? currentRound.eligibleRoles : [currentRound.roleName]).map((role) => <option key={role}>{role}</option>)}</select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} /> Anonymous</label>
          <input disabled={!anonymous} value={creditName} onChange={(event) => setCreditName(event.target.value)} placeholder="Artistic name" className="rounded border px-3 py-2 disabled:bg-gray-100" />
          <button disabled={busy || !roleName} onClick={reserve} className="rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Reserve 24 hours</button>
        </div>
        <div className="mt-4 space-y-3 border-t pt-4"><div className="flex gap-2"><input value={musicianSearch} onChange={(event) => setMusicianSearch(event.target.value)} placeholder="Search musicians by name, email or instrument" className="min-w-0 flex-1 rounded border px-3 py-2" /><button onClick={searchMusicians} className="rounded border px-4 py-2 text-sm">Search</button></div>{musicianResults.length ? <select value={invitation.musicianId} onChange={(event) => setInvitation((value) => ({ ...value, musicianId: event.target.value }))} className="w-full rounded border px-3 py-2"><option value="">Choose musician</option>{musicianResults.map((musician) => <option key={musician._id} value={musician._id}>{[musician.firstName, musician.lastName].filter(Boolean).join(" ")} — {musician.instrument || musician.instruments?.join?.(", ") || musician.email}</option>)}</select> : null}<div className="grid gap-3 md:grid-cols-[1fr_auto]"><input value={invitation.message} onChange={(event) => setInvitation((value) => ({ ...value, message: event.target.value }))} placeholder="Optional private invitation message" className="rounded border px-3 py-2" /><button disabled={busy || !invitation.musicianId} onClick={sendInvitation} className="rounded border px-4 py-2 text-sm font-semibold disabled:opacity-40">Invite musician</button></div></div>
      </section> : null}

      <section className="mt-6 rounded-xl border bg-white p-5"><h2 className="font-semibold">Open the next stage</h2><p className="mt-1 text-sm text-gray-600">At least one appropriate submission must be accepted first. Opening a stage closes the current round.</p><div className="mt-3 grid gap-3 md:grid-cols-3"><select value={nextRound.type} onChange={(event) => setNextRound((value) => ({ ...value, type: event.target.value }))} className="rounded border px-3 py-2"><option value="instrument">Next instrument</option><option value="mix">Competitive mixing</option><option value="master">Competitive mastering</option></select>{nextRound.type === "instrument" ? <select value={nextRound.roleName} onChange={(event) => setNextRound((value) => ({ ...value, roleName: event.target.value }))} className="rounded border px-3 py-2"><option value="">Choose role</option>{data.project.requestedRoles.map((role) => <option key={role.name}>{role.name}</option>)}</select> : <div className="rounded bg-gray-50 px-3 py-2 text-sm text-gray-600">Three 24-hour competitive slots</div>}<button disabled={busy || (nextRound.type === "instrument" && !nextRound.roleName)} onClick={openRound} className="rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Open stage</button></div></section>

      <section className="mt-6 rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Private files</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <select value={upload.kind} onChange={(event) => setUpload((value) => ({ ...value, kind: event.target.value }))} className="rounded border px-3 py-2"><option value="demo">Demo</option><option value="click_track">Click track</option><option value="initial_stem">Initial stem</option><option value="take_stem">Take stem</option><option value="take_mixdown">Take mixdown</option><option value="mix">Mix output</option><option value="master">Master output</option></select>
          <select value={upload.reservationId} onChange={(event) => setUpload((value) => ({ ...value, reservationId: event.target.value }))} className="rounded border px-3 py-2"><option value="">No reservation</option>{activeReservations.map((item) => <option key={item._id} value={item._id}>{item.roleName} — expires {dateTime(item.expiresAt)}</option>)}</select>
          <input type="file" accept="audio/*,video/mp4,video/quicktime,.wav,.aiff,.flac,.m4a,.mov" onChange={(event) => setUpload((value) => ({ ...value, file: event.target.files?.[0] || null }))} className="rounded border p-2 text-sm" />
          <button disabled={busy || !upload.file} onClick={uploadFile} className="rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Upload privately</button>
        </div>
        <div className="mt-4 space-y-2">{data.assets.map((asset) => <div key={asset._id} className="flex items-center justify-between rounded border p-3 text-sm"><span>{asset.originalName} <span className="text-gray-400">({asset.kind})</span></span><button onClick={() => openAsset(asset._id)} className="text-[#b53639] hover:underline">Open secure link</button></div>)}</div>
      </section>

      <section className="mt-6 rounded-xl border bg-white p-5"><h2 className="font-semibold">Reservations and extensions</h2><div className="mt-3 space-y-3">{data.reservations.map((reservation) => <div key={reservation._id} className="rounded border p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span><b>{reservation.roleName}</b> · {reservation.state} · expires {dateTime(reservation.expiresAt)}</span>{reservation.state === "active" && reservation.extensionCount < 3 ? <button disabled={busy} onClick={() => act({ method: "post", url: `/reservations/${reservation._id}/request-extension` }, "Extension requested") } className="rounded border px-3 py-1">Request extension</button> : null}</div>{reservation.extensionRequest?.status === "pending" ? <div className="mt-2 flex gap-2"><button onClick={() => act({ method: "post", url: `/reservations/${reservation._id}/grant-extension`, data: { hours: 12 } }, "12-hour extension granted")} className="rounded bg-black px-3 py-1 text-white">Grant 12h</button><button onClick={() => act({ method: "post", url: `/reservations/${reservation._id}/grant-extension`, data: { hours: 24 } }, "24-hour extension granted")} className="rounded bg-black px-3 py-1 text-white">Grant 24h</button></div> : null}</div>)}</div></section>

      {!currentRound || !["mix", "master"].includes(currentRound.type) ? <section className="mt-6 rounded-xl border bg-white p-5">
        <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Submission review</h2>{currentRound && !["open", "reopened"].includes(currentRound.state) ? <button disabled={busy} onClick={() => act({ method: "post", url: `/rounds/${currentRound._id}/reopen`, data: { reason: "Reopened from admin preview" } }, "Round reopened for seven days")} className="rounded border px-3 py-2 text-sm">Reopen round</button> : null}</div>
        <div className="mt-4 space-y-5">{data.submissions.map((item) => {
          const value = review[item._id] || { selectionMode: "whole_take", selectedTakeId: item.takes?.[0]?._id || "", ranges: [{ startSeconds: "", endSeconds: "", note: "" }], note: "" };
          return <article key={item._id} className="rounded-lg border p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><b>{item.roleName}</b><span className="ml-2 text-xs text-gray-500">{item.songwritingChoice.replaceAll("_", " ")}</span></div><span className="rounded bg-gray-100 px-2 py-1 text-xs capitalize">{item.state}</span></div>
            <OriginalsLayeredPlayer token={token} tracks={playerTracks(item)} onTimeChange={(seconds) => setReviewField(item._id, "cursorSeconds", seconds.toFixed(2))} />
            {item.state === "submitted" ? <div className="mt-4 grid gap-3 md:grid-cols-2">
              <select disabled={item.category !== "contribution"} value={value.selectionMode} onChange={(event) => setReviewField(item._id, "selectionMode", event.target.value)} className="rounded border px-3 py-2 disabled:bg-gray-100"><option value="whole_take">Approve entire take/output</option>{item.category === "contribution" ? <option value="selected_ranges">Approve selected time ranges</option> : null}</select>
              {item.category === "contribution" ? <select value={value.selectedTakeId} onChange={(event) => setReviewField(item._id, "selectedTakeId", event.target.value)} className="rounded border px-3 py-2">{item.takes.map((take) => <option key={take._id} value={take._id}>{take.label}</option>)}</select> : <div className="rounded bg-gray-50 px-3 py-2 text-sm capitalize">Complete {item.category} output</div>}
              {value.selectionMode === "selected_ranges" ? <div className="space-y-2 md:col-span-2">{value.ranges.map((range, rangeIndex) => <div key={rangeIndex} className="grid gap-2 rounded border p-2 md:grid-cols-[1fr_1fr_2fr_auto]"><input type="number" min="0" step="0.01" value={range.startSeconds} onChange={(event) => setRange(item._id, rangeIndex, { startSeconds: event.target.value })} placeholder={`Start${value.cursorSeconds ? ` · player ${value.cursorSeconds}` : ""}`} className="rounded border px-3 py-2" /><input type="number" min="0" step="0.01" value={range.endSeconds} onChange={(event) => setRange(item._id, rangeIndex, { endSeconds: event.target.value })} placeholder="End seconds" className="rounded border px-3 py-2" /><input value={range.note} onChange={(event) => setRange(item._id, rangeIndex, { note: event.target.value })} placeholder="Why this section?" className="rounded border px-3 py-2" /><button onClick={() => setReviewField(item._id, "ranges", value.ranges.filter((_, index) => index !== rangeIndex))} className="text-sm text-red-600">Remove</button></div>)}<button onClick={() => setReviewField(item._id, "ranges", [...value.ranges, { startSeconds: value.cursorSeconds || "", endSeconds: "", note: "" }])} className="rounded border px-3 py-2 text-sm">+ Add another range at player position</button></div> : null}
              <textarea value={value.note} onChange={(event) => setReviewField(item._id, "note", event.target.value)} placeholder="Decision note (required when rejecting)" className="rounded border px-3 py-2 md:col-span-2" />
              <button disabled={busy} onClick={() => decideSubmission(item, "accept")} className="rounded bg-emerald-700 px-4 py-2 font-semibold text-white">Accept selection</button><button disabled={busy || !value.note.trim()} onClick={() => decideSubmission(item, "reject")} className="rounded bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-40">Reject and reopen slot</button>
            </div> : item.decisionNote ? <p className="mt-3 text-sm text-gray-600">Decision note: {item.decisionNote}</p> : null}
          </article>;
        })}{!data.submissions.length ? <p className="text-sm text-gray-500">No submissions yet.</p> : null}</div>
      </section> : null}

      <section className="mt-6 rounded-xl border bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Credits and royalty confirmation</h2><p className="mt-1 text-sm text-gray-600">Calculated only from accepted contributions, the selected mix and selected master.</p></div><button disabled={busy} onClick={() => act({ method: "post", url: `/projects/${id}/credits` }, "New credit version calculated")} className="rounded bg-black px-4 py-2 text-sm font-semibold text-white">Calculate new version</button></div>
        {latestCredits ? <div className="mt-4 space-y-4"><div className="flex items-center justify-between"><b>Version {latestCredits.version}</b><span className="rounded bg-gray-100 px-2 py-1 text-xs capitalize">{latestCredits.state.replaceAll("_", " ")}</span></div><div className="grid gap-4 lg:grid-cols-2"><div><h3 className="text-sm font-semibold">Master income</h3><div className="mt-2 divide-y rounded border">{latestCredits.masterShares.map((share, index) => <div key={`${share.role}-${index}`} className="flex justify-between p-2 text-sm"><span>{share.role}</span><b>{share.percent.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}%</b></div>)}</div></div><div><h3 className="text-sm font-semibold">Songwriting composition</h3><div className="mt-2 divide-y rounded border">{latestCredits.compositionShares.map((share, index) => <div key={`${share.role}-${index}`} className="flex justify-between p-2 text-sm"><span>{share.role}</span><b>{share.percent.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}%</b></div>)}</div></div></div><p className="text-xs text-gray-500">Confirmed by {latestCredits.confirmations.length} of {latestCredits.requiredMusicianIds.length} credited participants.</p>{latestCredits.state === "awaiting_confirmation" ? <div className="grid gap-3 md:grid-cols-[auto_1fr_auto]"><button disabled={busy} onClick={() => act({ method: "post", url: `/credit-versions/${latestCredits._id}/confirm` }, "Your credits are confirmed")} className="rounded border px-4 py-2 text-sm font-semibold">Confirm my credits</button><input value={creditOverrideReason} onChange={(event) => setCreditOverrideReason(event.target.value)} placeholder="Reason for TSC finalisation after response deadline" className="rounded border px-3 py-2" /><button disabled={busy || !creditOverrideReason.trim()} onClick={() => act({ method: "post", url: `/credit-versions/${latestCredits._id}/finalise`, data: { reason: creditOverrideReason } }, "Credits finalised by TSC")} className="rounded bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">TSC finalise</button></div> : <button disabled={busy || data.project.state === "approved_master"} onClick={() => act({ method: "post", url: `/projects/${id}/complete` }, "Project completed with approved master")} className="rounded bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-40">Mark approved master complete</button>}</div> : <p className="mt-4 text-sm text-gray-500">No credit version calculated yet.</p>}
      </section>

      {currentRound && ["mix", "master"].includes(currentRound.type) ? <section className="mt-6 rounded-xl border bg-white p-5"><h2 className="font-semibold">Submit {currentRound.type} output</h2><p className="mt-1 text-sm text-gray-600">Upload the finished output above using the matching file type, then submit it here.</p><div className="mt-3 grid gap-3 md:grid-cols-2"><select value={production.reservationId} onChange={(event) => setProduction((value) => ({ ...value, reservationId: event.target.value, outputAssetId: "" }))} className="rounded border px-3 py-2"><option value="">Choose reservation</option>{activeReservations.map((item) => <option key={item._id} value={item._id}>{item.roleName}</option>)}</select><select value={production.outputAssetId} onChange={(event) => setProduction((value) => ({ ...value, outputAssetId: event.target.value }))} className="rounded border px-3 py-2"><option value="">Choose uploaded {currentRound.type}</option>{data.assets.filter((asset) => asset.kind === currentRound.type && String(asset.reservationId) === production.reservationId).map((asset) => <option key={asset._id} value={asset._id}>{asset.originalName}</option>)}</select><textarea value={production.notes} onChange={(event) => setProduction((value) => ({ ...value, notes: event.target.value }))} placeholder="Production notes" className="rounded border px-3 py-2 md:col-span-2" /><button disabled={busy || !production.reservationId || !production.outputAssetId} onClick={submitProduction} className="rounded bg-black px-4 py-2 font-semibold text-white disabled:opacity-40 md:col-span-2">Submit {currentRound.type}</button></div></section> : null}

      <section className="mt-6 rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Submit a take</h2>
        <p className="mt-1 text-sm text-gray-600">Upload the individual stem and its MP3 mixdown above, then pair them here. Up to three takes are supported by the API; this preview form submits one at a time.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <select value={submission.reservationId} onChange={(event) => setSubmission((value) => ({ ...value, reservationId: event.target.value, stemAssetId: "", mixdownAssetId: "" }))} className="rounded border px-3 py-2"><option value="">Choose active reservation</option>{activeReservations.map((item) => <option key={item._id} value={item._id}>{item.roleName}</option>)}</select>
          <select value={submission.songwritingChoice} onChange={(event) => setSubmission((value) => ({ ...value, songwritingChoice: event.target.value }))} className="rounded border px-3 py-2"><option value="master_only">Master royalty only</option><option value="songwriting_claim">Claim songwriting contribution</option></select>
          <select value={submission.stemAssetId} onChange={(event) => setSubmission((value) => ({ ...value, stemAssetId: event.target.value }))} className="rounded border px-3 py-2"><option value="">Choose individual stem</option>{data.assets.filter((asset) => asset.kind === "take_stem" && String(asset.reservationId) === submission.reservationId).map((asset) => <option key={asset._id} value={asset._id}>{asset.originalName}</option>)}</select>
          <select value={submission.mixdownAssetId} onChange={(event) => setSubmission((value) => ({ ...value, mixdownAssetId: event.target.value }))} className="rounded border px-3 py-2"><option value="">Choose mixdown</option>{data.assets.filter((asset) => asset.kind === "take_mixdown" && String(asset.reservationId) === submission.reservationId).map((asset) => <option key={asset._id} value={asset._id}>{asset.originalName}</option>)}</select>
          <textarea value={submission.notes} onChange={(event) => setSubmission((value) => ({ ...value, notes: event.target.value }))} placeholder="Notes for the project owner" className="rounded border px-3 py-2 md:col-span-2" />
          <button disabled={busy || !submission.reservationId || !submission.stemAssetId || !submission.mixdownAssetId} onClick={submitTake} className="rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 md:col-span-2">Submit take</button>
        </div>
      </section>
    </div>
  );
};

export default OriginalProjectWorkspace;
