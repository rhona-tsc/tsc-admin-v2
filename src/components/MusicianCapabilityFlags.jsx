import React from "react";

const Flag = ({ children, tone = "green" }) => {
  const tones = {
    green: "border-green-200 bg-green-50 text-green-800",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    gray: "border-gray-200 bg-gray-50 text-gray-600",
  };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
};

export default function MusicianCapabilityFlags({ matchFlags = {} }) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Equipment capabilities">
      {matchFlags.soundEngineeringConfirmed ? <Flag>Sound engineering confirmed</Flag> : null}
      {matchFlags.paProvisionConfirmed ? <Flag>PA confirmed</Flag> : null}
      {matchFlags.lightingProvisionConfirmed ? <Flag>Lighting confirmed</Flag> : null}
      {matchFlags.lightingProvisionNeedsCheck ? (
        <Flag tone="amber">Check lighting availability</Flag>
      ) : null}
      {!matchFlags.paProvisionConfirmed && !matchFlags.soundEngineeringConfirmed ? (
        <Flag tone="gray">PA / sound not confirmed</Flag>
      ) : null}
    </div>
  );
}
