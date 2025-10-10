// BandMemberSection.jsx
import React, { useState } from "react";
import Deputies from "./Deputies"; // or embed the logic inside here
import { assets } from "../assets/assets";

const BandMemberSection = ({ member, index, memberIndex, updateBandMember }) => {
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
      "Sound Engineering",
      "PA & Light Provision",
      "Band Leading",
      "Client Liasion",
      "Musical Directing",
      "Roadie",
      "Assistant",
      "Photographer"
    ];
  
    // Removed unused addNewBandMember function
  


  
    const validateAccountNumber = (number) => {
      return /^\d{6,8}$/.test(number);
    };
  
    const validateSortCode = (sortCode) => {
      return /^\d{2}-\d{2}-\d{2}$|^\d{6}$/.test(sortCode);
    };

    console.log("Rendering Member:", member);
    console.log("From Lineup Index:", index, "Member Index:", memberIndex);

  return (
    <div className="border p-4 rounded mb-4 bg-gray-100">
    {/* Header with toggle */}
    <div
      className="flex items-center justify-between w-full cursor-pointer"
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="flex items-center gap-4 w-full">
        <div className="transform transition-transform duration-200">
          <img
            src={assets.dropdown_icon}
            className={`transition-transform duration-200 ${
              isOpen ? "rotate-90" : ""
            }`}
          />
        </div>

        {/* ✅ Dynamic Title - Updates with firstName & instrument */}
        <h3 className="font-semibold text-lg">
  {member?.firstName
    ? `${member.firstName}${member.instrument ? ` - ${member.instrument}` : ""}`
    : "Add your team member details"}
</h3>
      </div>
    </div>

      {/* Form fields & Deputies */}
      {isOpen && (
        <div className="mt-4">
         <div className="w-full">
                   <div key={memberIndex} className="w-full">
                     <h3 className="text-lg font-semibold w-full">
                       Team Member {memberIndex + 1}
                     </h3>
         
                     {/* ✅ 8-Column Grid Layout (First Name, Last Name) */}
                     <div className="grid grid-cols-8 gap-x-6 gap-y-3">
                      {/* ✅ First Name Input */}
                  <div className="col-span-2">
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
           <label>Fee (£)</label>
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
           <label className="mb-1">Use MU Rates?</label>
         
         
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
                           />
                         </div>
                       <div className="col-span-2">
  <label>Additional Role</label>

  {member.role === "Other" ? (
    <input
      type="text"
      placeholder="Enter custom role"
      value={member.role || ""}
      onChange={(e) => {
        const value = e.target.value;
        updateBandMember(index, memberIndex, "role", value);

        if (value.trim() === "") {
          updateBandMember(index, memberIndex, "role", ""); // Reset if cleared
        }
      }}
      className="w-full px-2 py-2 border"
    />
  ) : (
    <select
      className="w-full px-2 py-2 border"
      value={member.role || ""}
      onChange={(e) => {
        const selectedRole = e.target.value;
        updateBandMember(index, memberIndex, "role", selectedRole);
        if (selectedRole === "Other") {
          updateBandMember(index, memberIndex, "role", ""); // Start with empty
        }
      }}
    >
      <option value="">Select a role</option>
      {OTHER_ROLES.map((role) => (
        <option key={role} value={role || ""}>
          {role}
        </option>
      ))}
      <option value="Other">Other</option>
    </select>
  )}
</div>

<div className="col-span-1">
  <label>Fee (£)</label>
  <input
    type="text"
    value={member.additionalFee || ""}
    onChange={(e) => {
      let inputValue = e.target.value.replace(/[^0-9.]/g, "");
      if ((inputValue.match(/\./g) || []).length > 1) {
        inputValue = inputValue.slice(0, -1);
      }
      if (inputValue.startsWith(".")) {
        inputValue = "";
      }

      updateBandMember(index, memberIndex, "additionalFee", inputValue);
      setFeeError(
        inputValue === "" || isNaN(inputValue)
          ? "Fee must be a valid number"
          : ""
      );
    }}
    className={`w-full px-3 py-2 border ${
      feeError ? "border-red-500" : ""
    }`}
    placeholder="Fee"
  />
  {feeError && <p className="text-red-500 text-sm">{feeError}</p>}
</div>

<div className="col-span-1 flex items-center">
  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={member.isEssential || false}
      onChange={(e) =>
        updateBandMember(index, memberIndex, "isEssential", e.target.checked)
      }
    />
    Essential?
  </label>
</div>
                         <div className="col-span-1"></div>
                       
         
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
               className="accent-[#ff6667] w-6 h-6"
             />
             Has a wireless mic & can roam
           </label>
         </div>
         
         
         {/* Solo PA */}
         <div className="col-span-2">
           <label className="flex items-center gap-2 mt-7">
             <input
               type="checkbox"
               checked={member.haveSoloPa || ""}
               onChange={() =>
                 updateBandMember(index, memberIndex, "haveSoloPa", !member.haveSoloPa)
               }
               className="accent-[#ff6667] w-6 h-6"
             />
             Has own PA for solo sets
           </label>
         </div>
         
         {/* Duo PA */}
         <div className="col-span-2">
           <label className="flex items-center gap-2 mt-7">
             <input
               type="checkbox"
               checked={member.haveDuoPa || ""}
               onChange={() =>
                 updateBandMember(index, memberIndex, "haveDuoPa", !member.haveDuoPa)
               }
               className="accent-[#ff6667] w-6 h-6"
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
               className="accent-[#ff6667] w-6 h-6"
             />
             Can DJ with mixing console and/or decks
           </label>
         </div>
         
         {/* Have Mixing Console */}
         <div className="col-span-2">
           <label className="flex items-center gap-2 mt-4">
             <input
               type="checkbox"
               checked={member.haveMixingConsoleOrDecks || ""}
               onChange={() =>
                 updateBandMember(
                   index,
                   memberIndex,
                   "haveMixingConsoleOrDecks",
                   !member.haveMixingConsoleOrDecks
                 )
               }
               className="accent-[#ff6667] w-8 h-8"
             />
             Has a mixing console/decks
           </label>
         </div>
         
         {/* Has DJ Table */}
         <div className="col-span-2">
           <label className="flex items-center gap-2 mt-4">
             <input
               type="checkbox"
               checked={member.hasDjTable || ""}
               onChange={() =>
                 updateBandMember(index, memberIndex, "hasDjTable", !member.hasDjTable)
               }
               className="accent-[#ff6667] w-8 h-8"
             />
             Has a DJ table & able to transport
           </label>
         </div>
         
         {/* Has Booth */}
         <div className="col-span-2">
           <label className="flex items-center gap-2 mt-4">
             <input
               type="checkbox"
               checked={member.haveBooth || ""}
               onChange={() =>
                 updateBandMember(index, memberIndex, "haveBooth", !member.haveBooth)
               }
               className="accent-[#ff6667] w-8 h-8"
             />
             Has a DJ Booth & able to transport
           </label>
         </div>
      
         {(!Array.isArray(member.equipment) && updateBandMember(index, memberIndex, "equipment", [""])) || null}
         {(!Array.isArray(member.wattage) && updateBandMember(index, memberIndex, "wattage", [""])) || null}
         {(Array.isArray(member.equipment) ? member.equipment : []).map((item, eqIndex) => (
           <React.Fragment key={eqIndex}>
             {/* Equipment Input */}
             <div className="col-span-5">
               {eqIndex === 0 && <label>Equipment Item</label>}
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
         
             {/* Wattage Input */}
             <div className="col-span-1">
               {eqIndex === 0 && <label>Wattage</label>}
             <input
                 type="number"
                 value={(member.wattage && member.wattage[eqIndex]) || ""}
                 onChange={(e) =>
                   updateBandMember(index, memberIndex, `wattage.${eqIndex}`, e.target.value)
                 }
                 className="w-full px-3 py-2 border"
                 placeholder="e.g. 500"
               />
             </div>
         
             {/* Remove Button for rows after the first */}
             {eqIndex !== 0 && (
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
             )}
         
             {/* Add Button shown inline at the end of first row */}
             {eqIndex === 0 && (
               <div className="col-span-2 flex items-end">
                 <button
                   type="button"
                   onClick={() => {
                     const updatedEquipment = [...member.equipment, ""];
                     const updatedWattage = [...member.wattage, ""];
                     updateBandMember(index, memberIndex, "equipment", updatedEquipment);
                     updateBandMember(index, memberIndex, "wattage", updatedWattage);
                   }}
                   className="w-full px-4 py-2 bg-black text-white rounded shadow hover:bg-[#ff6667] transition"
                 >
                 Add More Equipment
                 </button>
               </div>
             )}
           </React.Fragment>
         ))}
                         </div></div>
             </div>
          
          
          <Deputies member={member} index={index} updateBandMember={updateBandMember} />
        </div>
      )}
    </div>
  );
};

export default BandMemberSection;