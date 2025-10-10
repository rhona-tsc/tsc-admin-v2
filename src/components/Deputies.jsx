import React from 'react';
import { assets } from '../assets/assets';

const Deputies = ({ member, index, memberIndex, updateBandMember }) => {
  const handleDeputyChange = (deputyIndex, field, value) => {
    const updatedDeputies = [...(member.deputies || [])];
    updatedDeputies[deputyIndex] = {
      ...updatedDeputies[deputyIndex],
      [field]: value,
    };
    updateBandMember(index, memberIndex, "deputies", updatedDeputies);
  };

  const addDeputy = () => {
    const updatedDeputies = [
      ...(member.deputies || []),
      {
        firstName: "",
        lastName: "",
        phoneNumber: "",
        email: "",
      },
    ];
    updateBandMember(index, memberIndex, "deputies", updatedDeputies);
  };

  const removeDeputy = (deputyIndex) => {
    const updatedDeputies = member.deputies.filter((_, i) => i !== deputyIndex);
    updateBandMember(index, memberIndex, "deputies", updatedDeputies);
  };

  return (
    <div className="w-full mt-4">
      <p className="font-semibold mb-2">Deputies for this Role</p>

      {member.deputies?.length > 0 ? (
        member.deputies.map((deputy, deputyIndex) => (
          <div
            key={deputyIndex}
            className="grid grid-cols-8 gap-4 mb-2 items-end"
          >
            <div className="col-span-2">
              <label>First Name</label>
              <input
                type="text"
                value={deputy.firstName}
                onChange={(e) =>
                  handleDeputyChange(deputyIndex, "firstName", e.target.value)
                }
                className="w-full px-3 py-2 border"
              />
            </div>

            <div className="col-span-2">
              <label>Last Name</label>
              <input
                type="text"
                value={deputy.lastName}
                onChange={(e) =>
                  handleDeputyChange(deputyIndex, "lastName", e.target.value)
                }
                className="w-full px-3 py-2 border"
              />
            </div>

            <div className="col-span-2">
              <label>Email</label>
              <input
                type="email"
                value={deputy.email}
                onChange={(e) =>
                  handleDeputyChange(deputyIndex, "email", e.target.value)
                }
                className="w-full px-3 py-2 border"
              />
            </div>

            <div className="col-span-2 flex gap-2 items-end">
              <div className="flex-1">
                <label>Mobile</label>
                <input
                  type="tel"
                  value={deputy.phoneNumber}
                  onChange={(e) =>
                    handleDeputyChange(deputyIndex, "phoneNumber", e.target.value)
                  }
                  className="w-full px-3 py-2 border"
                  placeholder="+44 7XXXXXXXXX"
                />
              </div>
              <button
                type="button"
                onClick={() => removeDeputy(deputyIndex)}
                className="w-8 h-8 flex justify-center items-center mt-6"
                title="Remove Deputy"
              >
                <img
                  src={assets.cross_icon}
                  alt="Remove"
                  className="w-5 h-5"
                />
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500 mb-4">No deputies added yet</p>
      )}

      {(!member.deputies || member.deputies.length < 10) && (
        <button
          type="button"
          className="mt-2 px-4 py-2 bg-[#ff6667] text-white rounded shadow hover:bg-black transition"
          onClick={addDeputy}
        >
          ➕ Add Deputy
        </button>
      )}
    </div>
  );
};

export default Deputies;