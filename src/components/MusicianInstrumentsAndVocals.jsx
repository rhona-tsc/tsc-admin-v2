import React from 'react';
import GenresSelector from './GenresSelector';

export default function MusicianInstrumentsAndVocals({formData = {}, setFormData = () => {}}) {
  const safeArray = (v) => (Array.isArray(v) ? v.filter(Boolean) : []);

  // ✅ Use these everywhere in StepFour
  const instrumentation = safeArray(formData.instrumentation).map((i) => ({
    instrument: i?.instrument ?? "",
    skill_level: i?.skill_level ?? "",
    isOther: Boolean(i?.isOther),
  }));

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

  return <section className="space-y-6 rounded-xl border border-gray-200 p-4 sm:p-6">
    <div><h2 className="text-xl font-semibold">Your instruments and vocals</h2><p className="mt-1 text-sm text-gray-500">Choose your roles before uploading footage so your videos use the correct musician title.</p></div>
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
                          {
                            ...item,
                            isOther: true,
                            instrument: item.instrument || "",
                          },
                          index,
                        );
                      } else {
                        updateArrayField(
                          "instrumentation",
                          { ...item, isOther: false, instrument: val },
                          index,
                        );
                      }
                    }}
                  >
                    <option value="">Select Instrument</option>
                    <option value="Electric Guitar">Electric Guitar</option>
                    <option value="Acoustic Guitar">Acoustic Guitar</option>
                    <option value="Electric Bass Guitar">
                      Electric Bass Guitar
                    </option>
                    <option value="Acoustic Bass Guitar">
                      Acoustic Bass Guitar
                    </option>
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
                        index,
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
                        index,
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
                        index,
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
              type="button"
              className="text-red-600 text-sm"
              onClick={() => removeField("instrumentation", index)}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-blue-600 text-sm underline"
          onClick={() =>
            addField("instrumentation", {
              instrument: "",
              skill_level: "",
              isOther: false,
            })
          }
        >
          + Add Instrument
        </button>
      </div>

      {/* VOCALS SECTION */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Vocals</h3>

        {/*
    ✅ Normalise vocals once for safety (no crashes on old/odd shapes)
    - type: always array
    - genres: always array
    - gender/range/rap: always strings
  */}
        {(() => {
          const vv =
            formData?.vocals && typeof formData.vocals === "object"
              ? formData.vocals
              : {};

          const safeType = Array.isArray(vv.type)
            ? vv.type.filter(Boolean)
            : typeof vv.type === "string" && vv.type.trim()
              ? [vv.type.trim()]
              : [];

          const safeGenres = Array.isArray(vv.genres)
            ? vv.genres.filter(Boolean)
            : typeof vv.genres === "string" && vv.genres.trim()
              ? vv.genres
                  .split(",")
                  .map((g) => g.trim())
                  .filter(Boolean)
              : [];

          const safeGender = typeof vv.gender === "string" ? vv.gender : "";
          const safeRange = typeof vv.range === "string" ? vv.range : "";
          const safeRap = typeof vv.rap === "string" ? vv.rap : "";

          const updateVocals = (patch) =>
            setFormData((prev) => ({
              ...prev,
              vocals: {
                ...(prev.vocals && typeof prev.vocals === "object"
                  ? prev.vocals
                  : {}),
                ...patch,
              },
            }));

          return (
            <>
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
                      "I don't sing",
                    ].map((type) => (
                      <label
                        key={type}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={safeType.includes(type)}
                          onChange={() => {
                            let selected = [...safeType];
                            const isSelected = selected.includes(type);

                            if (type === "I don't sing") {
                              selected = isSelected ? [] : ["I don't sing"];
                            } else {
                              selected = selected.filter(
                                (t) => t !== "I don't sing",
                              );
                              if (isSelected) {
                                selected = selected.filter((t) => t !== type);
                              } else {
                                selected.push(type);
                              }
                            }

                            updateVocals({ type: selected });
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
                    <label className="block text-sm font-medium mb-1">
                      Gender
                    </label>
                    <select
                      value={safeGender}
                      onChange={(e) => updateVocals({ gender: e.target.value })}
                      className="border p-2 rounded w-full"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-Binary">Non-Binary</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Can you rap?
                    </label>
                    <select
                      value={safeRap}
                      onChange={(e) => updateVocals({ rap: e.target.value })}
                      className="border p-2 rounded w-full"
                    >
                      <option value="">Select</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Vocal Range
                    </label>
                    <select
                      value={safeRange}
                      onChange={(e) => updateVocals({ range: e.target.value })}
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

              {/* Genre preferences apply to instrumentalists as well as singers. */}
              <GenresSelector
                label="Which genres best suit your playing or singing?"
                selectedGenres={safeGenres}
                onChange={(updatedGenres) =>
                  updateVocals({ genres: updatedGenres })
                }
              />
            </>
          );
        })()}
      </div>

  </section>;
}
