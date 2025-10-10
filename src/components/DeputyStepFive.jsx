import React from 'react'
import DepFiveVocalMics from './DepFiveVocalMics.jsx'
import DepFiveInEarMonitoring from './DepFiveInEarMonitoring.jsx'
import DepFiveInstrumentMics from './DepFiveInstrumentMics.jsx'
import DepFiveSpeechMics from './DepFiveSpeechMics.jsx'
import DepFiveCableLogistics from './DepFiveCableLogistics.jsx'
import DepFiveAdditionalEquipment from './DepFiveAdditionalEqiupment.jsx'
import DepFiveExtensionCableLogistics from './DepFiveExtensionCableLogistics.jsx'
import DepFiveLighting from './DepFiveLighting.jsx'
import DepFiveTbars from './DepFiveTbars.jsx'
import DepFiveLightBars from './DepFiveLightBars.jsx'
import DepFiveDiscoBall from './DepFiveDiscoBall.jsx'
import DepFiveOtherLighting from './DepFiveOtherLighting.jsx'
import DepFivePaSpeakerSpecs from './DepFivepaSpeakerSpecs.jsx'
import DepFiveMixingDesk from './DepFivepaMixingDesk.jsx'
import DepFiveFloorMonitorSpecs from './DepFiveFloorMonitorSpecs.jsx'
import DepFiveInstrumentSpecs from './DepFiveInstrumentSpecs.jsx'
import DepFiveDjEquipment from './DepFiveDjEquipment.jsx'
import DepFiveDjEquipmentCategories from './DepFiveDjEquipmentCategories.jsx'
import DepFiveDjGearRequired from './DepFiveDjGearRequired.jsx'
import DepFiveBackline from './DepFiveBackline.jsx'

const DeputyStepFive = ({ formData, setFormData, userRole, stepProps }) => {
  // === Visibility logic ===
  const selectedInstruments = (formData.instrumentation || []).filter(i => i.instrument?.trim() !== "");
  const hasInstruments = selectedInstruments.length > 0;

  const selectedVocalTypes = formData.vocals?.type || [];
  const isVocalist =
    selectedVocalTypes.includes("Lead Vocalist") ||
    selectedVocalTypes.includes("Lead Vocalist-Instrumentalist") ||
    selectedVocalTypes.includes("Backing Vocalist") ||
    selectedVocalTypes.includes("Backing Vocalist-Instrumentalist");

  const isNonSinger = selectedVocalTypes.includes("I don't sing");

  const selectedOtherSkills = formData.other_skills || [];
  console.log("🚧 DEBUG other_skills:", selectedOtherSkills);
  const hasSoundEngineering = selectedOtherSkills.includes("Sound Engineering with PA & Lights Provision") || selectedOtherSkills.includes("Amp or small PA provision for duo performances") || selectedOtherSkills.includes("Amp or small PA provision for solo performances");
  const hasDJDecks = selectedOtherSkills.includes("DJ with Decks");
  const hasDJMixingConsole = selectedOtherSkills.includes("DJ with Mixing Console");

  // === Computed flags ===
  const showInstrumentSpecs = hasInstruments;
  const showPASections = hasSoundEngineering;
  const showInEarMonitoring =
    !(
      isNonSinger &&
      !hasInstruments &&
      (hasDJDecks || hasDJMixingConsole)
    );
  const showVocalMics = isVocalist || hasSoundEngineering;
  const showInstrumentMics = hasInstruments || hasSoundEngineering;
  const showSpeechMics = hasSoundEngineering;
  const showAdditionalEquipment = isVocalist || hasSoundEngineering;
  const showCableLogistics = hasSoundEngineering;
  const showExtensionCableLogistics = hasSoundEngineering;
  const showLighting = hasSoundEngineering;
  const showDJSections = hasDJDecks || hasDJMixingConsole;

  return (
    <div>
      {showInstrumentSpecs && (
        <DepFiveInstrumentSpecs formData={formData} setFormData={setFormData} userRole={userRole} {...stepProps} />
      )}
    {showPASections && (
  <>
    <DepFivePaSpeakerSpecs formData={formData} setFormData={setFormData} userRole={userRole} {...stepProps} />
    <DepFiveMixingDesk formData={formData} setFormData={setFormData} userRole={userRole} {...stepProps} />
  </>
)}

{(showInstrumentSpecs || showPASections) && (
    <>
  <DepFiveFloorMonitorSpecs formData={formData} setFormData={setFormData} userRole={userRole} {...stepProps} />
  <DepFiveBackline formData={formData} setFormData={setFormData} userRole={userRole} {...stepProps} />
  </>
)}
      {showInEarMonitoring && (
        <DepFiveInEarMonitoring formData={formData} setFormData={setFormData} userRole={userRole} {...stepProps} />
      )}
      {showVocalMics && (
        <DepFiveVocalMics formData={formData} setFormData={setFormData} userRole={userRole} {...stepProps} />
      )}
      {showInstrumentMics && (
        <DepFiveInstrumentMics formData={formData} setFormData={setFormData} userRole={userRole} {...stepProps} />
      )}
      {(showSpeechMics || showDJSections) && (
        <DepFiveSpeechMics formData={formData} setFormData={setFormData} userRole={userRole} {...stepProps} />
      )}
      {showAdditionalEquipment && (
        <DepFiveAdditionalEquipment formData={formData} setFormData={setFormData} userRole={userRole} {...stepProps} />
      )}
      {showCableLogistics && (
        <DepFiveCableLogistics formData={formData} setFormData={setFormData} userRole={userRole} {...stepProps} />
      )}
      {showExtensionCableLogistics && (
        <DepFiveExtensionCableLogistics formData={formData} setFormData={setFormData} userRole={userRole} {...stepProps} />
      )}
      {showLighting && (
        <>
          <DepFiveLighting formData={formData} setFormData={setFormData} userRole={userRole} {...stepProps} />
          <DepFiveTbars formData={formData} setFormData={setFormData} userRole={userRole} {...stepProps} />
          <DepFiveLightBars formData={formData} setFormData={setFormData} userRole={userRole} {...stepProps} />
          <DepFiveDiscoBall formData={formData} setFormData={setFormData} userRole={userRole} {...stepProps} />
          <DepFiveOtherLighting formData={formData} setFormData={setFormData} userRole={userRole} {...stepProps} />
        </>
      )}
      {showDJSections && (
        <>
          <DepFiveDjEquipmentCategories formData={formData} setFormData={setFormData} userRole={userRole} {...stepProps} />
          <DepFiveDjEquipment formData={formData} setFormData={setFormData} userRole={userRole} {...stepProps} />
          <DepFiveDjGearRequired formData={formData} setFormData={setFormData} userRole={userRole} {...stepProps} />
        </>
      )}
    </div>
  );
};

export default DeputyStepFive;