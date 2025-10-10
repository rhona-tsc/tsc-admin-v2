import React, { useState } from 'react';

const PaAndLights = ({
  paSystem,
  setPaSystem,
  lightingSystem,
  setLightingSystem
}) => {

  const paDescriptions = {
    smallPA: 'Smaller than 500 watts',
    mediumPA: '501–1000 watts',
    largePA: '1001+ watts',
  };

  const lightingDescriptions = {
    smallLight: 'Some uplighters or light bars',
    mediumLight: 'One disco T-bar and some uplighters or light bars',
    largeLight: 'Two disco T-bars, uplighters or light bars, and LED disco ball or moving heads',
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* PA System Dropdown */}
      <div>
        <label htmlFor="pa-system" className="mb-2 font-semibold block">
          PA System Size
        </label>
        <select
          id="pa-system"
          value={paSystem}
          onChange={(e) => setPaSystem(e.target.value)}
          className="border px-2 py-2 rounded w-full text-sm"
        >
          <option value="">Select PA system size</option>
          <option value="noPA">We don't provide a PA as standard</option>
          <option value="smallPA">Small</option>
          <option value="mediumPA">Medium</option>
          <option value="largePA">Large</option>
        </select>
        {paSystem && (
          <p className="mt-1 text-sm text-gray-600 italic">
            {paDescriptions[paSystem]}
          </p>
        )}
      </div>

      {/* Lighting System Dropdown */}
      <div>
        <label htmlFor="lighting-system" className="mb-2 font-semibold block">
          Lighting System Size
        </label>
        <select
          id="lighting-system"
          value={lightingSystem}
          onChange={(e) => setLightingSystem(e.target.value)}
          className="border px-2 py-2 rounded w-full text-sm"
        >
          <option value="">Select lighting system size</option>
          <option value="noLight">We don't provided lights as standard</option>
          <option value="smallLight">Small</option>
          <option value="mediumLight">Medium</option>
          <option value="largeLight">Large</option>
        </select>
        {lightingSystem && (
          <p className="mt-1 text-sm text-gray-600 italic">
            {lightingDescriptions[lightingSystem]}
          </p>
        )}
      </div>
    </div>
  );
};

export default PaAndLights;