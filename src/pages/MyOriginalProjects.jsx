import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Title from "../components/Title";
import { originalsRequest } from "../utils/originalsApi";

const MyOriginalProjects = ({ token }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    originalsRequest(token, { method: "get", url: "/mine" })
      .then(({ data }) => setProjects(data.projects || []))
      .catch((requestError) => setError(requestError?.response?.data?.message || "Could not load your projects"))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><Title text1="MY ORIGINAL" text2="PROJECTS" /><p className="mt-3 text-sm text-gray-600">Track moderation and manage your collaborations.</p></div>
        <Link to="/originals/new" className="rounded bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-[#ff6667]">+ New project</Link>
      </div>
      {loading ? <p className="mt-8">Loading projects…</p> : null}
      {error ? <div className="mt-8 rounded border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}
      <div className="mt-6 space-y-3">
        {projects.map((project) => (
          <article key={project._id} className="flex flex-wrap items-center justify-between gap-4 rounded border bg-white p-4">
            <div><Link to={`/originals/${project._id}`} className="font-semibold hover:text-[#b53639]">{project.title}</Link><p className="mt-1 text-xs text-gray-500">Updated {new Date(project.updatedAt).toLocaleString("en-GB")}</p></div>
            <div className="text-right"><span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize">{String(project.state).replaceAll("_", " ")}</span>{project.moderation?.reason ? <p className="mt-2 max-w-md text-sm text-amber-700">{project.moderation.reason}</p> : null}</div>
          </article>
        ))}
        {!loading && !error && !projects.length ? <div className="rounded border bg-white p-8 text-center text-gray-500">You have not listed an Originals project yet.</div> : null}
      </div>
    </div>
  );
};

export default MyOriginalProjects;
