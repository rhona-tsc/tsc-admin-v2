import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import Title from "../components/Title";
import { originalsRequest } from "../utils/originalsApi";

const ModerateOriginals = ({ token }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    originalsRequest(token, { method: "get", url: "/moderation" })
      .then(({ data }) => setProjects(data.projects || []))
      .catch((error) => toast.error(error?.response?.data?.message || "Could not load moderation queue"))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => load(), [load]);

  const decide = async (project, decision) => {
    let reason = "";
    if (decision !== "approve") {
      reason = window.prompt(decision === "reject" ? "Why is this project being rejected?" : "What should the owner change?") || "";
      if (!reason.trim()) return;
    }
    try {
      await originalsRequest(token, { method: "post", url: `/projects/${project._id}/moderate`, data: { decision, reason } });
      toast.success(decision === "approve" ? "Originals project approved" : "Decision sent to owner");
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not moderate project");
    }
  };

  return (
    <div className="px-4 py-8 sm:px-6">
      <Title text1="MODERATE" text2="ORIGINALS LISTINGS" />
      {loading ? <p className="mt-8">Loading queue…</p> : null}
      <div className="mt-6 space-y-4">
        {projects.map((project) => (
          <article key={project._id} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-gray-900">{project.title}</h2><p className="mt-1 text-xs text-gray-500">{project.ownerName} · {project.ownerEmail}</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-800">Pending moderation</span></div>
            <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700">{project.description}</p>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2"><div><dt className="font-semibold">Genres</dt><dd>{(project.genres || []).join(", ")}</dd></div><div><dt className="font-semibold">Roles</dt><dd>{(project.requestedRoles || []).map((role) => `${role.name}${role.foundationEligible ? " (foundation)" : ""}`).join(", ")}</dd></div></dl>
            <div className="mt-5 flex flex-wrap gap-2"><button onClick={() => decide(project, "approve")} className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white">Approve</button><button onClick={() => decide(project, "request_changes")} className="rounded bg-amber-500 px-4 py-2 text-sm font-semibold text-white">Request changes</button><button onClick={() => decide(project, "reject")} className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white">Reject</button></div>
          </article>
        ))}
        {!loading && !projects.length ? <div className="rounded border bg-white p-8 text-center text-gray-500">No Originals projects are awaiting moderation.</div> : null}
      </div>
    </div>
  );
};

export default ModerateOriginals;
