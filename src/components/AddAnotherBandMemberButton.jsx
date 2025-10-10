import React from 'react';

  const AddAnotherBandMemberButton = ({ onAdd }) => {


  return (

      <button
        type="button"
        onClick={onAdd}
        className="px-3 py-2 mt-2 bg-black text-white rounded shadow hover:bg-[#ff6667] transition"
      >
        + Add A New Team Member to this Lineup
      </button>
    );
  };

export default AddAnotherBandMemberButton;