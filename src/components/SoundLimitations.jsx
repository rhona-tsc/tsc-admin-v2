import React from 'react';

const SoundLimitations = ({ lineup, index, setLineups }) => {
  const updateLineup = (field, value) => {
    setLineups((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  return (
    <div>
      <label>Lowest db this lineup can work with</label>
      <select
        className="w-full px-3 py-2 border"
        value={lineup.db || ""}
        onChange={(e) => updateLineup("db", e.target.value)}
      >
        <option value="">Select a db limit</option>
        {[
          "< 86db", "86db", "87db", "88db", "89db", "90db",
          "91db", "92db", "93db", "94db", "95db", "96db",
          "97db", "98db", "99db", "100db", "101db", "102db",
          "103db", "104db", "105db", "106db", "107db +"
        ].map((db) => (
          <option key={db} value={db}>
            {db}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SoundLimitations;