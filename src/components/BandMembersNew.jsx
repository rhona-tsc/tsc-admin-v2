import React, { useState, useEffect } from "react";
import Deputies from "./Deputies";
import { assets } from "../assets/assets";
import FeeLabelWithToolTip from './FeeLabelWithToolTip';

const AddBandMember = ({member, index, memberIndex, updateBandMember,  removeBandMember}) => {
    const [isOpen, setIsOpen] = useState(true);
  const [feeError, setFeeError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [accountError, setAccountError] = useState("");
  const [sortCodeError, setSortCodeError] = useState("");
  const [postCodeError, setPostCodeError] = useState("");
  

  const MU_RATES = {
    "Lead Female Vocal": 351.1,
    "Lead Male Vocal": 351.1,
    "Lead Vocal": 351.1,
    "MC / Rapper": 351.1,
    "Vocalist-Guitarist": 403.77,
    "Vocalist-Bassist": 403.77,
    "Bass Guitar": 416.1,
    "Electric Guitar": 416.1,
    Keyboard: 389.6,
    "Acoustic Guitar": 389.6,
    "Acoustic Bass": 389.6,
    Drums: 389.6,
    Saxophone: 351.1,
    Trumpet: 351.1,
    Trombone: 351.1,
    "Double Bass": 389.6,
    Cello: 377.6,
    "Violin / Fiddle": 351.1,
    Banjo: 351.1,
    Mandolin: 351.1,
    Percussion: 351.1,
    Cajon: 351.1,
    Flute: 351.1,
    Clarinet: 351.1,
  };

  const OTHER_ROLES = [
    "Backing Vocalist",
    "Sound Engineering",
    "Band Leading",
    "Client Liasion",
    "Musical Directing",
    "Roadie",
    "Assistant",
    "Photographer"
  ];


  const validateAccountNumber = (number) => {
    return /^\d{6,8}$/.test(number);
  };

  const validateSortCode = (sortCode) => {
    return /^\d{2}-\d{2}-\d{2}$|^\d{6}$/.test(sortCode);
  };
  console.log("Rendering Member:", member);
  console.log("From Lineup Index:", index, "Member Index:", memberIndex);

  const addAdditionalRole = (role = "", fee = "") => {
    const updated = [...(member.additionalRoles || [])];
    updated.push({ role: "Other", role, fee });
    updateBandMember(index, memberIndex, "additionalRoles", updated);
  };
  
  const updateAdditionalRole = (i, field, value) => {
    const updated = [...(member.additionalRoles || [])];
    updated[i][field] = value;
    updateBandMember(index, memberIndex, "additionalRoles", updated);
  };
  
  const removeAdditionalRole = (i) => {
    const updated = [...(member.additionalRoles || [])];
    updated.splice(i, 1);
    updateBandMember(index, memberIndex, "additionalRoles", updated);
  };

  
  useEffect(() => {
    const roleMap = [
      {
        condition: member.canDJ,
        role: "Up to 3hrs DJing with Mixing Console/Decks",
      },
      {
        condition: member.canDJ && member.haveMixingConsoleOrDecks,
        role: "Mixing Console/Decks Porterage",
      },
      {
        condition: member.canDJ && member.hasDjTable,
        role: "DJ Table Porterage",
      },
      {
        condition: member.canDJ && member.haveBooth,
        role: "DJ Booth Porterage",
      },
    ];
  
    const updatedRoles = [...(member.additionalRoles || [])];
  
    roleMap.forEach(({ condition, role }) => {
      const exists = updatedRoles.some((r) => r.role === role);
  
      if (condition && !exists) {
        updatedRoles.push({ role: "Other", role, fee: "" });
      }
  
      if (!condition && exists) {
        const indexToRemove = updatedRoles.findIndex((r) => r.role === role);
        if (indexToRemove !== -1) {
          updatedRoles.splice(indexToRemove, 1);
        }
      }
    });
  
    updateBandMember(index, memberIndex, "additionalRoles", updatedRoles);
  }, [member.canDJ, member.haveMixingConsoleOrDecks, member.hasDjTable, member.haveBooth]);


  useEffect(() => {
    if (!member.additionalRoles || member.additionalRoles.length === 0) {
      updateBandMember(index, memberIndex, "additionalRoles", [{ role: "", fee: "" }]);
    }
  }, []);

  return (
    <div className="border p-4 rounded mb-4 bg-gray-50">
    {/* Header with toggle */}
    <div className="flex items-center justify-between w-full">
  {/* Toggle section */}
  <div
    className="flex items-center gap-4 w-full cursor-pointer"
    onClick={() => setIsOpen(!isOpen)}
  >
    <div className="transform transition-transform duration-200">
      <img
        src={assets.dropdown_icon}
        className={`transition-transform duration-200 ${
          isOpen ? "rotate-90" : ""
        }`}
      />
    </div>
    <h3 className="font-semibold text-lg">
      {member?.firstName
        ? `${member.firstName}${member.instrument ? ` - ${member.instrument}` : ""}`
        : "Add your team member details"}
    </h3>
  </div>

  {/* ❌ Remove Button */}
  <button
     type="button"
     onClick={() => removeBandMember(index, memberIndex)}
     className="text-gray-400 hover:text-red-500 transition text-xl font-bold ml-4"
     title="Remove Team Member"
  >
    <img src={assets.cross_icon}/>
  </button>
</div>

   {/* Form fields & Deputies */}

   {isOpen && (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-6">
            {/* First Column */}
            <div className="space-y-4">
              {/* Your first column fields here... */}
            </div>

            {/* Second Column */}
            <div className="space-y-4">
              {/* Your second column fields here... */}
            </div>
          </div>

          {/* Equipment Section */}
          <div className="mt-6">
            {/* Your equipment loop here... */}
          </div>

          {/* Deputies */}
          <div className="mt-6">
            <Deputies
              member={member}
              index={index}
              memberIndex={memberIndex}
              updateBandMember={updateBandMember}
            />
          </div>
        </div>
      )}
    </div>
  );
};


   {isOpen && (
        <div className="mt-4">
         <div className="grid grid-cols-2">
  {/* FIRST COL */}
  <div className="col-span-1">
                   <div key={memberIndex} className="w-full">

         
                     {/* ✅ 8-Column Grid Layout (First Name, Last Name) */}
                     <div className="grid grid-cols-8 gap-x-6 gap-y-3">
                      {/* ✅ First Name Input */}
                  <div className="col-span-1">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={member.firstName || ""}
                      onChange={(e) =>
                        updateBandMember(index, memberIndex, "firstName", e.target.value)
                      }
                      className="w-full px-3 py-2 border"
                    />
                  </div>
         
                       <div className="col-span-2">
                         <label>Last Name</label>
                         <input
                           type="text"
                           value={member.lastName || ""}
                           onChange={(e) =>
                             updateBandMember(index, memberIndex, "lastName", e.target.value)
                           }
                           className="w-full px-3 py-2 border"
                         />
                       </div>

  </div>

  <div className="col-span-2">
                           {" "}
                           <label>Email</label>
                           <input
                             type="email" // Enforces built-in email validation
                             value={member.email || ""}
                             onChange={(e) => {
                               const inputValue = e.target.value;
                               updateBandMember(index, memberIndex, "email", inputValue);
         
                               // Real-time validation
                               if (
                                 !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
                                   inputValue
                                 )
                               ) {
                                 setEmailError("Please enter a valid email address.");
                               } else {
                                 setEmailError(""); // Clear error when valid
                               }
                             }}
                             className={`w-full px-3 py-2 border ${
                               emailError ? "border-red-500" : ""
                             }`}
                             placeholder="example@email.com"
                           />
                           {emailError && (
                             <p className="text-red-500 text-sm">{emailError}</p>
                           )}
                         </div>
                         <div className="col-span-2">
                           {" "}
                           <label>Mobile Number</label>
                           <input
                             type="tel" // ✅ Specifies it's a telephone number input
                             value={member.phoneNumber || ""}
                             onChange={(e) =>
                               updateBandMember(
                                 index,
                                 memberIndex,
                                 "phoneNumber",
                                 e.target.value
                               )
                             }
                             className="w-full px-3 py-2 border"
                             placeholder="+44 7XXXXXXXXX"
                             pattern="^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$" // ✅ UK mobile number format
                             onBlur={(e) => {
                               if (
                                 !/^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/.test(
                                   e.target.value
                                 )
                               ) {
                                 alert(
                                   "Please enter a valid UK mobile number (e.g. +44 7123 456789 or 07123 456789)."
                                 );
                               }
                             }}
                           />
                         </div>

                         <div className="col-span-2">
           <label>Car Registration Plate</label>
           <input
             type="text"
             value={member.carRegistration || ""}
             onChange={(e) => {
               const inputValue = e.target.value.toUpperCase();
               updateBandMember(index, memberIndex, "carRegistration", inputValue);
             }}
             className="w-full px-3 py-2 border"
             placeholder="e.g., TS12 3CC"
           />
         </div>
         
         <div className="col-span-2">
           <label>Dietary Requirements</label>
           <input
             type="text"
             value={member.dietaryRequirements || ""}
             onChange={(e) =>
               updateBandMember(index, memberIndex, "dietaryRequirements", e.target.value)
             }
             className="w-full px-3 py-2 border"
           />
         </div>

         <div className="col-span-2">
           <label>Sort Code</label>
           <input
             type="text"
             value={member.sortCode || ""}
             onChange={(e) => {
               let formattedSortCode = e.target.value.replace(/\D/g, "");
               if (formattedSortCode.length >= 4) {
                 formattedSortCode = formattedSortCode
                   .slice(0, 6)
                   .replace(/(\d{2})(\d{2})(\d{2})/, "$1-$2-$3");
               }
               updateBandMember(index, memberIndex, "sortCode", formattedSortCode);
               setSortCodeError(
                 validateSortCode(formattedSortCode)
                   ? ""
                   : "Sort code must be 6 digits (XX-XX-XX)."
               );
             }}
             className={`w-full px-3 py-2 border ${sortCodeError ? "border-red-500" : ""}`}
             placeholder="XX-XX-XX"
             maxLength={8}
           />
           {sortCodeError && <p className="text-red-500 text-sm">{sortCodeError}</p>}
         </div>
         <div className="col-span-2">
           <label>Account Number</label>
           <input
             type="text"
             value={member.accountNumber || ""}
             onChange={(e) => {
               const accountNumber = e.target.value.replace(/\D/g, "");
               updateBandMember(index, memberIndex, "accountNumber", accountNumber);
               setAccountError(
                 validateAccountNumber(accountNumber)
                   ? ""
                   : "Account number must be 6 to 8 digits."
               );
             }}
             className={`w-full px-3 py-2 border ${accountError ? "border-red-500" : ""}`}
           />
           {accountError && <p className="text-red-500 text-sm">{accountError}</p>}
         </div>
         
         
         <div className="col-span-2">
           <label>Post Code</label>
           <input
             type="text"
             value={member.postCode || ""}
             onChange={(e) => {
               const inputValue = e.target.value.toUpperCase();
               updateBandMember(index, memberIndex, "postCode", inputValue);
         
               const ukPostcodeRegex = /^(GIR 0AA|[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2})$/;
               setPostCodeError(
                 ukPostcodeRegex.test(inputValue)
                   ? ""
                   : "Please enter a valid UK postcode."
               );
             }}
             className={`w-full px-3 py-2 border ${postCodeError ? "border-red-500" : ""}`}
             placeholder="e.g., SW1A 1AA"
           />
           {postCodeError && <p className="text-red-500 text-sm">{postCodeError}</p>}
         </div>
         
         {/* Wireless */}
         <div className="col-span-2">
           <label className="flex items-center gap-2 mt-7">
             <input
               type="checkbox"
               checked={member.wireless || ""}
               onChange={() =>
                 updateBandMember(index, memberIndex, "wireless", !member.wireless)
               }
               className="accent-[#ff6667] w-8 h-8"
             />
             Has a wireless mic & can roam
           </label>
         </div>
           {/* Solo PA */}
           <div className="col-span-2">
           <label className="flex items-center gap-2 mt-5">
             <input
               type="checkbox"
               checked={member.haveSoloPa || ""}
               onChange={() =>
                 updateBandMember(index, memberIndex, "haveSoloPa", !member.haveSoloPa)
               }
               className="accent-[#ff6667] w-8 h-8"
             />
             Has own PA for solo sets
           </label>
         </div>
         
         {/* Duo PA */}
         <div className="col-span-2">
           <label className="flex items-center gap-2 mt-5">
             <input
               type="checkbox"
               checked={member.haveDuoPa || ""}
               onChange={() =>
                 updateBandMember(index, memberIndex, "haveDuoPa", !member.haveDuoPa)
               }
               className="accent-[#ff6667] w-8 h-8"
             />
             Has own PA for duo sets
           </label>
         </div>
         
       {/* Can DJ */}
      <div className="col-span-2">
        <label className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            checked={member.canDJ || ""}
            onChange={() =>
              updateBandMember(index, memberIndex, "canDJ", !member.canDJ)
            }
            className="accent-[#ff6667] w-8 h-8"
          />
          Can DJ with mixing console and/or decks
        </label>
      </div>

         
         
        {/* Conditionally visible DJ gear toggles */}
      {member.canDJ && (
        <>
          <div className="col-span-2">
            <label className="flex items-center gap-2 mt-4">
             <input
  type="checkbox"
  checked={member.haveMixingConsoleOrDecks || false}
  onChange={(e) => {
    updateBandMember(index, memberIndex, "haveMixingConsoleOrDecks", e.target.checked);
  }}
  className="accent-[#ff6667] w-8 h-8"
/>
              Has a mixing console/decks
            </label>
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2 mt-4">
            <input
  type="checkbox"
  checked={member.hasDjTable || false}
  onChange={(e) => {
    updateBandMember(index, memberIndex, "hasDjTable", e.target.checked);
  }}
  className="accent-[#ff6667] w-8 h-8"
/>
              Has a DJ table & able to transport
            </label>
          </div>
          <div className="col-span-2">
          <label className="flex items-center gap-2 mt-4">
          <input
  type="checkbox"
  checked={member.haveBooth || false}
  onChange={(e) => {
    updateBandMember(index, memberIndex, "haveBooth", e.target.checked);
  }}
  className="accent-[#ff6667] w-8 h-8"
/>
Has a DJ Booth & able to transport
            </label>
          </div>
        </>
      )}
</div>
</div>
  {/* SECOND COL */}
   <div className="col-span-1">
 {/* ✅ New Row: Instrument (2 cols), Fee (1 col), MU Toggle (1 col) */}
 <div className="col-span-2">
           <label>Instrument</label>
         
           {member.instrument === "Other" ? (
             <input
               type="text"
               placeholder="Enter custom instrument"
               value={member.customInstrument || ""}
               onChange={(e) => {
                 const value = e.target.value;
                 updateBandMember(index, memberIndex, "customInstrument", value);
         
                 // If cleared, go back to dropdown
                 if (value.trim() === "") {
                   updateBandMember(index, memberIndex, "instrument", "");
                 }
               }}
               className="w-full px-3 py-2 border"
             />
           ) : (
             <select
               className="w-full px-3 py-2 border"
               value={member.instrument || ""}
               onChange={(e) => {
                 const selectedInstrument = e.target.value;
                 updateBandMember(index, memberIndex, "instrument", selectedInstrument);
         
                 if (member.useMURatesForFees) {
                   updateBandMember(index, memberIndex, "fee", MU_RATES[selectedInstrument] || "");
                 }
         
                 // If "Other" selected, initialize empty customInstrument field
                 if (selectedInstrument === "Other") {
                   updateBandMember(index, memberIndex, "customInstrument", "");
                 }
               }}
             >
               <option value="">Select instrument</option>
               {Object.keys(MU_RATES).map((instrument) => (
                 <option key={instrument} value={instrument || ""}>
                   {instrument}
                 </option>
               ))}
               <option value="Other">Other</option>
             </select>
           )}
         </div>
         
                       {/* ✅ Fee Input */}
                       <div className="col-span-1">
         <FeeLabelWithToolTip />
           <input
             type="text"
             value={member.useMURatesForFees ? MU_RATES[member.instrument] || "" : member.fee}
             onChange={(e) => {
               let inputValue = e.target.value.replace(/[^0-9.]/g, "");
         
               if ((inputValue.match(/\./g) || []).length > 1) {
                 inputValue = inputValue.slice(0, -1);
               }
               if (inputValue.startsWith(".")) {
                 inputValue = "";
               }
         
               updateBandMember(index, memberIndex, "fee", inputValue);
               setFeeError(inputValue === "" || isNaN(inputValue) ? "Fee must be a valid number" : "");
             }}
             className={`w-full px-3 py-2 border ${feeError ? "border-red-500" : ""}`}
             placeholder="Fee"
             disabled={member.useMURatesForFees} // ✅ Member-specific MU rates toggle
           />
           {feeError && <p className="text-red-500 text-sm">{feeError}</p>}
         </div>
         
         {/* ✅ MU Standard Rates Toggle */}
         <div className="col-span-1 flex flex-col ">
         <label className="mb-1">
  Use{" "}
  <a
    href="https://musiciansunion.org.uk/working-performing/gigs-and-live-performances/live-engagement-rates-of-pay/national-gig-rates"
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-600 underline hover:text-blue-800"
  >
    MU Rates
  </a>
  ?
</label>         
         
           <div className="flex items-center gap-2 ml-8">
                           <input
                             type="checkbox"
                             checked={member.useMURatesForFees}
                             onChange={() =>
                               updateBandMember(index, memberIndex, "useMURatesForFees", !member.useMURatesForFees)
                             }
                             className="w-8 h-8 accent-[#ff6667] cursor-pointer items-center mt-1 border-2 border-gray-300"
                           />
                      
                         </div>
                     </div>
                     <div className="col-span-4">
                         <label> Role</label>
         
                         {(member.additionalRoles || []).map((item, i) => (
        <div key={i} className="grid grid-cols-4 gap-4 items-end mb-4">
          <div className="col-span-2">
            {item.role === "Other" ? (
              <input
                type="text"
                placeholder="Enter custom role"
                value={item.role || ""}
                onChange={(e) => updateAdditionalRole(i, "role", e.target.value)}
                onBlur={() => {
                  if (!item.role || item.role.trim() === "") {
                    updateAdditionalRole(i, "role", "");
                  }
                }}
                className="w-full px-3 py-2 border"
              />
            ) : (
              <select
                className="w-full px-3 py-2 border"
                value={item.role || ""}
                onChange={(e) => {
                  const selectedRole = e.target.value;
                  updateAdditionalRole(i, "role", selectedRole);
                  if (selectedRole === "Other") {
                    updateAdditionalRole(i, "role", "");
                  }
                }}
              >
                <option value="">Select a role</option>
                {OTHER_ROLES.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
                <option value="Other">Other</option>
              </select>
            )}
          </div>

          <div className="col-span-1">
            <input
              type="text"
              placeholder="Fee (£)"
              value={item.fee || ""}
              onChange={(e) => {
                let inputValue = e.target.value.replace(/[^0-9.]/g, "");
                if ((inputValue.match(/\./g) || []).length > 1) inputValue = inputValue.slice(0, -1);
                if (inputValue.startsWith(".")) inputValue = "";
                updateAdditionalRole(i, "fee", inputValue);
              }}
              className="w-full px-3 py-2 border"
            />
          </div>

          <div className="col-span-1">
            {i === (member.additionalRoles || []).length - 1 ? (
              <button
                type="button"
                onClick={addAdditionalRole}
                className="px-4 py-2 bg-black text-white text-sm rounded hover:bg-[#ff6667] transition"
              >
                Add More
              </button>
            ) : (
              <img
                src={assets.cross_icon}
                alt="Remove"
                className="w-5 h-5 mb-2 cursor-pointer"
                onClick={() => removeAdditionalRole(i)}
              />
            )}
          </div>
        </div>
      ))}

                         </div>

   </div>
  </div>
</div> {/* CLOSE second col */}
</div> {/* CLOSE grid-cols-2 */}

 

   
         
                      
         
                    
                       
                       
         
        
        
         
           
         
         {member.equipment.map((item, eqIndex) => (
  <React.Fragment key={eqIndex}>
    {/* Only render the latest input at the top */}
    {eqIndex === 0 && (
      <>
        <div className="col-span-5">
          
          <label>Equipment Item</label>
          <input
            type="text"
            value={item || ""}
            onChange={(e) =>
              updateBandMember(index, memberIndex, `equipment.${eqIndex}`, e.target.value)
            }
            className="w-full px-3 py-2 border"
            placeholder="e.g. Amp, Mixer, Speaker"
          />
        </div>
        <div className="col-span-1">
          <label>Wattage</label>
          <input
            type="number"
            value={member.wattage[eqIndex] || ""}
            onChange={(e) =>
              updateBandMember(index, memberIndex, `wattage.${eqIndex}`, e.target.value)
            }
            className="w-full px-3 py-2 border"
            placeholder="e.g. 500"
          />
        </div>
        <div className="col-span-2 flex items-end">
          <button
            type="button"
            onClick={() => {
              const updatedEquipment = ["", ...member.equipment];
              const updatedWattage = ["", ...member.wattage];
              updateBandMember(index, memberIndex, "equipment", updatedEquipment);
              updateBandMember(index, memberIndex, "wattage", updatedWattage);
            }}
            className="w-full px-4 py-2 bg-black text-white rounded shadow hover:bg-[#ff6667] transition"
          >
            Add More Equipment
          </button>
        </div>
      </>
    )}

    {/* Render the rest of the items below input row */}
    {eqIndex !== 0 && (
      <>
        <div className="col-span-5">
          <input
            type="text"
            value={item || ""}
            onChange={(e) =>
              updateBandMember(index, memberIndex, `equipment.${eqIndex}`, e.target.value)
            }
            className="w-full px-3 py-2 border"
            placeholder="e.g. Amp, Mixer, Speaker"
          />
        </div>
        <div className="col-span-1">
          <input
            type="number"
            value={member.wattage[eqIndex] || ""}
            onChange={(e) =>
              updateBandMember(index, memberIndex, `wattage.${eqIndex}`, e.target.value)
            }
            className="w-full px-3 py-2 border"
            placeholder="e.g. 500"
          />
        </div>
        <div className="col-span-2 flex items-end">
          <button
            type="button"
            onClick={() => {
              const updatedEquipment = member.equipment.filter((_, i) => i !== eqIndex);
              const updatedWattage = member.wattage.filter((_, i) => i !== eqIndex);
              updateBandMember(index, memberIndex, "equipment", updatedEquipment);
              updateBandMember(index, memberIndex, "wattage", updatedWattage);
            }}
            className="px-4 py-2 bg-black text-white rounded shadow hover:bg-[#ff6667] transition"
          >
            Remove
          </button>
        </div>
        </div> {/* CLOSE main container */}
      </>
    )}
  </React.Fragment>
))}
                         </div>
       
          
          <div>
             <Deputies
  member={member}
  index={index}
  memberIndex={memberIndex} 
  updateBandMember={updateBandMember}
/>       </div>
      )}
    </div>
  );
};

export default AddBandMember;