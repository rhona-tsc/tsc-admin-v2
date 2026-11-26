import React from "react";
import DeputyRepertoire from "./DeputyRepertoire";

import DeputySongModeration from "./DeputySongModeration";


const DeputyStepFour = ({
  formData = {},
  setFormData = () => {},
  userRole,
  deputyId,
  authHeaders = {},
}) => {
  const safeArray = (v) => (Array.isArray(v) ? v.filter(Boolean) : []);

  // ✅ Use these everywhere in StepFour
  const instrumentation = safeArray(formData.instrumentation).map((i) => ({
    instrument: i?.instrument ?? "",
    skill_level: i?.skill_level ?? "",
    isOther: Boolean(i?.isOther),
  }));

  const other_skills = safeArray(formData.other_skills);
  const logistics = safeArray(formData.logistics);

  console.log("[DeputyStepFour] deputyId prop:", deputyId);
  console.log("[DeputyStepFour] initial formData snapshot:", {
    instrumentation: formData.instrumentation,
    other_skills: formData.other_skills,
    logistics: formData.logistics,
    vocals: formData.vocals,
    selectedSongs: formData.selectedSongs,
  });

  const updateArrayField = (field, value, index) => {
    console.log("[DeputyStepFour] updateArrayField:", { field, value, index });
    const updated = [...(formData[field] || [])];
    updated[index] = value;
    setFormData((prev) => ({
      ...prev,
      [field]: updated,
    }));
  };

  const addField = (field, value = "") => {
    console.log("[DeputyStepFour] addField:", { field, value });
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), value],
    }));
  };

  const removeField = (field, index) => {
    console.log("[DeputyStepFour] removeField:", { field, index });
    const updated = [...(formData[field] || [])];
    updated.splice(index, 1);
    setFormData((prev) => ({
      ...prev,
      [field]: updated,
    }));
  };

  const toggleCheckboxValue = (field, value) => {
    console.log("[DeputyStepFour] toggleCheckboxValue:", { field, value });
    const current = new Set(formData[field] || []);
    current.has(value) ? current.delete(value) : current.add(value);
    setFormData((prev) => ({
      ...prev,
      [field]: Array.from(current),
    }));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Repertoire Section */}
      <div>
        <h3 className="font-semibold mb-2">Repertoire</h3>
        <p className="text-sm">
          Please select the songs from the database and/or paste your repertoire
          on the right that you are comfortable performing. Please note, these
          must be 'gig ready' and require no rehearsals.
        </p>
      </div>
<DeputyRepertoire
  customRepertoire={formData.customRepertoire || ""}
  setCustomRepertoire={(value) =>
    setFormData((prev) => ({ ...prev, customRepertoire: value }))
  }
  selectedSongs={formData.selectedSongs || []}
  setSelectedSongs={(value) =>
    setFormData((prev) => ({ ...prev, selectedSongs: value }))
  }
  setRepertoire={(value) =>
    setFormData((prev) => ({ ...prev, repertoire: value }))
  }
  authHeaders={authHeaders}
/>

      {userRole?.includes("agent") && (
       <DeputySongModeration
  selectedSongs={formData.selectedSongs || []}
  setSelectedSongs={(value) =>
    setFormData((prev) => ({ ...prev, selectedSongs: value }))
  }
  userRole={userRole}
  deputyId={deputyId}
  authHeaders={authHeaders}
/>
      )}

      {/* Other Skills Section */}
      <div>
        <h3 className="font-semibold mb-2">Other Skills</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            "Music Production: Mixing",
            "Music Production: Mastering",
            "Live Audio Recording",
            "Sound Engineering",
            "Sound Engineering with PA & Lights Provision",
            "Amp or small PA provision for solo performances",
            "Amp or small PA provision for duo performances",
            "DJ with Mixing Console",
            "DJ with Decks",
            "Roaming Performer",
            "Talkback Experience",
            "Musical Director",
            "Band Leader",
            "Client Liaison",
            "Photography",
            "Videography",
            "Can perform to click track",
            "Can perform to backing track",
            "Can trigger backing tracks",
            "Can curate backing tracks",
            "Can curate setlist",
            "Can perform to live band and backing track",
          ].map((skill) => (
            <label key={skill} className="flex gap-2 items-center text-sm">
              <input
                type="checkbox"
                checked={other_skills.includes(skill)}
                onChange={() => toggleCheckboxValue("other_skills", skill)}
              />
              {skill}
            </label>
          ))}
        </div>
      </div>

      {/* Logistics Section */}
      <div>
        <h3 className="font-semibold mb-2">Logistics</h3>
        <div>
          <label className="flex gap-2 items-center">
            <input
              type="checkbox"
              checked={logistics.includes("Transport")}
              onChange={() => toggleCheckboxValue("logistics", "Transport")}
            />
            I have my own transport
          </label>
        </div>
        <div>
          <label className="flex gap-2 items-center">
            <input
              type="checkbox"
              checked={logistics.includes("Carpool Friendly")}
              onChange={() =>
                toggleCheckboxValue("logistics", "Carpool Friendly")
              }
            />
            I am happy to be asked to carpool
          </label>
        </div>
      </div>
    </div>
  );
};

export default DeputyStepFour;
