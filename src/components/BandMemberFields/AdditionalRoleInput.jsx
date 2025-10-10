// ✅ AdditionalRoleInput.jsx (Refactored + Essential checkbox, fixed)
import React from "react";
import { assets } from "../../assets/assets";

const AdditionalRoleInput = ({
  role,
  index,
  isLast,
  updateAdditionalRole,
  removeAdditionalRole,
  addAdditionalRole,
  OTHER_ROLES,
}) => {
  const handleRemove = () => {
    removeAdditionalRole(index);

    // Clear related DJ gear flags if you remove a DJ-ish role
    const djKeywords = ["dj", "mixing console", "console/decks"];
    const roleLower = (role.role || "").toLowerCase();
    if (djKeywords.some((keyword) => roleLower.includes(keyword))) {
      updateAdditionalRole(index, "haveMixingConsoleOrDecks", false);
      updateAdditionalRole(index, "hasDJTable", false);
      updateAdditionalRole(index, "hasDJBooth", false);
    }
  };

  return (
    <div className="grid grid-cols-9 items-start gap-4 w-full">
      {/* Role input */}
      <div className="col-span-4">
        {index === 0 && <label className="block">Additional Role</label>}
        {role.role === "Other" || !OTHER_ROLES.includes(role.role) ? (
          <input
            type="text"
            placeholder="Enter custom role"
            value={role.role || ""}
            onChange={(e) => updateAdditionalRole(index, "role", e.target.value)}
            className="w-full px-2 py-2 border rounded text-sm"
          />
        ) : (
          <select
            className="w-full px-2 py-2 border rounded text-sm"
            value={role.role}
            onChange={(e) => updateAdditionalRole(index, "role", e.target.value)}
          >
            <option value="">Select a role</option>
            {OTHER_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
            <option value="Other">Other</option>
          </select>
        )}
      </div>

      {/* Fee */}
      <div className="col-span-2">
        {index === 0 && <label>Fee (£)</label>}
        <input
          type="text"
          value={role.additionalFee !== undefined ? role.additionalFee : ""}
          onChange={(e) => {
            let inputValue = e.target.value.replace(/[^0-9.]/g, "");
            if ((inputValue.match(/\./g) || []).length > 1)
              inputValue = inputValue.slice(0, -1);
            if (inputValue.startsWith(".")) inputValue = "";
            updateAdditionalRole(index, "additionalFee", inputValue);
          }}
          className="w-full px-2 py-2 border rounded text-sm"
        />
      </div>

      {/* Essential? */}
      <div className="col-span-2">
        {index === 0 && <label className="block mb-2">Essential?</label>}
        <div className={`flex ${index === 0 ? "items-center" : "items-center"} justify-center h-full`}>
          <input
            type="checkbox"
            aria-label="Essential additional role"
            checked={Boolean(role.isEssential)}
            onChange={(e) =>
              updateAdditionalRole(index, "isEssential", e.target.checked)
            }
          />
        </div>
      </div>

      {/* Remove */}
      <div className={`col-span-1 ${index === 0 ? "mt-6" : ""}`}>
        <button
          type="button"
          onClick={handleRemove}
          className="px-2 py-2 bg-black text-white rounded hover:bg-[#ff6667] transition text-sm"
          title="Remove additional role"
        >
          <img src={assets.white_cross_icon} alt="Remove" className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default AdditionalRoleInput;