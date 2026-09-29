import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Title from "../components/Title";
import { originalsRequest } from "../utils/originalsApi";

const OriginalProjects = ({ token }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    originalsRequest(token, { method: "get", url: "/projects" })
      .then(({ data }) => setProjects(data.projects || []))
      .catch((requestError) => setError(requestError?.response?.data?.message || "Could not load Originals projects"))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="px-4 py-8 sm:px-6">
      <Title text1="ORIGINALS" text2="PROJECTS" />
      <p className="mt-3 max-w-2xl text-sm text-gray-600">Approved collaborations currently open or progressing through TSC Originals.</p>
      {loading ? <p className="mt-8">Loading projects…</p> : null}
      {error ? <div className="mt-8 rounded border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}
      {!loading && !error && !projects.length ? <div className="mt-8 rounded border bg-white p-8 text-center text-gray-500">No approved Originals projects yet.</div> : null}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <article key={project._id} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold text-gray-900">{project.title}</h2>
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs capitalize">{String(project.state || "").replaceAll("_", " ")}</span>
            </div>
            <p className="mt-2 text-xs text-gray-500">By {project.ownerAnonymous ? project.ownerCreditName || "Anonymous" : project.ownerName}</p>
            <p className="mt-4 line-clamp-4 text-sm text-gray-700">{project.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(project.genres || []).map((genre) => <span key={genre} className="rounded bg-[#fff0f0] px-2 py-1 text-xs text-[#b53639]">{genre}</span>)}
            </div>
            <p className="mt-4 text-xs text-gray-500">Seeking {(project.requestedRoles || []).map((role) => role.name).join(", ")}</p>
            <Link to={`/originals/${project._id}`} className="mt-4 inline-block rounded bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-[#ff6667]">Open workspace</Link>
          </article>
        ))}
      </div>
    </div>
  );
};

export default OriginalProjects;
