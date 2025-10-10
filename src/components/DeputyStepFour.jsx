import React, { useState } from "react";
import DeputyRepertoire from './DeputyRepertoire';
import GenresSelector from "./GenresSelector";
import DeputySongModeration from "./DeputySongModeration";



const DeputyStepFour = ({ formData = {}, setFormData = () => {}, userRole, deputyId }) => {

console.log("[DeputyStepFour] deputyId prop:", deputyId);
  const {
    instrumentation = [],
    other_skills = [],
    logistics = []
  } = formData;

  const updateArrayField = (field, value, index) => {
    const updated = [...(formData[field] || [])];
    updated[index] = value;
    setFormData({ [field]: updated });
  };

  const addField = (field, value = "") => {
    setFormData({ [field]: [...(formData[field] || []), value] });
  };

  const removeField = (field, index) => {
    const updated = [...(formData[field] || [])];
    updated.splice(index, 1);
    setFormData({ [field]: updated });
  };

  const toggleCheckboxValue = (field, value) => {
    const current = new Set(formData[field] || []);
    current.has(value) ? current.delete(value) : current.add(value);
    setFormData({ [field]: Array.from(current) });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Instrumentation Section */}
      <div>
        <h3 className="font-semibold mb-2">Instrumentation</h3>
{instrumentation.map((item, index) => (
  <div key={index} className="flex flex-wrap gap-2 mb-2 items-center">
    <div className="flex gap-2 flex-wrap w-full md:w-[50%] items-center">
      {!item.isOther ? (
        <>
          <select
            className="p-2 border rounded flex-1"
            value={item.instrument || ""}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "Other") {
                updateArrayField(
                  "instrumentation",
                  { ...item, isOther: true, instrument: item.instrument || "" },
                  index
                );
              } else {
                updateArrayField(
                  "instrumentation",
                  { ...item, isOther: false, instrument: val },
                  index
                );
              }
            }}
          >
            <option value="">Select Instrument</option>
            <option value="Electric Guitar">Electric Guitar</option>
            <option value="Acoustic Guitar">Acoustic Guitar</option>
            <option value="Electric Bass Guitar">Electric Bass Guitar</option>
            <option value="Acoustic Bass Guitar">Acoustic Bass Guitar</option>
            <option value="Double Bass">Double Bass</option>
            <option value="Keyboard">Keyboard</option>
            <option value="Saxophone">Saxophone</option>
            <option value="Trumpet">Trumpet</option>
            <option value="Trombone">Trombone</option>
            <option value="Violin">Violin</option>
            <option value="Cello">Cello</option>
            <option value="Flute">Flute</option>
            <option value="Percussion">Percussion</option>
            <option value="Cajon">Cajon</option>
            <option value="Electric Drums">Electric Drums</option>
            <option value="Acoustic Drums">Acoustic Drums</option>
            <option value="Mandolin">Mandolin</option>
            <option value="Banjo">Banjo</option>
            <option value="Clarinet">Clarinet</option>
            <option value="Harp">Harp</option>
            <option value="Synth Bass">Synth Bass</option>
            <option value="Other">Other</option>
          </select>
          <select
            className="p-2 border rounded w-32"
            value={item.skill_level || ""}
            onChange={(e) =>
              updateArrayField(
                "instrumentation",
                { ...item, skill_level: e.target.value },
                index
              )
            }
          >
            <option value="">Level</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
          </select>
        </>
      ) : (
        <>
          <input
            className="p-2 border rounded flex-1"
            value={item.instrument || ""}
            onChange={(e) =>
              updateArrayField(
                "instrumentation",
                { ...item, instrument: e.target.value },
                index
              )
            }
            placeholder="Type your instrument here"
          />
          <select
            className="p-2 border rounded w-32"
            value={item.skill_level || ""}
            onChange={(e) =>
              updateArrayField(
                "instrumentation",
                { ...item, skill_level: e.target.value },
                index
              )
            }
          >
            <option value="">Level</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
          </select>
        </>
      )}
    </div>

    <button
      className="text-red-600 text-sm"
      onClick={() => removeField("instrumentation", index)}
    >
      Remove
    </button>
  </div>
))}
        <button className="text-blue-600 text-sm underline" onClick={() => addField("instrumentation", { instrument: "", skill_level: "", isOther: false })}>+ Add Instrument</button>
      </div>

    {/* VOCALS SECTION */}
    <div className="mb-6">
   
      <h3 className="font-semibold mb-2">Vocals</h3>
