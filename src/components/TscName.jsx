import React from 'react';

const TscName = ({ tscName, setTscName }) => {
  return (
    <div className="w-full">
      <p className="mb-2">
        <strong>TSC Act Name</strong>
      </p>
      <input
        onChange={(e) => setTscName(e.target.value)}
        value={tscName}
        className="w-1/2 px-3 py-2"
        placeholder="Act Name"
      />
    </div>
  );
};

export default TscName;
