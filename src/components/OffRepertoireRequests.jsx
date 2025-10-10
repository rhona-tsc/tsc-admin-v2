import React from 'react';

const OffRepertoireRequests = ({ offRepertoireRequests, setOffRepertoireRequests }) => {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <label htmlFor="off-repertoire-requests" className="mb-2 font-semibold block">
          Off-Repertoire Requests
        </label>
        <select
  id="off-repertoire-requests"
  value={offRepertoireRequests}
  onChange={(e) => setOffRepertoireRequests(e.target.value)}
  className="border px-2 py-2 rounded w-full text-sm"
>
  <option value="">Select number of off-repertoire requests</option>
  {Array.from({ length: 31 }, (_, i) => (
    <option key={i} value={i}>{i}</option>
  ))}
</select>
      </div>
    </div>
  );
};

export default OffRepertoireRequests;