<div className="flex flex-col md:flex-row gap-6">
  {/* Column 1: Vocal Types */}
  <div className="flex-1">
    <label className="block font-medium mb-2">I'm a:</label>
    <div className="flex flex-col gap-2">
      {[
        "Lead Vocalist",
        "Lead Vocalist-Instrumentalist",
        "Backing Vocalist",
        "Backing Vocalist-Instrumentalist",
        "I don't sing"
      ].map((type) => (
        <label key={type} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Array.isArray(formData.vocals?.type) && formData.vocals.type.includes(type)}
            onChange={() => {
              let selected = Array.isArray(formData.vocals?.type) ? [...formData.vocals.type] : [];
              const isSelected = selected.includes(type);

              if (type === "I don't sing") {
                selected = isSelected ? [] : ["I don't sing"];
              } else {
                selected = selected.filter((t) => t !== "I don't sing");
                if (isSelected) {
                  selected = selected.filter((t) => t !== type);
                } else {
                  selected.push(type);
                }
              }

              setFormData({
                ...formData,
                vocals: {
                  ...formData.vocals,
                  type: selected,
                },
              });
            }}
          />
          {type}
        </label>
      ))}
    </div>
  </div>

  {/* Column 2: Gender, Rap, Range */}
  <div className="flex-1 flex flex-col gap-4">
    <div>
      <label className="block text-sm font-medium mb-1">Gender</label>
      <select
        value={formData.vocals?.gender || ""}
        onChange={(e) =>
          setFormData({
            ...formData,
            vocals: {
              ...formData.vocals,
              gender: e.target.value,
            },
          })
        }
        className="border p-2 rounded w-full"
      >
        <option value="">Select Gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Non-Binary">Non-Binary</option>
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium mb-1">Can you rap?</label>
      <select
        value={formData.vocals?.rap || ""}
        onChange={(e) =>
          setFormData({
            ...formData,
            vocals: {
              ...formData.vocals,
              rap: e.target.value,
            },
          })
        }
        className="border p-2 rounded w-full"
      >
        <option value="">Select</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium mb-1">Vocal Range</label>
      <select
        value={formData.vocals?.range || ""}
        onChange={(e) =>
          setFormData({
            ...formData,
            vocals: {
              ...formData.vocals,
              range: e.target.value,
            },
          })
        }
        className="border p-2 rounded w-full"
      >
        <option value="">Select Vocal Range</option>
        <option value="Soprano">Soprano</option>
        <option value="Mezzo-Soprano">Mezzo-Soprano</option>
        <option value="Alto">Alto</option>
        <option value="Tenor">Tenor</option>
        <option value="Baritone">Baritone</option>
        <option value="Bass">Bass</option>
        <option value="Not sure">Not sure</option>
      </select>
    </div>
  </div>
</div>

{/* Conditionally show genres */}
{Array.isArray(formData.vocals?.type) &&
  formData.vocals.type.length > 0 &&
  !formData.vocals.type.includes("I don't sing") && (
    <GenresSelector
      selectedGenres={formData.vocals?.genres || []}
      onChange={(updatedGenres) =>
        setFormData({
          ...formData,
          vocals: {
            ...formData.vocals,
            genres: updatedGenres,
          },
        })
      }
    />
)}
 
      {/* Genre Tags */}
    
    </div>

      {/* Repertoire Section */}
      <div>
        <h3 className="font-semibold mb-2">Repertoire</h3>
        <p className="text-sm">
          Please select the songs from the database and/or paste your repertoire on the right that you are comfortable performing. Please note, these must be 'gig ready' and require no rehearsals.</p>
          </div>
          <DeputyRepertoire
            customRepertoire={formData.customRepertoire || ""}
            setCustomRepertoire={(value) => setFormData({ ...formData, customRepertoire: value })}
            selectedSongs={formData.selectedSongs || []}
            setSelectedSongs={(value) => setFormData({ ...formData, selectedSongs: value })}
            setRepertoire={(value) => setFormData({ ...formData, repertoire: value })}
            maxHeight="500px"
          />

{userRole?.includes("agent") && (
  <DeputySongModeration
    selectedSongs={formData.selectedSongs || []}
    setSelectedSongs={(value) => setFormData({ ...formData, selectedSongs: value })}
    userRole={userRole}
    deputyId={deputyId}
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
          ].map(skill => (
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
       <div><label className="flex gap-2 items-center">
          <input
            type="checkbox"
            checked={logistics.includes("Transport")}
            onChange={() => toggleCheckboxValue("logistics", "Transport")}
          />
          I have my own transport
        </label>
        </div>
        <div><label className="flex gap-2 items-center">
          <input
            type="checkbox"
            checked={logistics.includes("Carpool Friendly")}
            onChange={() => toggleCheckboxValue("logistics", "Carpool Friendly")}
          />
          I am happy to be asked to carpool
        </label>
        </div>
      </div>
    </div>
  );
};

export default DeputyStepFour;
