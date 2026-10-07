import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Title from "../components/Title";
import { backendUrl } from "../App";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}`, token });
const fullName = (person) => [person?.firstName, person?.lastName].filter(Boolean).join(" ") || "Not assigned";

const RegularDeputies = ({ token }) => {
  const [acts, setActs] = useState([]);
  const [selectedActId, setSelectedActId] = useState("");
  const [selectedLineupId, setSelectedLineupId] = useState("");
  const [search, setSearch] = useState({});
  const [results, setResults] = useState({});
  const [busy, setBusy] = useState("");
  const [detailsLinks, setDetailsLinks] = useState({});

  const load = useCallback(async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/regular-deputies`, { headers: authHeaders(token) });
      const nextActs = response.data.acts || [];
      setActs(nextActs);
      setSelectedActId((current) => current || String(nextActs[0]?._id || ""));
    } catch (error) { toast.error(error?.response?.data?.message || "Could not load regular deputies"); }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const selectedAct = useMemo(() => acts.find((act) => String(act._id) === selectedActId), [acts, selectedActId]);
  useEffect(() => {
    if (!selectedAct) return;
    setSelectedLineupId((current) => selectedAct.lineups.some((lineup) => String(lineup._id) === current) ? current : String(selectedAct.lineups[0]?._id || ""));
  }, [selectedAct]);
  const selectedLineup = selectedAct?.lineups?.find((lineup) => String(lineup._id) === selectedLineupId);

  const findMusicians = async (memberId) => {
    const query = String(search[memberId] || "").trim();
    if (query.length < 2) return toast.error("Enter at least two letters");
    try {
      const response = await axios.get(`${backendUrl}/api/regular-deputies/musicians/search`, { params: { q: query }, headers: authHeaders(token) });
      setResults((current) => ({ ...current, [memberId]: response.data.musicians || [] }));
    } catch (error) { toast.error(error?.response?.data?.message || "Search failed"); }
  };
  const update = async (role, action, musicianId, extra = {}) => {
    const actionKey = `${role.memberId}:${action}:${musicianId || "order"}`;
    try {
      setBusy(actionKey);
      const response = await axios.patch(`${backendUrl}/api/regular-deputies/acts/${selectedAct._id}/lineups/${selectedLineup._id}/members/${role.memberId}`, { action, musicianId, ...extra }, { headers: authHeaders(token) });
      if (response.data.detailsRequest?.formUrl) setDetailsLinks((current) => ({ ...current, [role.memberId]: response.data.detailsRequest.formUrl }));
      toast.success(action === "replace_primary" ? "Original musician updated" : action === "add_deputy" ? "Deputy added" : action === "reorder_deputies" ? "Deputy order updated" : "Deputy removed");
      await load();
    } catch (error) { toast.error(error?.response?.data?.message || "Update failed"); }
    finally { setBusy(""); }
  };

  const moveDeputy = (role, index, offset) => {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= role.deputies.length) return;
    const reordered = [...role.deputies];
    [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
    update(role, "reorder_deputies", "", {
      musicianIds: reordered.map((deputy) => String(deputy.musicianId || deputy.id || "")),
    });
  };

  return <div className="px-4 py-8 sm:px-6">
    <Title text1="REGULAR" text2="DEPUTIES" />
    <p className="mt-3 max-w-3xl text-sm text-gray-600">Original musician is shown first, followed by the regular deputies for each role. Search The Books to replace a primary musician or add deputies without editing the full act.</p>
    <div className="mt-6 grid gap-3 md:grid-cols-2">
      <select value={selectedActId} onChange={(event) => setSelectedActId(event.target.value)} className="rounded border bg-white px-3 py-3 font-semibold"><option value="">Choose an act</option>{acts.map((act) => <option key={act._id} value={act._id}>{act.name} ({act.status})</option>)}</select>
      <select value={selectedLineupId} onChange={(event) => setSelectedLineupId(event.target.value)} className="rounded border bg-white px-3 py-3"><option value="">Choose lineup</option>{(selectedAct?.lineups || []).map((lineup, index) => <option key={lineup._id} value={lineup._id}>{lineup.actSize || `Lineup ${index + 1}`}</option>)}</select>
    </div>
    {selectedAct && selectedLineup ? <div className="mt-6 overflow-x-auto"><div className="flex min-w-max items-start gap-4 pb-4">{selectedLineup.roles.map((role) => {
      const roleResults = results[role.memberId] || [];
      return <section key={role.memberId} className="w-80 shrink-0 rounded-xl border bg-white shadow-sm">
        <h2 className="rounded-t-xl bg-black px-4 py-3 font-semibold text-white">{role.role}</h2>
        <div className="border-b bg-[#fff7f7] p-4"><div className="flex items-center justify-between gap-2"><p className="text-[11px] font-bold uppercase tracking-wide text-[#b53639]">Original musician</p>{role.detailsRequest ? <span className="rounded bg-amber-200 px-2 py-1 text-[10px] font-bold text-amber-900">DETAILS REQUIRED</span> : null}</div><p className="mt-1 font-semibold">{fullName(role.primary)}</p></div>
        <div className="p-4"><p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Regular deputies</p><div className="mt-2 space-y-2">{role.deputies.map((deputy, index) => <div key={deputy.id || deputy.musicianId} className="flex items-center justify-between gap-2 rounded border px-3 py-2 text-sm"><span className="min-w-0 flex-1 truncate">{fullName(deputy)}</span><div className="flex shrink-0 items-center gap-1"><button type="button" disabled={Boolean(busy) || index === 0} onClick={() => moveDeputy(role, index, -1)} aria-label={`Move ${fullName(deputy)} up`} title="Move up" className="rounded border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-30">↑</button><button type="button" disabled={Boolean(busy) || index === role.deputies.length - 1} onClick={() => moveDeputy(role, index, 1)} aria-label={`Move ${fullName(deputy)} down`} title="Move down" className="rounded border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-30">↓</button><button disabled={Boolean(busy)} onClick={() => window.confirm(`Remove ${fullName(deputy)} as a deputy for ${role.role}?`) && update(role, "remove_deputy", deputy.musicianId)} className="ml-1 text-xs text-red-600 hover:underline">Remove</button></div></div>)}{!role.deputies.length ? <p className="rounded border border-dashed p-3 text-sm text-gray-400">No deputies assigned</p> : null}</div></div>
        <div className="border-t p-4">{detailsLinks[role.memberId] ? <div className="mb-3 rounded border border-amber-200 bg-amber-50 p-3 text-xs"><b>Details request prepared.</b><p className="mt-1">Email delivery is queued but switched off during development.</p><button onClick={() => navigator.clipboard.writeText(detailsLinks[role.memberId]).then(() => toast.success("Secure form link copied"))} className="mt-2 rounded border bg-white px-2 py-1 font-semibold">Copy secure form link</button></div> : null}<div className="flex gap-2"><input value={search[role.memberId] || ""} onChange={(event) => setSearch((current) => ({ ...current, [role.memberId]: event.target.value }))} onKeyDown={(event) => event.key === "Enter" && findMusicians(role.memberId)} placeholder="Search all musicians by name or instrument" className="min-w-0 flex-1 rounded border px-3 py-2 text-sm" /><button onClick={() => findMusicians(role.memberId)} className="rounded border px-3 py-2 text-sm">Find</button></div>{roleResults.length ? <div className="mt-3"><p className="mb-2 text-xs text-gray-500">{roleResults.length} musician{roleResults.length === 1 ? "" : "s"} found</p><div className="max-h-72 space-y-2 overflow-y-auto">{roleResults.map((musician) => <div key={musician._id} className="rounded border p-2"><p className="text-sm font-semibold">{musician.name}</p><p className="truncate text-xs text-gray-500">{musician.instruments.join(", ") || musician.email}</p><div className="mt-2 flex gap-2"><button disabled={Boolean(busy)} onClick={() => update(role, "add_deputy", musician._id)} className="flex-1 rounded bg-black px-2 py-1.5 text-xs font-semibold text-white">Add deputy</button><button disabled={Boolean(busy)} onClick={() => window.confirm(`Replace ${fullName(role.primary)} with ${musician.name} as the original ${role.role}?`) && update(role, "replace_primary", musician._id)} className="flex-1 rounded border px-2 py-1.5 text-xs font-semibold">Make original</button></div></div>)}</div></div> : null}</div>
      </section>;
    })}</div></div> : <div className="mt-8 rounded border bg-white p-8 text-center text-gray-500">Choose an act and lineup to manage its regular deputies.</div>}
  </div>;
};

export default RegularDeputies;
