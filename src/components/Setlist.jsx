import React from 'react';

const Setlist = ({
  setlist,
  setSetlist,
}) => {

  const setlistDescriptions = {
    smallTailoring: 'We perform our signature setlist that we know works brilliantly with any audience.',
    mediumTailoring: 'We blend client favourites with our signature hits — usually around 50% client picks, 50% proven crowd-pleasers.',
    largeTailoring: 'We aim to accommodate nearly all client suggestions — typically 90-100% of the set is built from client suggestions.',
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* PA System Dropdown */}
      <div>
        <label htmlFor="pa-system" className="mb-2 font-semibold block">
          Setlist Tailoring
        </label>
        <select
          id="setlist"
          value={setlist}
          onChange={(e) => setSetlist(e.target.value)}
          className="border px-2 py-2 rounded w-full text-sm"
        >
          <option value="">Select Amount of Tailoring Allowed</option>
          <option value="smallTailoring">Signature Setlist
          </option>
          <option value="mediumTailoring">Collaborative Setlist
          </option>
          <option value="largeTailoring">Fully Tailored Setlist
          </option>
        </select>
        {setlist && (
          <p className="mt-1 text-sm text-gray-600 italic">
            {setlistDescriptions[setlist]}
          </p>
        )}
      </div>


    </div>
  );
};

export default Setlist;