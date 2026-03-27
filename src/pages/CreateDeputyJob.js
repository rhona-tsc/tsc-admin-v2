

import React from "react";
import { useNavigate } from "react-router-dom";
import DeputyJobCreateForm from "../components/DeputyJobCreateForm";

const CreateDeputyJob = () => {
  const navigate = useNavigate();

  const handleCreated = (createdJob) => {
    const createdId = createdJob?._id || createdJob?.id;

    if (createdId) {
      navigate(`/deputy-jobs?created=${createdId}`);
      return;
    }

    navigate("/deputy-jobs");
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500 hover:text-black transition-colors"
          >
            ← Back
          </button>

          <div className="mt-4">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-400">
              Deputy opportunities
            </p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-gray-900">
              Create a deputy job
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-3xl leading-7">
              Post a deputy opportunity for suitable musicians to apply in one click.
              Matching members can be notified automatically, and if the job is created by
              a non-admin member, your commission settings will apply on allocation.
            </p>
          </div>
        </div>

        <DeputyJobCreateForm onCreated={handleCreated} />
      </div>
    </div>
  );
};

export default CreateDeputyJob;