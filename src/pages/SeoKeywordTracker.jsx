import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../App";

const blankKeyword = () => ({ term: "", targetUrl: "", source: "manual", active: true });
const position = (value) => (value == null ? "—" : Number(value).toFixed(1));
const change = (value) => {
  if (value == null) return "—";
  const number = Number(value);
  return `${number > 0 ? "+" : ""}${number.toFixed(1)}`;
};
const monthLabel = (value) => {
  if (!value) return "No report yet";
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};

export default function SeoKeywordTracker({ token }) {
  const [tracker, setTracker] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [configured, setConfigured] = useState(false);
  const [oauthAvailable, setOauthAvailable] = useState(false);
  const [oauthCallback, setOauthCallback] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const auth = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await axios.get(`${backendUrl}/api/seo-keywords`, { headers: auth });
      setTracker(data.tracker);
      setSnapshots(data.snapshots || []);
      setConfigured(Boolean(data.configured));
      setOauthAvailable(Boolean(data.oauthAvailable));
      setOauthCallback(data.oauthCallback || "");
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message);
    } finally {
      setLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("google") === "connected") toast.success("Google Search Console connected");
    if (params.get("google") === "error") toast.error(params.get("detail") || "Google connection failed");
    if (params.has("google")) window.history.replaceState({}, "", window.location.pathname);
  }, []);

  const latest = snapshots[0];
  const rowsByKeyword = useMemo(
    () => new Map((latest?.rows || []).map((row) => [row.keyword.toLowerCase(), row])),
    [latest],
  );

  const updateKeyword = (index, field, value) => {
    setTracker((current) => ({
      ...current,
      keywords: current.keywords.map((keyword, keywordIndex) =>
        keywordIndex === index ? { ...keyword, [field]: value } : keyword,
      ),
    }));
  };

  const save = async () => {
    try {
      setBusy("save");
      const { data } = await axios.put(
        `${backendUrl}/api/seo-keywords`,
        {
          propertyUrl: tracker.propertyUrl,
          recipients: tracker.recipients,
          enabled: tracker.enabled,
          sendDay: tracker.sendDay,
          keywords: tracker.keywords,
        },
        { headers: auth },
      );
      setTracker(data.tracker);
      toast.success("Keyword tracker saved");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || requestError.message);
    } finally {
      setBusy("");
    }
  };

  const run = async (endpoint, action, successMessage) => {
    try {
      setBusy(action);
      const { data } = await axios.post(`${backendUrl}/api/seo-keywords/${endpoint}`, {}, { headers: auth });
      if (data.snapshot) {
        setSnapshots((current) => [data.snapshot, ...current.filter((item) => item._id !== data.snapshot._id)]);
      }
      toast.success(successMessage);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || requestError.message);
    } finally {
      setBusy("");
    }
  };

  const connectGoogle = async () => {
    try {
      setBusy("connect");
      const { data } = await axios.get(`${backendUrl}/api/seo-keywords/google/start`, { headers: auth });
      window.location.assign(data.authUrl);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || requestError.message);
      setBusy("");
    }
  };

  if (loading) return <div className="p-6">Loading keyword tracker…</div>;
  if (!tracker) return <div className="p-6 text-red-700">{error || "Could not load the tracker."}</div>;

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">SEO keyword tracker</h1>
          <p className="mt-1 text-sm text-slate-600">
            Monthly Google Search Console rankings, clicks and impressions for the fixed watchlist.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => run("refresh", "refresh", "Latest completed month loaded")}
            disabled={!configured || busy}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 disabled:opacity-50"
          >
            {busy === "refresh" ? "Refreshing…" : "Refresh report"}
          </button>
          <button
            type="button"
            onClick={() => run("send-test", "email", "Report email sent")}
            disabled={!configured || busy}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy === "email" ? "Sending…" : "Send report now"}
          </button>
        </div>
      </div>

      {!configured && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <strong>Google connection required.</strong> Connect the Google account that owns the
              Search Console property. Access is read-only.
              {oauthCallback && <div className="mt-1 text-xs text-amber-800">OAuth callback: {oauthCallback}</div>}
            </div>
            <button
              type="button"
              onClick={connectGoogle}
              disabled={!oauthAvailable || busy}
              className="whitespace-nowrap rounded-lg bg-amber-900 px-4 py-2 font-medium text-white disabled:opacity-50"
            >
              {busy === "connect" ? "Opening Google…" : "Connect Google Search Console"}
            </button>
          </div>
        </div>
      )}

      {configured && tracker.googleConnected && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Google Search Console is connected{tracker.googleAccountEmail ? ` as ${tracker.googleAccountEmail}` : ""}.
        </div>
      )}

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-4">
          <label className="text-sm font-medium text-slate-700 lg:col-span-2">
            Search Console property
            <input
              value={tracker.propertyUrl || ""}
              onChange={(event) => setTracker({ ...tracker, propertyUrl: event.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Email recipients
            <input
              value={(tracker.recipients || []).join(", ")}
              onChange={(event) => setTracker({
                ...tracker,
                recipients: event.target.value.split(",").map((item) => item.trim()),
              })}
              placeholder="name@example.com"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Send each month on day
            <input
              type="number"
              min="1"
              max="20"
              value={tracker.sendDay || 4}
              onChange={(event) => setTracker({ ...tracker, sendDay: Number(event.target.value) })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={tracker.enabled !== false}
              onChange={(event) => setTracker({ ...tracker, enabled: event.target.checked })}
            />
            Send the monthly email automatically
          </label>
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="rounded-lg bg-[#ff6667] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy === "save" ? "Saving…" : "Save settings"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-1 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Tracked keywords</h2>
            <p className="text-sm text-slate-500">
              {latest ? `${monthLabel(latest.periodStart)} compared with the previous month` : "Run the first report after connecting Google."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTracker({ ...tracker, keywords: [...tracker.keywords, blankKeyword()] })}
            className="mt-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium sm:mt-0"
          >
            Add keyword
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Keyword</th><th className="px-4 py-3">Target page</th>
                <th className="px-4 py-3 text-right">Impressions</th><th className="px-4 py-3 text-right">Clicks</th>
                <th className="px-4 py-3 text-right">Position</th><th className="px-4 py-3 text-right">Change</th>
                <th className="px-4 py-3">Status</th><th className="px-4 py-3">SEO action</th><th className="px-4 py-3">Track</th><th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tracker.keywords.map((keyword, index) => {
                const row = rowsByKeyword.get(String(keyword.term).toLowerCase()) || {};
                return (
                  <tr key={keyword._id || `${keyword.term}-${index}`} className={!keyword.active ? "opacity-50" : ""}>
                    <td className="min-w-56 px-4 py-3">
                      <input value={keyword.term} onChange={(event) => updateKeyword(index, "term", event.target.value)} className="w-full rounded border border-slate-200 px-2 py-1.5" />
                    </td>
                    <td className="min-w-72 px-4 py-3">
                      <input value={keyword.targetUrl || ""} onChange={(event) => updateKeyword(index, "targetUrl", event.target.value)} placeholder="Relevant page URL" className="w-full rounded border border-slate-200 px-2 py-1.5" />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.impressions ?? "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.clicks ?? "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{position(row.position)}</td>
                    <td className={`px-4 py-3 text-right font-medium tabular-nums ${Number(row.positionChange) > 0 ? "text-emerald-700" : Number(row.positionChange) < 0 ? "text-red-700" : ""}`}>{change(row.positionChange)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.status || "Awaiting report"}</td>
                    <td className="min-w-64 px-4 py-3 text-slate-600">{row.recommendedAction || "Awaiting report"}</td>
                    <td className="px-4 py-3"><input type="checkbox" checked={keyword.active !== false} onChange={(event) => updateKeyword(index, "active", event.target.checked)} /></td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => setTracker({ ...tracker, keywords: tracker.keywords.filter((_, keywordIndex) => keywordIndex !== index) })} className="text-xs font-medium text-red-700">Remove</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
