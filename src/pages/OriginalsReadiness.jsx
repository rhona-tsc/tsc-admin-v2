import React, { useEffect, useState } from "react";
import Title from "../components/Title";
import { originalsRequest } from "../utils/originalsApi";

const OriginalsReadiness = ({ token }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    originalsRequest(token, { method: "get", url: "/readiness" })
      .then((response) => setData(response.data))
      .catch((requestError) => setError(requestError?.response?.data?.message || "Could not load readiness dashboard"));
  }, [token]);
  if (error) return <div className="p-8 text-red-700">{error}</div>;
  if (!data) return <div className="p-8">Loading readiness…</div>;
  const cards = [
    ["Active reservations", data.activeReservations],
    ["Queued notifications", data.pendingNotifications],
    ["Credit sheets awaiting confirmation", data.awaitingCredits],
    ["Completed masters", data.completed],
  ];
  return <div className="px-4 py-8 sm:px-6"><Title text1="ORIGINALS" text2="READINESS" /><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="rounded-xl border bg-white p-5"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>)}</div><section className="mt-6 rounded-xl border bg-white p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Projects by workflow state</h2><span className="rounded bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">External delivery off</span></div><div className="mt-4 divide-y">{data.states.map((item) => <div key={item._id} className="flex justify-between py-2 text-sm"><span className="capitalize">{item._id.replaceAll("_", " ")}</span><b>{item.count}</b></div>)}</div></section></div>;
};

export default OriginalsReadiness;
