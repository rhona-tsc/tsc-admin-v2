import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Title from "../components/Title";
import { DEPUTY_GENRE_OPTIONS } from "../constants/deputyGenres";
import { backendUrl } from "../App";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}`, token });
const fullName = (person) =>
  [person?.firstName, person?.lastName].filter(Boolean).join(" ") ||
  "Not assigned";

const RegularDeputies = ({ token }) => {
  const navigate = useNavigate();
  const [acts, setActs] = useState([]);
  const [selectedActId, setSelectedActId] = useState("");
  const [selectedLineupId, setSelectedLineupId] = useState("");
  const [sourceActId, setSourceActId] = useState("");
  const [sourceLineupId, setSourceLineupId] = useState("");
  const [copyToAllLineups, setCopyToAllLineups] = useState(true);
  const [search, setSearch] = useState({});
  const [genreSearch, setGenreSearch] = useState({});
  const [results, setResults] = useState({});
  const [busy, setBusy] = useState("");
  const [detailsLinks, setDetailsLinks] = useState({});
  const [detailsDelivery, setDetailsDelivery] = useState({});
  const [inviteDrafts, setInviteDrafts] = useState({});
  const [testedInviteDrafts, setTestedInviteDrafts] = useState({});

  const load = useCallback(async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/regular-deputies`, {
        headers: authHeaders(token),
      });
      const nextActs = response.data.acts || [];
      setActs(nextActs);
      setSelectedActId((current) => current || String(nextActs[0]?._id || ""));
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Could not load regular deputies",
      );
    }
  }, [token]);
  useEffect(() => {
    load();
  }, [load]);

  const selectedAct = useMemo(
    () => acts.find((act) => String(act._id) === selectedActId),
    [acts, selectedActId],
  );
  useEffect(() => {
    if (!selectedAct) return;
    setSelectedLineupId((current) =>
      selectedAct.lineups.some((lineup) => String(lineup._id) === current)
        ? current
        : String(selectedAct.lineups[0]?._id || ""),
    );
  }, [selectedAct]);
  const selectedLineup = selectedAct?.lineups?.find(
    (lineup) => String(lineup._id) === selectedLineupId,
  );
  const sourceAct = useMemo(
    () => acts.find((act) => String(act._id) === sourceActId),
    [acts, sourceActId],
  );
  const sourceLineup = sourceAct?.lineups?.find(
    (lineup) => String(lineup._id) === sourceLineupId,
  );
  useEffect(() => {
    if (!sourceAct) {
      setSourceLineupId("");
      return;
    }
    setSourceLineupId((current) =>
      sourceAct.lineups.some((lineup) => String(lineup._id) === current)
        ? current
        : String(sourceAct.lineups[0]?._id || ""),
    );
  }, [sourceAct]);

  const findMusicians = async (memberId, genreOverride) => {
    const query = String(search[memberId] || "").trim();
    const genre = String(genreOverride ?? genreSearch[memberId] ?? "").trim();
    const role = selectedLineup?.roles?.find(
      (item) => String(item.memberId) === String(memberId),
    );
    const requirements = role?.essentialAdditionalRoles || [];
    if (query.length < 2 && !genre)
      return toast.error("Enter at least two letters or choose a genre");
    try {
      const response = await axios.get(
        `${backendUrl}/api/regular-deputies/musicians/search`,
        {
          params: {
            q: query,
            genre,
            requirements: JSON.stringify(requirements),
          },
          headers: authHeaders(token),
        },
      );
      setResults((current) => ({
        ...current,
        [memberId]: response.data.musicians || [],
      }));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Search failed");
    }
  };
  const update = async (role, action, musicianId, extra = {}) => {
    const actionKey = `${role.memberId}:${action}:${musicianId || "order"}`;
    try {
      setBusy(actionKey);
      const response = await axios.patch(
        `${backendUrl}/api/regular-deputies/acts/${selectedAct._id}/lineups/${selectedLineup._id}/members/${role.memberId}`,
        { action, musicianId, ...extra },
        { headers: authHeaders(token) },
      );
      if (response.data.detailsRequest?.formUrl) {
        setDetailsLinks((current) => ({
          ...current,
          [role.memberId]: response.data.detailsRequest.formUrl,
        }));
        setDetailsDelivery((current) => ({
          ...current,
          [role.memberId]:
            response.data.detailsRequest.emailDeliveryState || "failed",
        }));
      }
      toast.success(
        action === "replace_primary"
          ? "Original musician updated"
          : action === "add_deputy"
            ? "Deputy added"
            : action === "reorder_deputies"
              ? "Deputy order updated"
              : "Deputy removed",
      );
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Update failed");
    } finally {
      setBusy("");
    }
  };

  const moveDeputy = (role, index, offset) => {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= role.deputies.length) return;
    const reordered = [...role.deputies];
    [reordered[index], reordered[nextIndex]] = [
      reordered[nextIndex],
      reordered[index],
    ];
    update(role, "reorder_deputies", "", {
      musicianIds: reordered.map((deputy) =>
        String(deputy.musicianId || deputy.id || ""),
      ),
    });
  };

  const copyFirstLineup = async () => {
    if (!selectedAct || selectedAct.lineups.length < 2) return;
    const firstLineupName = selectedAct.lineups[0]?.actSize || "first lineup";
    if (
      !window.confirm(
        `Copy the regular deputies from ${firstLineupName} into the matching roles in every other lineup? Existing additional deputies will be kept.`,
      )
    )
      return;

    try {
      setBusy("copy-first-lineup");
      const response = await axios.post(
        `${backendUrl}/api/regular-deputies/acts/${selectedAct._id}/copy-first-lineup`,
        {},
        { headers: authHeaders(token) },
      );
      const added = response.data.deputiesAdded || 0;
      toast.success(
        added
          ? `${added} ${added === 1 ? "deputy was" : "deputies were"} copied to the other lineups`
          : "The other lineups are already up to date",
      );
      await load();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Could not copy the deputies",
      );
    } finally {
      setBusy("");
    }
  };

  const copyFromAct = async () => {
    if (!selectedAct || !selectedLineup || !sourceAct || !sourceLineup) return;
    const destination = copyToAllLineups
      ? `every lineup in ${selectedAct.name}`
      : selectedLineup.actSize || "the selected lineup";
    if (
      !window.confirm(
        `Copy regular deputies from ${sourceAct.name} — ${sourceLineup.actSize || "selected lineup"} into ${destination}? Matching roles will be updated and existing additional deputies will be kept.`,
      )
    )
      return;

    try {
      setBusy("copy-from-act");
      const response = await axios.post(
        `${backendUrl}/api/regular-deputies/acts/${selectedAct._id}/copy-from-act`,
        {
          sourceActId: sourceAct._id,
          sourceLineupId: sourceLineup._id,
          targetLineupId: selectedLineup._id,
          applyToAllLineups: copyToAllLineups,
        },
        { headers: authHeaders(token) },
      );
      const added = response.data.deputiesAdded || 0;
      const matched = response.data.rolesMatched || 0;
      toast.success(
        added
          ? `${added} ${added === 1 ? "deputy was" : "deputies were"} copied across ${matched} matched ${matched === 1 ? "role" : "roles"}`
          : matched
            ? "The matched roles already contain these deputies"
            : "No matching roles were found",
      );
      await load();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Could not copy deputies from that act",
      );
    } finally {
      setBusy("");
    }
  };

  const updateInviteDraft = (memberId, field, value) => {
    setInviteDrafts((current) => ({
      ...current,
      [memberId]: { ...(current[memberId] || {}), [field]: value },
    }));
    setTestedInviteDrafts((current) => ({ ...current, [memberId]: "" }));
  };

  const inviteDraftKey = (memberId) => {
    const draft = inviteDrafts[memberId] || {};
    return JSON.stringify({
      firstName: draft.firstName?.trim() || "",
      lastName: draft.lastName?.trim() || "",
      email: draft.email?.trim().toLowerCase() || "",
    });
  };

  const sendInviteTest = async (role) => {
    const draft = inviteDrafts[role.memberId] || {};
    if (!draft.firstName?.trim() || !draft.email?.trim()) {
      return toast.error("Enter their first name and email address");
    }
    try {
      setBusy(`${role.memberId}:invite-test`);
      await axios.post(
        `${backendUrl}/api/regular-deputies/acts/${selectedAct._id}/lineups/${selectedLineup._id}/members/${role.memberId}/invite-preview`,
        {
          firstName: draft.firstName.trim(),
          lastName: draft.lastName?.trim() || "",
          email: draft.email.trim(),
        },
        { headers: authHeaders(token) },
      );
      setTestedInviteDrafts((current) => ({
        ...current,
        [role.memberId]: inviteDraftKey(role.memberId),
      }));
      toast.success("Test invitation sent to hello@thesupremecollective.co.uk");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not send the test invitation");
    } finally {
      setBusy("");
    }
  };

  const inviteDeputy = async (role) => {
    const draft = inviteDrafts[role.memberId] || {};
    if (!draft.firstName?.trim() || !draft.email?.trim()) {
      return toast.error("Enter their first name and email address");
    }
    if (testedInviteDrafts[role.memberId] !== inviteDraftKey(role.memberId)) {
      return toast.error("Send yourself a test of this invitation before sending it live");
    }
    try {
      setBusy(`${role.memberId}:invite`);
      const response = await axios.post(
        `${backendUrl}/api/regular-deputies/acts/${selectedAct._id}/lineups/${selectedLineup._id}/members/${role.memberId}/invite`,
        {
          firstName: draft.firstName.trim(),
          lastName: draft.lastName?.trim() || "",
          email: draft.email.trim(),
        },
        { headers: authHeaders(token) },
      );
      toast.success(
        response.data.emailSent === false
          ? "Deputy was added, but the invitation email could not be delivered"
          : "Deputy added and invitation emailed",
      );
      setInviteDrafts((current) => ({ ...current, [role.memberId]: {} }));
      setTestedInviteDrafts((current) => ({ ...current, [role.memberId]: "" }));
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not invite deputy");
    } finally {
      setBusy("");
    }
  };

  const postRegularDeputyVacancy = (role) => {
    const applicationDeadline = new Date();
    applicationDeadline.setDate(applicationDeadline.getDate() + 30);
    const deadline = applicationDeadline.toISOString().slice(0, 10);
    const roleName = role.roleLabel || role.role || "musician";
    const selectedGenre = String(genreSearch[role.memberId] || "").trim();

    navigate("/deputy-jobs/create", {
      state: {
        regularDeputyVacancy: true,
        initialValues: {
          jobType: "enquiry",
          title: `Regular ${roleName} for ${selectedAct.name}`,
          date: deadline,
          callTime: "09:00",
          finishTime: "17:00",
          fee: 0,
          requiredInstruments: [role.role || roleName],
          requiredSkills: role.essentialAdditionalRoles || [],
          genres: selectedGenre ? [selectedGenre] : [],
          tags: ["regular deputy vacancy", selectedAct.name],
          notes: `Ongoing opportunity to join ${selectedAct.name} as a regular deputy ${roleName}. The date shown is the application deadline, not a performance date. Please apply with relevant live-performance experience and availability information.`,
          saveClientCard: false,
        },
      },
    });
  };

  return (
    <div className="px-4 py-8 sm:px-6">
      <Title text1="REGULAR" text2="DEPUTIES" />
      <p className="mt-3 max-w-3xl text-sm text-gray-600">
        Original musician is shown first, followed by the regular deputies for
        each role. Search The Books to replace a primary musician or add
        deputies without editing the full act.
      </p>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <select
          value={selectedActId}
          onChange={(event) => setSelectedActId(event.target.value)}
          className="rounded border bg-white px-3 py-3 font-semibold"
        >
          <option value="">Choose an act</option>
          {acts.map((act) => (
            <option key={act._id} value={act._id}>
              {act.name} ({act.status})
            </option>
          ))}
        </select>
        <select
          value={selectedLineupId}
          onChange={(event) => setSelectedLineupId(event.target.value)}
          className="rounded border bg-white px-3 py-3"
        >
          <option value="">Choose lineup</option>
          {(selectedAct?.lineups || []).map((lineup, index) => (
            <option key={lineup._id} value={lineup._id}>
              {lineup.actSize || `Lineup ${index + 1}`}
            </option>
          ))}
        </select>
      </div>
      {selectedAct && selectedLineup ? (
        <section className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold text-blue-950">
              Copy deputies from another act
            </h2>
            <p className="text-sm text-blue-800">
              Deputies are matched by original musician first, then by role.
              Existing additional deputies are retained and duplicates are
              skipped.
            </p>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <select
              value={sourceActId}
              onChange={(event) => setSourceActId(event.target.value)}
              className="rounded border bg-white px-3 py-2"
            >
              <option value="">Choose source act</option>
              {acts
                .filter((act) => String(act._id) !== selectedActId)
                .map((act) => (
                  <option key={act._id} value={act._id}>
                    {act.name} ({act.status})
                  </option>
                ))}
            </select>
            <select
              value={sourceLineupId}
              onChange={(event) => setSourceLineupId(event.target.value)}
              disabled={!sourceAct}
              className="rounded border bg-white px-3 py-2 disabled:bg-gray-100"
            >
              <option value="">Choose source lineup</option>
              {(sourceAct?.lineups || []).map((lineup, index) => (
                <option key={lineup._id} value={lineup._id}>
                  {lineup.actSize || `Lineup ${index + 1}`} —{" "}
                  {(lineup.roles || []).reduce(
                    (total, role) => total + (role.deputies || []).length,
                    0,
                  )}{" "}
                  deputies
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <label className="inline-flex items-center gap-2 text-sm text-blue-950">
              <input
                type="checkbox"
                checked={copyToAllLineups}
                onChange={(event) => setCopyToAllLineups(event.target.checked)}
              />
              Copy into every lineup of {selectedAct.name}
            </label>
            <button
              type="button"
              onClick={copyFromAct}
              disabled={!sourceLineup || Boolean(busy)}
              className="rounded bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "copy-from-act" ? "Copying deputies…" : "Copy deputies"}
            </button>
          </div>
        </section>
      ) : null}
      {selectedAct?.lineups?.length > 1 ? (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={copyFirstLineup}
            disabled={Boolean(busy)}
            className="rounded bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "copy-first-lineup"
              ? "Copying deputies…"
              : "Copy first lineup deputies to all lineups"}
          </button>
        </div>
      ) : null}
      {selectedAct && selectedLineup ? (
        <div className="mt-6 overflow-x-auto">
          <div className="flex min-w-max items-start gap-4 pb-4">
            {selectedLineup.roles.map((role) => {
              const roleResults = results[role.memberId] || [];
              const genreMatchCount = roleResults.filter(
                (musician) => musician.genreMatch,
              ).length;
              const requirementsMatchCount = roleResults.filter(
                (musician) => musician.requirementsMatch,
              ).length;
              return (
                <section
                  key={role.memberId}
                  className="w-80 shrink-0 rounded-xl border bg-white shadow-sm"
                >
                  <h2 className="rounded-t-xl bg-black px-4 py-3 font-semibold text-white">
                    {role.roleLabel || role.role}
                  </h2>
                  <div className="border-b bg-[#fff7f7] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#b53639]">
                        Original musician
                      </p>
                      {role.detailsRequest ? (
                        <span className="rounded bg-amber-200 px-2 py-1 text-[10px] font-bold text-amber-900">
                          DETAILS REQUIRED
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 font-semibold">
                      {fullName(role.primary)}
                    </p>
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      Regular deputies
                    </p>
                    <div className="mt-2 space-y-2">
                      {role.deputies.map((deputy, index) => (
                        <div
                          key={deputy.id || deputy.musicianId}
                          className="rounded border px-3 py-2 text-sm"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <span className="block truncate">
                                {fullName(deputy)}
                              </span>
                              {deputy.invitePending ? (
                                <span className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                                  Invite pending
                                </span>
                              ) : null}
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                disabled={Boolean(busy) || index === 0}
                                onClick={() => moveDeputy(role, index, -1)}
                                aria-label={`Move ${fullName(deputy)} up`}
                                title="Move up"
                                className="rounded border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                disabled={
                                  Boolean(busy) ||
                                  index === role.deputies.length - 1
                                }
                                onClick={() => moveDeputy(role, index, 1)}
                                aria-label={`Move ${fullName(deputy)} down`}
                                title="Move down"
                                className="rounded border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                ↓
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between border-t pt-2">
                            <button
                              type="button"
                              disabled={Boolean(busy)}
                              onClick={() =>
                                window.confirm(
                                  `Make ${fullName(deputy)} the original ${role.roleLabel || role.role} musician instead of ${fullName(role.primary)}?`,
                                ) &&
                                update(
                                  role,
                                  "replace_primary",
                                  deputy.musicianId,
                                )
                              }
                              className="text-xs font-semibold text-blue-700 hover:underline disabled:opacity-50"
                            >
                              Make original
                            </button>
                            <button
                              disabled={Boolean(busy)}
                              onClick={() =>
                                window.confirm(
                                  `Remove ${fullName(deputy)} as a deputy for ${role.roleLabel || role.role}?`,
                                ) &&
                                update(role, "remove_deputy", deputy.musicianId)
                              }
                              className="text-xs text-red-600 hover:underline disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                      {!role.deputies.length ? (
                        <p className="rounded border border-dashed p-3 text-sm text-gray-400">
                          No deputies assigned
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="border-t p-4">
                    {detailsLinks[role.memberId] ? (
                      <div
                        className={`mb-3 rounded border p-3 text-xs ${detailsDelivery[role.memberId] === "sent" ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}
                      >
                        <b>
                          {detailsDelivery[role.memberId] === "sent"
                            ? "Details request emailed."
                            : "Details request prepared, but email delivery failed."}
                        </b>
                        <p className="mt-1">
                          {detailsDelivery[role.memberId] === "sent"
                            ? "The new original musician has received their secure details form link."
                            : "You can copy and send the secure form link manually."}
                        </p>
                        <button
                          onClick={() =>
                            navigator.clipboard
                              .writeText(detailsLinks[role.memberId])
                              .then(() =>
                                toast.success("Secure form link copied"),
                              )
                          }
                          className="mt-2 rounded border bg-white px-2 py-1 font-semibold"
                        >
                          Copy secure form link
                        </button>
                      </div>
                    ) : null}
                    <div className="space-y-2">
                      <select
                        value={genreSearch[role.memberId] || ""}
                        onChange={(event) => {
                          const genre = event.target.value;
                          setGenreSearch((current) => ({
                            ...current,
                            [role.memberId]: genre,
                          }));
                          if (
                            genre ||
                            String(search[role.memberId] || "").trim().length >=
                              2
                          )
                            findMusicians(role.memberId, genre);
                        }}
                        className="w-full rounded border bg-white px-3 py-2 text-sm"
                      >
                        <option value="">All genres and styles</option>
                        {DEPUTY_GENRE_OPTIONS.filter(
                          (genre) => genre !== "Other",
                        ).map((genre) => (
                          <option key={genre} value={genre}>
                            {genre}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <input
                          value={search[role.memberId] || ""}
                          onChange={(event) =>
                            setSearch((current) => ({
                              ...current,
                              [role.memberId]: event.target.value,
                            }))
                          }
                          onKeyDown={(event) =>
                            event.key === "Enter" &&
                            findMusicians(role.memberId)
                          }
                          placeholder="Search all musicians by name or instrument"
                          className="min-w-0 flex-1 rounded border px-3 py-2 text-sm"
                        />
                        <button
                          onClick={() => findMusicians(role.memberId)}
                          className="rounded border px-3 py-2 text-sm"
                        >
                          Find
                        </button>
                      </div>
                    </div>
                    <details className="mt-4 rounded border border-dashed border-[#ff999a] bg-[#fff8f8] p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-[#b53639]">
                        Invite someone not yet on The Books
                      </summary>
                      <p className="mt-2 text-xs text-gray-600">
                        First send a test to hello@thesupremecollective.co.uk.
                        Nothing is sent to the deputy until you approve the test
                        and use the live invitation button.
                      </p>
                      <div className="mt-3 grid gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={inviteDrafts[role.memberId]?.firstName || ""}
                            onChange={(event) =>
                              updateInviteDraft(
                                role.memberId,
                                "firstName",
                                event.target.value,
                              )
                            }
                            placeholder="First name"
                            className="min-w-0 rounded border bg-white px-3 py-2 text-sm"
                          />
                          <input
                            value={inviteDrafts[role.memberId]?.lastName || ""}
                            onChange={(event) =>
                              updateInviteDraft(
                                role.memberId,
                                "lastName",
                                event.target.value,
                              )
                            }
                            placeholder="Last name"
                            className="min-w-0 rounded border bg-white px-3 py-2 text-sm"
                          />
                        </div>
                        <input
                          type="email"
                          value={inviteDrafts[role.memberId]?.email || ""}
                          onChange={(event) =>
                            updateInviteDraft(
                              role.memberId,
                              "email",
                              event.target.value,
                            )
                          }
                          placeholder="Email address"
                          className="rounded border bg-white px-3 py-2 text-sm"
                        />
                        <div className="grid gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => sendInviteTest(role)}
                            disabled={Boolean(busy)}
                            className="rounded border border-[#ff6667] bg-white px-3 py-2 text-sm font-semibold text-[#b53639] hover:bg-[#fff0f0] disabled:opacity-50"
                          >
                            {busy === `${role.memberId}:invite-test`
                              ? "Sending test…"
                              : "Send test to me"}
                          </button>
                          <button
                            type="button"
                            onClick={() => inviteDeputy(role)}
                            disabled={
                              Boolean(busy) ||
                              testedInviteDrafts[role.memberId] !==
                                inviteDraftKey(role.memberId)
                            }
                            className="rounded bg-[#ff6667] px-3 py-2 text-sm font-semibold text-white hover:bg-[#f45152] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {busy === `${role.memberId}:invite`
                              ? "Sending invitation…"
                              : "Approve and send live"}
                          </button>
                        </div>
                        {testedInviteDrafts[role.memberId] ===
                        inviteDraftKey(role.memberId) ? (
                          <p className="text-xs font-medium text-green-700">
                            Test sent. The live invitation is now available and
                            will BCC hello@thesupremecollective.co.uk.
                          </p>
                        ) : null}
                      </div>
                    </details>
                    <button
                      type="button"
                      onClick={() => postRegularDeputyVacancy(role)}
                      className="mt-3 w-full rounded border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-100"
                    >
                      Post a regular deputy vacancy
                    </button>
                    {roleResults.length ? (
                      <div className="mt-3">
                        <p className="mb-2 text-xs text-gray-500">
                          {role.essentialAdditionalRoles?.length
                            ? `${requirementsMatchCount} meet all additional requirements · `
                            : ""}
                          {genreSearch[role.memberId]
                            ? `${genreMatchCount} confirmed style match${genreMatchCount === 1 ? "" : "es"} shown first · `
                            : ""}
                          {roleResults.length} musician
                          {roleResults.length === 1 ? "" : "s"} total
                        </p>
                        <div className="max-h-72 space-y-2 overflow-y-auto">
                          {roleResults.map((musician) => (
                            <div
                              key={musician._id}
                              className={`rounded border p-2 ${musician.requirementsMatch ? "border-emerald-400 bg-emerald-50" : musician.genreMatch ? "border-emerald-300 bg-emerald-50" : ""}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <Link
                                  to={`/musician/${encodeURIComponent(musician.musicianSlug || musician._id)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm font-semibold text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900"
                                  title={`Open ${musician.name}'s profile`}
                                >
                                  {musician.name}
                                </Link>
                                <div className="flex shrink-0 flex-wrap justify-end gap-1">
                                  {musician.requirementsMatch ? (
                                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                      ALL REQUIREMENTS
                                    </span>
                                  ) : null}
                                  {musician.genreMatch ? (
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                      STYLE MATCH
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                              <p className="truncate text-xs text-gray-500">
                                {musician.instruments.join(", ") ||
                                  musician.email}
                              </p>
                              {musician.genres?.length ? (
                                <p className="mt-1 text-xs text-[#b53639]">
                                  {musician.genres.join(", ")}
                                </p>
                              ) : (
                                <p className="mt-1 text-xs text-gray-400">
                                  Styles not added yet
                                </p>
                              )}
                              {role.essentialAdditionalRoles?.length ? (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {role.essentialAdditionalRoles.map(
                                    (requirement) => {
                                      const confirmed =
                                        musician.matchedRequirements?.includes(
                                          requirement,
                                        );
                                      return (
                                        <span
                                          key={requirement}
                                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${confirmed ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-500"}`}
                                          title={
                                            confirmed
                                              ? "Confirmed from profile information"
                                              : "Not confirmed on profile"
                                          }
                                        >
                                          {confirmed ? "✓" : "?"} {requirement}
                                        </span>
                                      );
                                    },
                                  )}
                                </div>
                              ) : null}
                              <div className="mt-2 flex gap-2">
                                <button
                                  disabled={Boolean(busy)}
                                  onClick={() =>
                                    update(role, "add_deputy", musician._id)
                                  }
                                  className="flex-1 rounded bg-black px-2 py-1.5 text-xs font-semibold text-white"
                                >
                                  Add deputy
                                </button>
                                <button
                                  disabled={Boolean(busy)}
                                  onClick={() =>
                                    window.confirm(
                                      `Replace ${fullName(role.primary)} with ${musician.name} as the original ${role.roleLabel || role.role}?`,
                                    ) &&
                                    update(
                                      role,
                                      "replace_primary",
                                      musician._id,
                                    )
                                  }
                                  className="flex-1 rounded border px-2 py-1.5 text-xs font-semibold"
                                >
                                  Make original
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded border bg-white p-8 text-center text-gray-500">
          Choose an act and lineup to manage its regular deputies.
        </div>
      )}
    </div>
  );
};

export default RegularDeputies;
