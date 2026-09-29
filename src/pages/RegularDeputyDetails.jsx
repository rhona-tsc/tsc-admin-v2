import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { backendUrl } from "../App";

const RegularDeputyDetails = () => {
  const { token } = useParams();
  const [request, setRequest] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);
  const [form, setForm] = useState({
    address: { line1: "", line2: "", town: "", county: "", postcode: "", country: "United Kingdom" },
    dietaryRequirements: "", carRegistration: "", accountName: "", accountNumber: "", sortCode: "",
    canDJ: false, haveMixingConsoleOrDecks: false, hasDjTable: false, haveBooth: false,
    wireless: false, haveSoloPa: false, haveDuoPa: false,
  });
  useEffect(() => {
    axios.get(`${backendUrl}/api/regular-deputies/details/${token}`)
      .then(({ data }) => { setRequest(data.request); setForm((current) => ({ ...current, address: { ...current.address, ...(data.request.address || {}) } })); })
      .catch((requestError) => setError(requestError?.response?.data?.message || "This link could not be opened"));
  }, [token]);
  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const setAddress = (name, value) => setForm((current) => ({ ...current, address: { ...current.address, [name]: value } }));
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try { await axios.post(`${backendUrl}/api/regular-deputies/details/${token}`, form); setComplete(true); }
    catch (requestError) { setError(requestError?.response?.data?.message || "Your details could not be saved"); }
    finally { setSaving(false); }
  };
  if (complete) return <div className="mx-auto max-w-xl px-4 py-16 text-center"><h1 className="text-2xl font-bold">Thank you</h1><p className="mt-3 text-gray-600">Your act details have been securely updated. You can close this page.</p></div>;
  if (error && !request) return <div className="mx-auto max-w-xl px-4 py-16 text-center text-red-700">{error}</div>;
  if (!request) return <div className="p-10 text-center">Opening your secure form…</div>;
  const checks = [
    ["canDJ", "I can DJ"], ["haveMixingConsoleOrDecks", "I have a mixing console or decks"],
    ["hasDjTable", "I have a DJ table"], ["haveBooth", "I have a DJ booth"],
    ["wireless", "I can perform wirelessly"], ["haveSoloPa", "I have a suitable solo PA"],
    ["haveDuoPa", "I have a suitable duo PA"],
  ];
  return <div className="mx-auto max-w-3xl px-4 py-10"><h1 className="text-2xl font-bold">Act member details</h1><p className="mt-2 text-gray-600">Hi {request.musicianName}, please complete these details for your <b>{request.roleName}</b> role with <b>{request.actName}</b>. Fees and special-date rates are managed separately by TSC or the act manager.</p><form onSubmit={submit} className="mt-6 space-y-6 rounded-xl border bg-white p-6 shadow-sm">
    <section><h2 className="font-semibold">Home address</h2><div className="mt-3 grid gap-3 sm:grid-cols-2"><input required value={form.address.line1} onChange={(e) => setAddress("line1", e.target.value)} placeholder="Address line 1" className="rounded border px-3 py-2" /><input value={form.address.line2} onChange={(e) => setAddress("line2", e.target.value)} placeholder="Address line 2" className="rounded border px-3 py-2" /><input required value={form.address.town} onChange={(e) => setAddress("town", e.target.value)} placeholder="Town or city" className="rounded border px-3 py-2" /><input value={form.address.county} onChange={(e) => setAddress("county", e.target.value)} placeholder="County" className="rounded border px-3 py-2" /><input required value={form.address.postcode} onChange={(e) => setAddress("postcode", e.target.value)} placeholder="Postcode" className="rounded border px-3 py-2" /><input value={form.address.country} onChange={(e) => setAddress("country", e.target.value)} placeholder="Country" className="rounded border px-3 py-2" /></div></section>
    <section><h2 className="font-semibold">Travel and catering</h2><div className="mt-3 grid gap-3 sm:grid-cols-2"><input required value={form.carRegistration} onChange={(e) => setField("carRegistration", e.target.value)} placeholder="Car registration, or No vehicle" className="rounded border px-3 py-2" /><input required value={form.dietaryRequirements} onChange={(e) => setField("dietaryRequirements", e.target.value)} placeholder="Dietary requirements/allergies, or None" className="rounded border px-3 py-2" /></div></section>
    <section><h2 className="font-semibold">Payment details</h2><p className="mt-1 text-xs text-gray-500">Enter these only in this secure form—never by email.</p><div className="mt-3 grid gap-3 sm:grid-cols-3"><input required value={form.accountName} onChange={(e) => setField("accountName", e.target.value)} placeholder="Account name" className="rounded border px-3 py-2" /><input required inputMode="numeric" value={form.sortCode} onChange={(e) => setField("sortCode", e.target.value)} placeholder="6-digit sort code" className="rounded border px-3 py-2" /><input required inputMode="numeric" value={form.accountNumber} onChange={(e) => setField("accountNumber", e.target.value)} placeholder="8-digit account number" className="rounded border px-3 py-2" /></div></section>
    <section><h2 className="font-semibold">Capabilities and equipment</h2><div className="mt-3 grid gap-2 sm:grid-cols-2">{checks.map(([name, label]) => <label key={name} className="flex items-center gap-2 rounded border p-3 text-sm"><input type="checkbox" checked={form[name]} onChange={(e) => setField(name, e.target.checked)} />{label}</label>)}</div></section>
    {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}<button disabled={saving} className="w-full rounded bg-black px-4 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Saving securely…" : "Submit my details"}</button>
  </form></div>;
};

export default RegularDeputyDetails;
