import React from "react";
import TscApprovedBio from "./TscApprovedBio";

const DeputyStepTwo = ({ formData = {}, setFormData = () => {}, userRole, tscApprovedBio, setTscApprovedBio }) => {  
  
  const {
    bio = "",

    academic_credentials = [],
    awards = [],
    tagLine = "",
  } = formData;

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateArrayItem = (arrayName, index, field, value) => {
    const updatedArray = [...(formData[arrayName] || [])];
    updatedArray[index] = { ...updatedArray[index], [field]: value };
    setFormData((prev) => ({ ...prev, [arrayName]: updatedArray }));
  };

  const addItem = (arrayName, itemTemplate) => {
    const updatedArray = [...(formData[arrayName] || []), itemTemplate];
    setFormData((prev) => ({ ...prev, [arrayName]: updatedArray }));
  };

  const removeItem = (arrayName, index) => {
    const updatedArray = [...(formData[arrayName] || [])];
    updatedArray.splice(index, 1);
    setFormData((prev) => ({ ...prev, [arrayName]: updatedArray }));
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="block font-semibold mb-1">Tag Line</label>
        <p>A short and snappy decription of you and your performance style</p>
        <textarea
          className="w-full p-2 border rounded"

          maxLength={160}
          value={tagLine}
          onChange={(e) => updateField("tagLine", e.target.value)}
        ></textarea>
      </div>
      <div>
        <label className="block font-semibold mb-1">Bio</label>
        <textarea
          className="w-full p-2 border rounded"
          rows={4}
          value={bio}
          onChange={(e) => updateField("bio", e.target.value)}
        ></textarea>
      </div>
      

{userRole?.includes("agent") && (
  <TscApprovedBio
    tscApprovedBio={tscApprovedBio}
    setTscApprovedBio={setTscApprovedBio}
  />
)}



      <div>
        <h2 className="font-semibold mb-2">Academic Credentials</h2>
        {academic_credentials.map((cred, index) => (
  <div key={index} className="grid grid-cols-2 gap-4 mb-3">
    <div>
      <label className="block text-sm font-medium text-gray-700">Course</label>
      <input
        type="text"
        value={cred.course || ""}
        onChange={(e) => updateArrayItem("academic_credentials", index, "course", e.target.value)}
        className="p-2 border rounded w-full"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700">Institution</label>
      <input
        type="text"
        value={cred.institution || ""}
        onChange={(e) => updateArrayItem("academic_credentials", index, "institution", e.target.value)}
        className="p-2 border rounded w-full"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700">Years</label>
      <input
        type="text"
        value={cred.years || ""}
        onChange={(e) => updateArrayItem("academic_credentials", index, "years", e.target.value)}
        className="p-2 border rounded w-full"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700">Education Level</label>
      <input
        type="text"
        value={cred.education_level || ""}
        onChange={(e) => updateArrayItem("academic_credentials", index, "education_level", e.target.value)}
        className="p-2 border rounded w-full"
      />
    </div>
    <button
      onClick={() => removeItem("academic_credentials", index)}
      className="text-red-500 text-left col-span-2"
    >
      Remove
    </button>
  </div>
))}
        <button
          onClick={() =>
            addItem("academic_credentials", {
              course: "",
              institution: "",
              years: "",
              education_level: "",
            })
          }
          className="mt-2 text-sm text-blue-600 underline"
        >
          + Add Academic Credential
        </button>
      </div>

      <div>
        <h2 className="font-semibold mb-2">Awards</h2>
        {awards.map((award, index) => (
  <div key={index} className="grid grid-cols-3 gap-4 mb-3">
    <div className="col-span-2">
      <label className="block text-sm font-medium text-gray-700">Description</label>
      <input
        type="text"
        value={award.description || ""}
        onChange={(e) => updateArrayItem("awards", index, "description", e.target.value)}
        className="p-2 border rounded w-full"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700">Year Achieved</label>
      <input
        type="text"
        value={award.years || ""}
        onChange={(e) => updateArrayItem("awards", index, "years", e.target.value)}
        className="p-2 border rounded w-full"
      />
    </div>
    <button
      onClick={() => removeItem("awards", index)}
      className="text-red-500 text-left col-span-3"
    >
      Remove
    </button>
  </div>
))}
        <button
          onClick={() =>
            addItem("awards", { description: "", years: "" })
          }
          className="mt-2 text-sm text-blue-600 underline"
        >
          + Add Award
        </button>
      </div>
    </div>
  );
};

export default DeputyStepTwo;