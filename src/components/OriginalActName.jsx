import React from 'react';

const OriginalActName = ({ name, setName }) => {
  return (
    <div className="w-full">
      <p className="mb-2">
        <strong>Original Act Name</strong>
      </p>
      <input
        onChange={(e) => setName(e.target.value)}
        value={name}
        className="w-1/2 px-3 py-2"
        placeholder="Act Name"
      />
    </div>
  );
};

export default OriginalActName;
