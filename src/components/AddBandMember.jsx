import React, { useState } from "react";

const AddBandMember = ({lineups, setLineups}) => {
  const [feeError, setFeeError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [accountError, setAccountError] = useState("");
  const [sortCodeError, setSortCodeError] = useState("");
  const [postCodeError, setPostCodeError] = useState("");
  const [useMURatesForFees, setUseMURatesForFees] = useState(false);
  

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
    "Non-Intrumental Role":
  };

  const validateAccountNumber = (number) => {
    return /^\d{6,8}$/.test(number);
  };

  const validateSortCode = (sortCode) => {
    return /^\d{2}-\d{2}-\d{2}$|^\d{6}$/.test(sortCode);
  };

  const updateBandMember = (lineupIndex, memberIndex, field, value) => {
    SetLineups((prevLineups) =>
      prevLineups.map((lineups, idx) => {
        if (idx !== lineupIndex) return lineups;
  
        const updatedMembers = lineups.bandMembers.map((member, mIdx) => {
          if (mIdx !== memberIndex) return member;
  
          // ✅ Handle equipment
          if (field.startsWith("equipment.")) {
            const eqIndex = parseInt(field.split(".")[1]);
            const updatedEquipment = [...member.equipment];
            updatedEquipment[eqIndex] = value;
            return { ...member, equipment: updatedEquipment };
          }
  
          // ✅ Handle wattage
          if (field.startsWith("wattage.")) {
            const wtIndex = parseInt(field.split(".")[1]);
            const updatedWattage = [...member.wattage];
            updatedWattage[wtIndex] = value;
            return { ...member, wattage: updatedWattage };
          }
  
          // ✅ Handle deputies array replacement
          if (field === "deputies") {
            return { ...member, deputies: value };
          }
  
          // ✅ Default update
          return { ...member, [field]: value };
        });
  
        return { ...lineups, bandMembers: updatedMembers };
      })
    );
  };

  return (
    <div className="w-full">
      {lineups.map((lineupItem, index) =>
        Array.isArray(lineupItem.bandMembers)
          ? lineupItem.bandMembers.map((member, memberIndex) => (
            <div key={memberIndex} className="w-full">
<h3 className="font-semibold text-lg">
  {member?.firstName
    ? `${member.firstName}${member.instrument ? ` - ${member.instrument}` : ""}`
    : "Add your team member details"}
</h3>
  {/* Create an 8-column grid and place items in the left 4 columns */}
  <div className="grid grid-cols-8 gap-6">
     <div className="col-span-2">
                  {" "}
                  <label>Account Number</label>
                  <input
                    type="text"
                    value={member.accountNumber}
                    onChange={(e) => {
                      const accountNumber = e.target.value.replace(/\D/g, ""); // Remove non-numeric characters
                      updateBandMember(
                        index,
                        memberIndex,
                        "accountNumber",
                        accountNumber
                      );
                      setAccountError(
                        validateAccountNumber(accountNumber)
                          ? ""
                          : "Account number must be 6 to 8 digits."
                      );
                    }}
                    className={`w-full px-3 py-2 border ${
                      accountError ? "border-red-500" : ""
                    }`}
                  />
                  {accountError && (
                    <p className="text-red-500 text-sm">{accountError}</p>
                  )}
                </div>
                <div className="col-span-2">
                  {" "}
                  <label>Sort Code</label>
                  <input
                    type="text"
                    value={member.sortCode}
                    onChange={(e) => {
                      let formattedSortCode = e.target.value.replace(/\D/g, ""); // Remove non-numeric characters

                      // Auto-format as XX-XX-XX
                      if (formattedSortCode.length >= 4) {
                        formattedSortCode = formattedSortCode
                          .slice(0, 6)
                          .replace(/(\d{2})(\d{2})(\d{2})/, "$1-$2-$3");
                      }

                      updateBandMember(
                        index,
                        memberIndex,
                        "sortCode",
                        formattedSortCode
                      );
                      setSortCodeError(
                        validateSortCode(formattedSortCode)
                          ? ""
                          : "Sort code must be 6 digits (XX-XX-XX)."
                      );
                    }}
                    className={`w-full px-3 py-2 border ${
                      sortCodeError ? "border-red-500" : ""
                    }`}
                    placeholder="XX-XX-XX"
                    maxLength={8} // Ensures max length of formatted input
                  />
                  {sortCodeError && (
                    <p className="text-red-500 text-sm">{sortCodeError}</p>
                  )}
                </div>
                <div className="col-span-2">
                  {" "}
                  <label>Post Code</label>
                  <input
                    type="text"
                    value={member.postCode}
                    onChange={(e) => {
                      const inputValue = e.target.value.toUpperCase(); // Convert to uppercase
                      updateBandMember(
                        index,
                        memberIndex,
                        "postCode",
                        inputValue
                      );

                      // Real-time validation using UK postcode regex
                      const ukPostcodeRegex =
                        /^(GIR 0AA|[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2})$/;

                      if (!ukPostcodeRegex.test(inputValue)) {
                        setPostCodeError("Please enter a valid UK postcode.");
                      } else {
                        setPostCodeError(""); // Clear error when valid
                      }
                    }}
                    className={`w-full px-3 py-2 border ${
                      postCodeError ? "border-red-500" : ""
                    }`}
                    placeholder="e.g., SW1A 1AA"
                  />
                  {postCodeError && (
                    <p className="text-red-500 text-sm">{postCodeError}</p>
                  )}
                </div>
                <div className="col-span-2">
                  {" "}
                  <label>Car Registration Plate</label>
                  <input
                    type="text"
                    value={member.carRegistration}
                    onChange={(e) => {
                      const inputValue = e.target.value.toUpperCase();
                      updateBandMember(
                        index,
                        memberIndex,
                        "carRegistration",
                        inputValue
                      );
                    }}
                    className="w-full px-3 py-2 border"
                    placeholder="e.g., TS12 3CC"
                  />
                </div>
                <div className="col-span-2">
                  {" "}
                  <label>Dietary Requirements</label>
                  <input
                    type="text"
                    value={member.dietaryRequirements}
                    onChange={(e) =>
                      updateBandMember(
                        index,
                        memberIndex,
                        "dietaryRequirements",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border"
                  />
                </div>
                <div className="col-span-2">
                  {" "}
                  <label className="block mb-2">
                    Can DJ with mixing console and/or decks
                  </label>
                  <div className="flex items-center gap-6">
                    <p>{member.canDJ ? "Yes" : "No"}</p>
                    <div
                      className={`toggle ${member.canDJ ? "on" : "off"}`}
                      onClick={() =>
                        updateBandMember(
                          index,
                          memberIndex,
                          "canDJ",
                          !member.canDJ
                        )
                      }
                      style={{
                        cursor: "pointer",
                        display: "inline-block",
                        width: "60px",
                        height: "30px",
                        borderRadius: "15px",
                        backgroundColor: member.canDJ ? "#ff6667" : "#ccc",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "5px",
                          left: member.canDJ ? "30px" : "5px",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: "white",
                          transition: "left 0.2s",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  {" "}
                  <label className="block mb-2">
                    Have a mixing console/decks
                  </label>
                  <div className="flex items-center gap-6">
                    <p>{member.haveMixingConsoleOrDecks ? "Yes" : "No"}</p>
                    <div
                      className={`toggle ${
                        member.haveMixingConsoleOrDecks ? "on" : "off"
                      }`}
                      onClick={() =>
                        updateBandMember(
                          index,
                          memberIndex,
                          "haveMixingConsoleOrDecks",
                          !member.haveMixingConsoleOrDecks
                        )
                      }
                      style={{
                        cursor: "pointer",
                        display: "inline-block",
                        width: "60px",
                        height: "30px",
                        borderRadius: "15px",
                        backgroundColor: member.haveMixingConsoleOrDecks
                          ? "#ff6667"
                          : "#ccc",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "5px",
                          left: member.haveMixingConsoleOrDecks
                            ? "30px"
                            : "5px",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: "white",
                          transition: "left 0.2s",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  {" "}
                  <label className="block mb-2">
                    Have & able to transport a DJ table
                  </label>
                  <div className="flex items-center gap-6">
                    <p>{member.hasDjTable ? "Yes" : "No"}</p>
                    <div
                      className={`toggle ${member.hasDjTable ? "on" : "off"}`}
                      onClick={() =>
                        updateBandMember(
                          index,
                          memberIndex,
                          "hasDjTable",
                          !member.hasDjTable
                        )
                      }
                      style={{
                        cursor: "pointer",
                        display: "inline-block",
                        width: "60px",
                        height: "30px",
                        borderRadius: "15px",
                        backgroundColor: member.hasDjTable ? "#ff6667" : "#ccc",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "5px",
                          left: member.hasDjTable ? "30px" : "5px",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: "white",
                          transition: "left 0.2s",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  {" "}
                  <label className="block mb-2">
                    Have and able to transport DJ Booth
                  </label>
                  <div className="flex items-center gap-6">
                    <p>{member.haveBooth ? "Yes" : "No"}</p>
                    <div
                      className={`toggle ${member.haveBooth ? "on" : "off"}`}
                      onClick={() =>
                        updateBandMember(
                          index,
                          memberIndex,
                          "haveBooth",
                          !member.haveBooth
                        )
                      }
                      style={{
                        cursor: "pointer",
                        display: "inline-block",
                        width: "60px",
                        height: "30px",
                        borderRadius: "15px",
                        backgroundColor: member.haveBooth ? "#ff6667" : "#ccc",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "5px",
                          left: member.haveBooth ? "30px" : "5px",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: "white",
                          transition: "left 0.2s",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  {" "}
                  <label className="block mb-2">Wireless - can roam</label>
                  <div className="flex items-center gap-6">
                    <p>{member.wireless ? "Yes" : "No"}</p>
                    <div
                      className={`toggle ${member.wireless ? "on" : "off"}`}
                      onClick={() =>
                        updateBandMember(
                          index,
                          memberIndex,
                          "wireless",
                          !member.wireless
                        )
                      }
                      style={{
                        cursor: "pointer",
                        display: "inline-block",
                        width: "60px",
                        height: "30px",
                        borderRadius: "15px",
                        backgroundColor: member.wireless ? "#ff6667" : "#ccc",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "5px",
                          left: member.wireless ? "30px" : "5px",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: "white",
                          transition: "left 0.2s",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="col-span-2"> </div>
                <div className="col-span-2">
                  {" "}
                  <label className="block mb-2">
                    Have own PA for solo sets
                  </label>
                  <div className="flex items-center gap-6">
                    <p>{member.haveSoloPa ? "Yes" : "No"}</p>
                    <div
                      className={`toggle ${member.haveSoloPa ? "on" : "off"}`}
                      onClick={() =>
                        updateBandMember(
                          index,
                          memberIndex,
                          "haveSoloPa",
                          !member.haveSoloPa
                        )
                      }
                      style={{
                        cursor: "pointer",
                        display: "inline-block",
                        width: "60px",
                        height: "30px",
                        borderRadius: "15px",
                        backgroundColor: member.haveSoloPa ? "#ff6667" : "#ccc",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "5px",
                          left: member.haveSoloPa ? "30px" : "5px",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: "white",
                          transition: "left 0.2s",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  {" "}
                  <label className="block mb-2">Have own PA for duo sets</label>
                  <div className="flex items-center gap-6">
                    <p>{member.haveDuoPa ? "Yes" : "No"}</p>
                    <div
                      className={`toggle ${member.haveDuoPa ? "on" : "off"}`}
                      onClick={() =>
                        updateBandMember(
                          index,
                          memberIndex,
                          "haveDuoPa",
                          !member.haveDuoPa
                        )
                      }
                      style={{
                        cursor: "pointer",
                        display: "inline-block",
                        width: "60px",
                        height: "30px",
                        borderRadius: "15px",
                        backgroundColor: member.haveDuoPa ? "#ff6667" : "#ccc",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "5px",
                          left: member.haveDuoPa ? "30px" : "5px",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: "white",
                          transition: "left 0.2s",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
</div>
<div className="col-span-2">
                <div className="col-span-4 grid grid-cols-8 gap-6 w-full">
                  <div className="col-span-2">
                    {" "}
                    <label>Equipment Item</label>
                    <input
                      type="text"
                      value={member.equipment}
                      onChange={(e) =>
                        updateBandMember(
                          index,
                          memberIndex,
                          "equipment",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border"
                    />{" "}
                  </div>
                  <div className="col-span-2">
                    {" "}
                    <label>Wattage</label>
                    <input
                      type="number"
                      value={member.wattage}
                      onChange={(e) =>
                        updateBandMember(
                          index,
                          memberIndex,
                          "wattage",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border"
                    />{" "}
                  </div>
                  <div className="col-span-2">
                    <label></label>
                    <input
                      type="text"
                      value={member.equipment}
                      onChange={(e) =>
                        updateBandMember(
                          index,
                          memberIndex,
                          "equipment",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border"
                    />{" "}
                  </div>
                  <div className="col-span-2">
                    {" "}
                    <label></label>
                    <input
                      type="number"
                      value={member.wattage}
                      onChange={(e) =>
                        updateBandMember(
                          index,
                          memberIndex,
                          "wattage",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={member.equipment}
                      onChange={(e) =>
                        updateBandMember(
                          index,
                          memberIndex,
                          "equipment",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border"
                    />
                  </div>
                  <div className="col-span-2">
                    {" "}
                    <label></label>
                    <input
                      type="number"
                      value={member.wattage}
                      onChange={(e) =>
                        updateBandMember(
                          index,
                          memberIndex,
                          "wattage",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border"
                    />{" "}
                  </div>
                  <div className="col-span-2">
                    <label></label>
                    <input
                      type="text"
                      value={member.equipment}
                      onChange={(e) =>
                        updateBandMember(
                          index,
                          memberIndex,
                          "equipment",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border"
                    />{" "}
                  </div>
                  <div className="col-span-2">
                    {" "}
                    <label></label>
                    <input
                      type="number"
                      value={member.wattage}
                      onChange={(e) =>
                        updateBandMember(
                          index,
                          memberIndex,
                          "wattage",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border"
                    />{" "}
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={member.equipment}
                      onChange={(e) =>
                        updateBandMember(
                          index,
                          memberIndex,
                          "equipment",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border"
                    />{" "}
                  </div>
                  <div className="col-span-2">
                    {" "}
                    <label></label>
                    <input
                      type="number"
                      value={member.wattage}
                      onChange={(e) =>
                        updateBandMember(
                          index,
                          memberIndex,
                          "wattage",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border"
                    />{" "}
                  </div>
                  <div className="col-span-2">
                    <label></label>
                    <input
                      type="text"
                      value={member.equipment}
                      onChange={(e) =>
                        updateBandMember(
                          index,
                          memberIndex,
                          "equipment",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border"
                    />{" "}
                  </div>
                  <div className="col-span-2">
                    {" "}
                    <label></label>
                    <input
                      type="number"
                      value={member.wattage}
                      onChange={(e) =>
                        updateBandMember(
                          index,
                          memberIndex,
                          "wattage",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border"
                    />{" "}
                  </div>
                  <div className="col-span-2">
                    {" "}
                    <input
                      type="text"
                      value={member.equipment}
                      onChange={(e) =>
                        updateBandMember(
                          index,
                          memberIndex,
                          "equipment",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border"
                    />{" "}
                  </div>
                  <div className="col-span-2">
                    {" "}
                    <label></label>
                    <input
                      type="number"
                      value={member.wattage}
                      onChange={(e) =>
                        updateBandMember(
                          index,
                          memberIndex,
                          "wattage",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border"
                    />{" "}
                  </div>
                  <div className="col-span-2">
                    <label></label>
                    <input
                      type="text"
                      value={member.equipment}
                      onChange={(e) =>
                        updateBandMember(
                          index,
                          memberIndex,
                          "equipment",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border"
                    />{" "}
                  </div>
                  <div className="col-span-2">
                    {" "}
                    <label></label>
                    <input
                      type="number"
                      value={member.wattage}
                      onChange={(e) =>
                        updateBandMember(
                          index,
                          memberIndex,
                          "wattage",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border"
                    />{" "}
                  </div>
                </div>
              </div>
              </div>
              </div>
              
            ))
          : null
          
      )}
    </div>

  );
};

export default AddBandMember;
