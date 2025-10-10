import React, { useEffect, useState } from "react";

const DeputyStepFive = ({ formData = {}, setFormData = () => {} }) => {
  const {
    pa_equipment = {},
    equipment_spec = {},
    instrumentation = [],
    other_skills = [],
    vocals = {},
  } = formData;

  // Section display booleans
  const isVocalist = vocals?.type && vocals?.type !== "I don't sing";
  const isSoundEngineerWithPA = other_skills.includes("Sound Engineering with PA & Lights Provision");
  const isInstrumentalistOnly = instrumentation.length > 0 && !isVocalist && !isSoundEngineerWithPA;
  
  // Special logic: Only "Sound Engineering with PA & Lights Provision" checked (and not a vocalist or instrumentalist)
  const isOnlySoundEngineerWithPA =
    isSoundEngineerWithPA &&
    !isVocalist &&
    (!instrumentation || instrumentation.length === 0) &&
    other_skills.filter(
      (s) => s === "Sound Engineering with PA & Lights Provision"
    ).length === 1 &&
    other_skills.length === 1;
  
  
    const updatePaEquipment = (field, value) => {
      setFormData(prev => ({
        ...prev,
        pa_equipment: {
          ...prev.pa_equipment,
          [field]: value,
        },
      }));
    };

  const updateSpec = (field, value) => {
    setFormData({ equipment_spec: { ...equipment_spec, [field]: value } });
  };

  const [instrumentSpecs, setInstrumentSpecs] = useState(
    equipment_spec.instrument_specs || {}
  );

  useEffect(() => {
    setFormData({
      equipment_spec: {
        ...equipment_spec,
        instrument_specs: instrumentSpecs,
      },
    });
  }, [instrumentSpecs]);



  const addInstrumentSpec = (instrument) => {
    const updated = { ...instrumentSpecs };
    if (!updated[instrument]) updated[instrument] = [];
    updated[instrument].push("");
    setInstrumentSpecs(updated);
  };

  const renderQuantityDropdown = (id, value, onChange, className = "") => (
    <select
      id={id}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={`border rounded px-2 py-1 ${className}`}
    >
      <option value="">Select</option>
      {[...Array(30)].map((_, i) => (
        <option key={i + 1} value={i + 1}>
          {i + 1}
        </option>
      ))}
    </select>
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Vocal Mics section (shown for vocalists OR only Sound Engineer with PA) */}
      {(isVocalist || isOnlySoundEngineerWithPA) && (
           <div className="flex flex-col gap-3 w-2/3">
           <h2 className="font-semibold text-lg mb-2">Vocal Microphones</h2>
            <p className="text-sm text-gray-600 mb-2">Please indicate the number of vocal microphones you have in your setup.</p>
          
 
           <div className="flex gap-3">
           <select
               value={pa_equipment.wired_vocal_mics || ""}
               onChange={(e) => updatePaEquipment("wired_vocal_mics", e.target.value)}
               className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
             >
               <option value="">Select if applicable</option>
               <option value="1">1</option>
               <option value="2">2</option>
               <option value="3">3</option>
               <option value="4">4</option>
               <option value="5">5</option>
               <option value="6">6</option>
               <option value="7">7</option>
               <option value="8">8</option>
               <option value="9">9</option>
               <option value="10">10</option>
               <option value="10+">10+</option>
             </select>
             <select
               value={pa_equipment.wireless_vocal_mics || ""}
               onChange={(e) => updatePaEquipment("wireless_vocal_mics", e.target.value)}
               className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
             >
               <option value="">Select if applicable</option>
               <option value="1">1</option>
               <option value="2">2</option>
               <option value="3">3</option>
               <option value="4">4</option>
               <option value="5">5</option>
               <option value="6">6</option>
               <option value="7">7</option>
               <option value="8">8</option>
               <option value="9">9</option>
               <option value="10">10</option>
               <option value="10+">10+</option>
             </select>
             <select
               value={pa_equipment.wireless_vocal_adapters || ""}
               onChange={(e) => updatePaEquipment("wireless_vocal_adapters", e.target.value)}
               className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
             >
               <option value="">Select if applicable</option>
               <option value="1">1</option>
               <option value="2">2</option>
               <option value="3">3</option>
               <option value="4">4</option>
               <option value="5">5</option>
               <option value="6">6</option>
               <option value="7">7</option>
               <option value="8">8</option>
               <option value="9">9</option>
               <option value="10">10</option>
               <option value="10+">10+</option>
             </select>
           </div>
         </div>
      )}

          <section>
            <h2 className="font-semibold text-lg mb-2">In-Ear Monitoring</h2>
            <p className="text-sm text-gray-600 mb-2">
              Kindly let us know the number of the following types of monitoring equipment you have in your setup.
            </p>
            <div className="flex gap-6">
              {[
                ["wired_in_ear_packs", "Wired In-Ear Packs"],
                ["wireless_in_ear_packs", "Wireless In-Ear Packs"],
                ["in_ear_monitors", "In-Ear Buds"],
              ].map(([key, label]) => (
                <div key={key} className="flex flex-col items-start gap-1">
                  <label htmlFor={key} className="text-sm font-medium text-gray-700">
                    {label}
                  </label>
                  {renderQuantityDropdown(key, pa_equipment[key], (val) => updatePA(key, val), "w-40")}
                </div>
              ))}
            </div>
          </section>



      {/* Sound Engineer with PA & Lights Provision sections */}
      {isSoundEngineerWithPA && (
        <>
          <section>
            <h2 className="font-semibold text-lg mb-2">Instrument Mics</h2>
            <p className="text-sm text-gray-600 mb-2">
              Kindly let us know how many mics you have in your equipment that are suitable for instruments.
            </p>
            <div className="flex gap-6">
              {[
                ["extra_wired_instrument_mics", "Mics for Instruments / BVs"],
                ["wireless_horn_mics", "Wireless Horn Mics"],
                ["drum_mic_kit", "Drum Mic Kit"],
              ].map(([key, label]) => (
                <div key={key} className="flex flex-col items-start gap-1">
                  <label htmlFor={key} className="text-sm font-medium text-gray-700">
                    {label}
                  </label>
                  {renderQuantityDropdown(key, pa_equipment[key], (val) => updatePA(key, val), "w-48")}
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="font-semibold text-lg mb-2">Speech Mics</h2>
            <p className="text-sm text-gray-600 mb-2">
              Kindly let us know how many mics you have in your equipment that are suitable for speeches
            </p>
            <div className="flex gap-6">
              {[
                ["wireless_speech_mics", "Wireless"],
                ["wired_speech_mics", "Wired"],
              ].map(([key, label]) => (
                <div key={key} className="flex flex-col items-start gap-1">
                  <label htmlFor={key} className="text-sm font-medium text-gray-700">
                    {label}
                  </label>
                  {renderQuantityDropdown(key, pa_equipment[key], (val) => updatePA(key, val), "w-24")}
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="font-semibold text-lg mb-2">Logistics</h2>
            <p className="text-sm text-gray-600 mb-2">
              Kindly let us know the length of your longest XLR cable and longest extension cable
            </p>
            <div className="flex gap-6">
              {[
                ["longest_xlr", "Longest XLR Cable"],
                ["longest_extension_cable", "Longest Extension Cable"],
              ].map(([key, label]) => (
                <div key={key} className="flex flex-col items-start gap-1">
                  <label htmlFor={key} className="text-sm font-medium text-gray-700">
                    {label}
                  </label>
                  <input
                    id={key}
                    type="text"
                    value={pa_equipment[key] || ""}
                    onChange={(e) => updatePA(key, e.target.value)}
                    className="w-60 border rounded px-2 py-1"
                  />
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-semibold text-lg mb-2">Additional Equipment</h2>
            <p className="text-sm text-gray-600 mb-2">
              Kindly let us know the number of the following types of additional equipment you have in your setup.
            </p>
            <div className="flex gap-6">
              {[
                ["mic_stands", "Mic Stands"],
                ["di_boxes", "DI Boxes"],
                ["wireless_guitar_jacks", "Wireless Guitar Jacks & Recievers"],
              ].map(([key, label]) => (
                <div key={key} className="flex flex-col items-start gap-1">
                  <label htmlFor={key} className="text-sm font-medium text-gray-700">
                    {label}
                  </label>
                  {renderQuantityDropdown(key, pa_equipment[key], (val) => updatePA(key, val), "w-40")}
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="font-semibold text-lg mb-2">PA Specs</h2>
            <p className="text-sm text-gray-600 mb-2">
              Kindly let us know the make, model, and wattage of the following equipment you have in your setup.
            </p>
            {/* Generic Render Group */}
            {["mixing_desks", "pa_speakers", "monitors"].map((type) => (
              <div key={type} className="mb-1">
                <h3 className="font-medium text-md capitalize mb-2">
                  {type.replace("_", " ").replace("desks", "Desks").replace("pa", "PA").replace("monitors", "Monitors")}
                </h3>
                {(equipment_spec[type] || []).map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={item.model || ""}
                      onChange={(e) => {
                        const updated = [...(equipment_spec[type] || [])];
                        updated[index] = { ...updated[index], model: e.target.value };
                        updateSpec(type, updated);
                      }}
                      className="flex-1 border rounded px-2 py-1"
                    />
                    <input
                      type="text"
                      placeholder="Wattage"
                      value={item.wattage || ""}
                      onChange={(e) => {
                        const updated = [...(equipment_spec[type] || [])];
                        updated[index] = { ...updated[index], wattage: e.target.value };
                        updateSpec(type, updated);
                      }}
                      className="w-32 border rounded px-2 py-1"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="text-sm text-blue-600 underline"
                  onClick={() => {
                    const updated = [...(equipment_spec[type] || []), { model: "", wattage: "" }];
                    updateSpec(type, updated);
                  }}
                >
                  + Add
                </button>
              </div>
            ))}
          </section>
          <section>
            <h2 className="font-semibold text-lg mb-2">Lighting</h2>
            <p className="text-sm text-gray-600 mb-2">
              Kindly let us know the number of the following types of lighting equipment you have in your setup.
            </p>
            <div className="flex flex-wrap gap-6 mb-4">
              {[
                ["uplights", "Uplights"],
                ["t_bars", "T-Bars"],
                ["led_disco_ball", "LED Disco Ball"],
                ["light_bars", "Light Bars"],
              ].map(([key, label]) => (
                <div key={key} className="flex flex-col items-start gap-1">
                  <label htmlFor={key} className="text-sm font-medium text-gray-700">
                    {label}
                  </label>
                  {renderQuantityDropdown(key, pa_equipment[key], (val) => updatePA(key, val), "w-32")}
                </div>
              ))}
            </div>
            {/* Other Lighting */}
            <h3 className="font-semibold text-md mb-2">Other Lighting</h3>
            <p className="text-sm text-gray-600 mb-2">
              Kindly let us know if you have any other lighting and the number of those pieces in your lighting equipment setup.
            </p>
            {(equipment_spec.other_lighting || []).map((item, index) => (
              <div key={index} className="flex gap-4 mb-2">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1" htmlFor={`lighting-name-${index}`}>
                    Lighting Type
                  </label>
                  <input
                    id={`lighting-name-${index}`}
                    type="text"
                    value={item.name || ""}
                    onChange={(e) => {
                      const updated = [...(equipment_spec.other_lighting || [])];
                      updated[index] = { ...updated[index], name: e.target.value };
                      updateSpec("other_lighting", updated);
                    }}
                    className="w-[200px] border rounded px-2 py-1"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm text-gray-700 mb-1" htmlFor={`lighting-qty-${index}`}>
                    Quantity
                  </label>
                  <select
                    id={`lighting-qty-${index}`}
                    value={item.quantity || ""}
                    onChange={(e) => {
                      const updated = [...(equipment_spec.other_lighting || [])];
                      updated[index] = { ...updated[index], quantity: e.target.value };
                      updateSpec("other_lighting", updated);
                    }}
                    className="w-[100px] border rounded px-2 py-1"
                  >
                    <option value="">Select</option>
                    {[...Array(30)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const updated = [...(equipment_spec.other_lighting || []), { name: "", quantity: "" }];
                updateSpec("other_lighting", updated);
              }}
              className="text-sm text-blue-600 underline"
            >
              + Add
            </button>
          </section>
        </>
      )}

      {/* Instrumentalist Only sections */}
      {isInstrumentalistOnly && (
        <>
          <section>
            <h2 className="font-semibold text-lg mb-2">Instrument Mics</h2>
            <p className="text-sm text-gray-600 mb-2">
              Kindly let us know how many mics you have in your equipment that are suitable for instrument only
            </p>
            <div className="flex gap-6">
              {[
                ["extra_wired_instrument_mics", "Mics for Instruments / BVs"],
                ["wireless_horn_mics", "Wireless Horn Mics"],
                ["drum_mic_kit", "Drum Mic Kit"],
              ].map(([key, label]) => (
                <div key={key} className="flex flex-col items-start gap-1">
                  <label htmlFor={key} className="text-sm font-medium text-gray-700">
                    {label}
                  </label>
                  {renderQuantityDropdown(key, pa_equipment[key], (val) => updatePA(key, val), "w-48")}
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="font-semibold text-lg mb-2">In-Ear Monitoring</h2>
            <p className="text-sm text-gray-600 mb-2">
              Kindly let us know the number of the following types of monitoring equipment you have in your setup.
            </p>
            <div className="flex gap-6">
              {[
                ["wired_in_ear_packs", "Wired In-Ear Packs"],
                ["wireless_in_ear_packs", "Wireless In-Ear Packs"],
                ["in_ear_monitors", "In-Ear Buds"],
              ].map(([key, label]) => (
                <div key={key} className="flex flex-col items-start gap-1">
                  <label htmlFor={key} className="text-sm font-medium text-gray-700">
                    {label}
                  </label>
                  {renderQuantityDropdown(key, pa_equipment[key], (val) => updatePA(key, val), "w-40")}
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="font-semibold text-lg mb-2">Additional Equipment</h2>
            <p className="text-sm text-gray-600 mb-2">
              Kindly let us know the number of the following types of additional equipment you have in your setup.
            </p>
            <div className="flex gap-6">
              {[
                ["mic_stands", "Mic Stands"],
                ["di_boxes", "DI Boxes"],
                ["wireless_guitar_jacks", "Wireless Guitar Jacks & Recievers"],
              ].map(([key, label]) => (
                <div key={key} className="flex flex-col items-start gap-1">
                  <label htmlFor={key} className="text-sm font-medium text-gray-700">
                    {label}
                  </label>
                  {renderQuantityDropdown(key, pa_equipment[key], (val) => updatePA(key, val), "w-40")}
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Instrument Specs section (always shown if instrumentation) */}
           {/* Instrument Specs section (shown if instrumentation and not ONLY sound engineer with PA) */}
           {instrumentation.length > 0 && !isOnlySoundEngineerWithPA && (
        <section>
          <h2 className="font-semibold text-lg mb-2">Instrument Specs</h2>
          <p className="text-sm text-gray-600 mb-4">
            Please add the make, model and wattage for each instrument you play. You can add multiple items per instrument if needed.
          </p>
          {(formData.instrumentation || []).map(({ instrument }, i) => (
            <div key={i} className="">
              <h3 className="text-md font-semibold mb-1">{instrument}</h3>
              {(equipment_spec.instrument_specs?.[instrument] || []).map((item, idx) => (
                <div className="flex items-end gap-4 mb-2">
                  <div className="flex flex-col w-1/2">
                    <label className="text-sm font-medium text-gray-700 mb-1">Make & Model</label>
                    <input
                      type="text"
                      value={item.name || ""}
                      onChange={(e) => {
                        const updated = { ...equipment_spec.instrument_specs };
                        updated[instrument][idx].name = e.target.value;
                        updateSpec("instrument_specs", updated);
                      }}
                      className="border rounded px-2 py-1"
                    />
                  </div>
                  <div className="flex flex-col w-[10%]">
                    <label className="text-sm font-medium text-gray-700 mb-1">Wattage</label>
                    <input
                      type="text"
                      value={item.wattage || ""}
                      onChange={(e) => {
                        const updated = { ...equipment_spec.instrument_specs };
                        updated[instrument][idx].wattage = e.target.value;
                        updateSpec("instrument_specs", updated);
                      }}
                      className="border rounded px-2 py-1"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="text-sm text-blue-600 underline"
                onClick={() => {
                  const updated = { ...equipment_spec.instrument_specs };
                  updated[instrument] = [...(updated[instrument] || []), { name: "", wattage: "" }];
                  updateSpec("instrument_specs", updated);
                }}
              >
                + Add
              </button>
            </div>
          ))}
        </section>
      )}

{(formData.other_skills?.includes("DJ with Decks") || formData.other_skills?.includes("DJ with Mixing Console")) && (
  <section>
    <h2 className="font-semibold text-lg mb-2">DJ Equipment</h2>
    <p className="text-sm text-gray-600 mb-4">
      Please tell us about your DJ setup and gear. Include makes, models and wattage where applicable.
    </p>

    {(equipment_spec.dj_equipment || []).map((item, idx) => (
      <div key={idx} className="flex items-end gap-4 mb-2">
        <div className="flex flex-col w-1/2">
          <label className="text-sm font-medium text-gray-700 mb-1">Make & Model</label>
          <input
            type="text"
            value={item.name || ""}
            onChange={(e) => {
              const updated = [...(equipment_spec.dj_equipment || [])];
              updated[idx] = { ...updated[idx], name: e.target.value };
              updateSpec("dj_equipment", updated);
            }}
            className="border rounded px-2 py-1"
          />
        </div>
        <div className="flex flex-col w-[10%]">
          <label className="text-sm font-medium text-gray-700 mb-1">Wattage</label>
          <input
            type="text"
            value={item.wattage || ""}
            onChange={(e) => {
              const updated = [...(equipment_spec.dj_equipment || [])];
              updated[idx] = { ...updated[idx], wattage: e.target.value };
              updateSpec("dj_equipment", updated);
            }}
            className="border rounded px-2 py-1"
          />
        </div>
      </div>
    ))}

    <button
      type="button"
      className="text-sm text-blue-600 underline"
      onClick={() => {
        const updated = [...(equipment_spec.dj_equipment || []), { name: "", wattage: "" }];
        updateSpec("dj_equipment", updated);
      }}
    >
      + Add
    </button>
    <h3 className="font-semibold text-md mt-6 mb-2">
I have and am able to transport the following equipment:    </h3>
    <div className="mt-2">
      {[
        ["has_dj_table", "DJ Table"],
        ["has_dj_booth", "DJ Booth"],
        ["has_mixing_console", "Mixing Console"],
        ["has_decks", "Decks"],
      ].map(([key, label]) => (
        <label
          key={key}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
        >
          <input
            type="checkbox"
            checked={formData.djing?.[key] || false}
            onChange={(e) =>
              setFormData({
                ...formData,
                djing: { ...formData.djing, [key]: e.target.checked },
              })
            }
          />
          {label}
        </label>
      ))}
     
    </div>

    <h3 className="font-semibold text-md mt-6 mb-2">
      If gear needs to be provided, what do you need?
    </h3>
    {(equipment_spec.required_dj_gear || []).map((item, idx) => (
      <div key={idx} className="flex items-end gap-4 mb-2">
        <div className="flex flex-col w-1/2">
          <label className="text-sm font-medium text-gray-700 mb-1">Make & Model</label>
          <input
            type="text"
            value={item.name || ""}
            onChange={(e) => {
              const updated = [...(equipment_spec.required_dj_gear || [])];
              updated[idx] = { ...updated[idx], name: e.target.value };
              updateSpec("required_dj_gear", updated);
            }}
            className="border rounded px-2 py-1"
          />
        </div>
        <div className="flex flex-col w-[10%]">
          <label className="text-sm font-medium text-gray-700 mb-1">Wattage</label>
          <input
            type="text"
            value={item.wattage || ""}
            onChange={(e) => {
              const updated = [...(equipment_spec.required_dj_gear || [])];
              updated[idx] = { ...updated[idx], wattage: e.target.value };
              updateSpec("required_dj_gear", updated);
            }}
            className="border rounded px-2 py-1"
          />
        </div>
      </div>
    ))}
    <button
      type="button"
      className="text-sm text-blue-600 underline"
      onClick={() => {
        const updated = [...(equipment_spec.required_dj_gear || []), { name: "", wattage: "" }];
        updateSpec("required_dj_gear", updated);
      }}
    >
      + Add
    </button>
  </section>
)}
    </div>
  );
};

export default DeputyStepFive;
