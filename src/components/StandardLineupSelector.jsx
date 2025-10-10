import React from 'react'

const StandardLineupSelector = ({ lineups, setLineups }) => {
    const handleToggleStandard = (lineupIndex, memberIndex, roleType, roleIndex) => {
      setLineups(prev =>
        prev.map((lineup, lIdx) => {
          if (lIdx !== lineupIndex) return lineup;
          const updatedMembers = lineup.bandMembers.map((member, mIdx) => {
            if (mIdx !== memberIndex) return member;

            if (roleType === "instrument") {
              return { ...member, isEssential: !member.isEssential };
            } else if (roleType === "additional") {
              const updatedRoles = [...(member.additionalRoles || [])];
              updatedRoles[roleIndex] = {
                ...updatedRoles[roleIndex],
                isEssential: !updatedRoles[roleIndex].isEssential,
              };
              return { ...member, additionalRoles: updatedRoles };
            }
            return member;
          });

          return { ...lineup, bandMembers: updatedMembers };
        })
      );
    };

    const generateDescription = (lineup) => {
      const count = lineup.actSize || lineup.bandMembers.length;
    
      const instruments = lineup.bandMembers
        .filter(m => m.isEssential)
        .map(m => m.instrument)
        .filter(Boolean);
    
      instruments.sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        const isVocal = str => str.includes("vocal");
        const isDrums = str => str === "drums";
    
        if (isVocal(aLower) && !isVocal(bLower)) return -1;
        if (!isVocal(aLower) && isVocal(bLower)) return 1;
        if (isDrums(aLower)) return 1;
        if (isDrums(bLower)) return -1;
        return 0;
      });
    
      const formatWithAnd = (arr) => {
        const unique = [...new Set(arr)];
        if (unique.length === 0) return "";
        if (unique.length === 1) return unique[0];
        if (unique.length === 2) return `${unique[0]} & ${unique[1]}`;
        return `${unique.slice(0, -1).join(", ")} & ${unique[unique.length - 1]}`;
      };
    
      const roles = lineup.bandMembers.flatMap(member =>
        (member.additionalRoles || [])
          .filter(r => r.isEssential)
          .map(r => r.role || r.role || "Unnamed Service")
      );
    
      if (count === 0) return "Add a Lineup";
    
      const instrumentsStr = formatWithAnd(instruments);
      const rolesStr = roles.length ? ` (including ${formatWithAnd(roles)} services)` : "";
    
      return `${count}-Piece: ${instrumentsStr}${rolesStr}`;
    };

    return (
      <div className="border p-4 rounded bg-white shadow-md mb-6">
      <h3 className="text-lg font-semibold mb-2">Select Essential Components for Each Lineup</h3>
      {lineups.map((lineup, lIdx) => (
        <div key={lIdx} className="mb-4">
          <p className="font-medium mb-2">
            {generateDescription(lineup) || "Add a Linuep"} 
          </p>
          <ul className="ml-4 space-y-1">
            {lineup.bandMembers.map((member, mIdx) => (
              <li key={mIdx}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={member.isEssential || false}
                    onChange={() =>
                      handleToggleStandard(lIdx, mIdx, "instrument")
                    }
                  />
                  {member.instrument === "Other" ? member.customInstrument || "Other" : member.instrument || "Unnamed"}
                </label>
                  {(member.additionalRoles || []).map((additionalRole, rIdx) => (
  <label key={rIdx} className="flex items-center gap-2 ml-6 text-sm text-gray-700">
    <input
      type="checkbox"
      checked={additionalRole.isEssential || false}
      onChange={() =>
        handleToggleStandard(lIdx, mIdx, "additional", rIdx)
      }
    />
    {additionalRole.role || "Unnamed Additional Role"}
  </label>
))}
))
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default StandardLineupSelector;
