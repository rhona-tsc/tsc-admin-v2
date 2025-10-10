import React, { useEffect, useState } from "react";
import LineupsLineupSize from "./LineupsLineupSize";
import SpaceRequired from "./SpaceRequired";
import ElectricityReqs from "./ElectricityReqs";
import DryAndLevel from "./DryAndLevel";
import CoverOverhead from "./CoverOverhead";
import SetupAndSoundCheckTimes from "./SetupAndSoundCheckTimes";
import SoundLimitations from "./SoundLimitations";
import HotMeal from "./HotMeal";
import Parking from "./Parking";
import ChangingRoom from "./ChangingRoom";
import OtherRequests from "./OtherRequests";
import AddAnotherBandMemberButton from "./AddAnotherBandMemberButton";
import AddAnotherLineup from "./AddAnotherLineup";
import { assets } from "../assets/assets";
import IemsToggle from "./IemsToggle";
import AmplessToggle from "./AmplessToggle";
import HasDrumsToggle from "./HasDrumsToggle";
import WithoutDrumsToggle from "./WithoutDrumsToggle";
import AcousticToggle from "./AcousticToggle";
import AnotherVocalistToggle from "./AnotherVocalistToggle";
import ElectricDrumsToggle from "./ElectricDrumsToggle";
import FirstNameInput from "./BandMemberFields/FirstNameInput";
import LastNameInput from "./BandMemberFields/LastNameInput";
import EmailInput from "./BandMemberFields/EmailInput";
import MobileNumberInput from "./BandMemberFields/MobileNumberInput";
import CarRegistrationInput from "./BandMemberFields/CarRegistrationInput";
import DietaryRequirementsInput from "./BandMemberFields/DietaryRequirementsInput";
import SortCodeInput from "./BandMemberFields/SortCodeInput";
import AccountNumberInput from "./BandMemberFields/AccountNumberInputs";
import AccountNameInput from "./BandMemberFields/AccountNameInput";
import WirelessCheckbox from "./BandMemberFields/WirelessCheckbox";
import SoloPACheckbox from "./BandMemberFields/SoloPACheckbox";
import DuoPACheckbox from "./BandMemberFields/DuoPACheckbox";
import CanDJCheckbox from "./BandMemberFields/CanDJCheckbox";
import InstrumentInput from "./BandMemberFields/InstrumentInput";
import FeeInput from "./BandMemberFields/FeeInput";
import MURatesToggle from "./BandMemberFields/MURatesToggle";
import AdditionalRoleInput from "./BandMemberFields/AdditionalRoleInput";
import PostCodeInput from "./BandMemberFields/PostCodeInput";
import HaveMixingConsoleCheckbox from "./BandMemberFields/HaveMixingConsoleCheckbox";
import HasDJBoothCheckbox from "./BandMemberFields/HasDJBoothCheckbox";
import HasDjTableCheckbox from "./BandMemberFields/HasDjTableCheckbox";

import DeputiesInput from "./BandMemberFields/DeputiesInput";
import RoamingPercussion from "./RoamingPercussion";
import { toast } from "react-toastify";
import InPromoCheckbox from "./BandMemberFields/InPromoCheckbox";
import MusicianProfileImageUpload from "./MusicianProfileImageUpload";

// Note: This component is NOT responsible for rendering step control buttons (Next/Approve/Reject).
// Those should be handled in the parent component (e.g., ActForm or Stepper).
const LineupsComponent = ({ lineups = [], setLineups, setExtrasPricing, selectedSongs, actGenres = [] }) => {
  useEffect(() => {
    // Open the first lineup by default if only one lineup exists
    if (lineups.length === 1) {
      setOpenLineups([true]);
    } else {
      setOpenLineups(Array(lineups.length).fill(false));
    }
  }, [lineups.length]);
  
    const allSavedMembers = Array.from(
    new Map(
      lineups
        .flatMap((l) => l.bandMembers || [])
        .map((m) => [
          `${m.firstName?.trim()?.toLowerCase() || ""}_${m.lastName?.trim()?.toLowerCase() || ""}_${m.instrument?.trim()?.toLowerCase() || ""}`,
          m,
        ])
    ).values()
  );
  const [openLineups, setOpenLineups] = useState([true]);

  const toggleLineup = (index) => {
    setOpenLineups((prev) =>
      prev.map((open, i) => (i === index ? !open : open))
    );
  };

  const removeLineup = (indexToRemove) => {
    if (lineups.length <= 1) return;
    setLineups((prev) => prev.filter((_, i) => i !== indexToRemove));
    setOpenLineups((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const updateBandMember = (lineupIndex, memberIndex, field, value) => {
    setLineups((prev) => {
      const updated = [...prev];
      updated[lineupIndex].bandMembers[memberIndex][field] = value;
  
      // handle isEssential within setLineups (safe access to updated data)
      if (field === "isEssential") {
        const member = updated[lineupIndex].bandMembers[memberIndex];
        const roleKey = member.instrument?.toLowerCase().replace(/\s+/g, "_");
  
        if (roleKey) {
          const fee = parseFloat(member.fee) || 0;
  
          setExtrasPricing((prevExtras) => {
            const newPricing = { ...prevExtras };
            if (!value) {
              newPricing[roleKey] = fee;
              toast.info(`"${member.instrument}" has been added as an extra.`);
            } else {
              delete newPricing[roleKey];
              toast.info(`"${member.instrument}" has been removed from the extras list.`);
            }
            return newPricing;
          });
        }
      }
  
      return updated;
    });
  };
  
  

  const [sortCodeError, setSortCodeError] = useState("");
  const [accountError, setAccountError] = useState("");
  const [postCodeError, setPostCodeError] = useState("");

  const validateSortCode = (sortCode) => {
    return /^\d{2}-\d{2}-\d{2}$|^\d{6}$/.test(sortCode);
  };

  const validateAccountNumber = (number) => {
    return /^\d{6,8}$/.test(number);
  };

  const MU_RATES = {
    "Lead Female Vocal": 351.1,
    "Lead Male Vocal": 351.1,
    "Lead Vocal": 351.1,
    "MC/Rapper": 351.1,
    "Lead Male Vocal/Rapper": 351.1,
    "Lead Female Vocal/Rapper": 351.1,
    "Lead Male Vocal/Rapper & Guitarist": 403.77,
    "Lead Female Vocal/Rapper & Guitarist": 403.77,
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
    "Trumpet/Trombone/Rapper": 403.77,
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
    "Backing Vocals",
    "Band Leading",
    "Client Liaison",
    "Musical Directing",
    "Roadie",
    "Assistant",
    "Photographer",
  ];

  const OTHER_EQUIPMENT = [
    "PA Speakers",
    "Floor Monitor",
    "Mixing Desk",
    "Microphones",
    "Amplifiers",
    "Microphone Stands",
    "Wifi Rotuer",
    "Pedal Boards",
    "IEMs and packs",
    "Electric Drum Kit",
    "Keyboard",
    "Electric Guitar",
    "Electric Bass",
    "Electric Acoustic Guitar",
    "DI Box",
    "Wireless Jacks",
    "Wireless Microphones",
    "Uplighters",
    "T-Bar Lights",
    "Disco Ball",
    "Tablet/iPad",
  ];

  const updateAdditionalRole = (
    lineupIndex,
    memberIndex,
    roleIndex,
    field,
    value
  ) => {
    console.log("🛠️ updateAdditionalRole", { lineupIndex, memberIndex, roleIndex, field, value });
  
    setLineups((prevLineups) => {
      const newLineups = [...prevLineups];
      const member = newLineups[lineupIndex].bandMembers[memberIndex];
  
      const newRoles = [...(member.additionalRoles || [])];
      const updatedRole = {
        ...newRoles[roleIndex],
        [field]: value,
      };
      console.log("Updated role object:", updatedRole);
  
      newRoles[roleIndex] = updatedRole;
      newLineups[lineupIndex].bandMembers[memberIndex].additionalRoles = newRoles;
  
      return newLineups;
    });
  };

  const addAdditionalRole = (lineupIndex, memberIndex) => {
    setLineups((prevLineups) =>
      prevLineups.map((lineup, lIdx) => {
        if (lIdx !== lineupIndex) return lineup;

        const updatedBandMembers = lineup.bandMembers.map((member, mIdx) => {
          if (mIdx !== memberIndex) return member;

          return {
            ...member,
            additionalRoles: [
              ...(member.additionalRoles || []),
              { isEssential: "", role: "", fee: "" },
            ],
          };
        });

        return {
          ...lineup,
          bandMembers: updatedBandMembers,
        };
      })
    );
  };

  const removeAdditionalRole = (lineupIndex, memberIndex, roleIndex) => {
    setLineups((prevLineups) =>
      prevLineups.map((lineup, lIdx) => {
        if (lIdx !== lineupIndex) return lineup;

        const updatedBandMembers = lineup.bandMembers.map((member, mIdx) => {
          if (mIdx !== memberIndex) return member;

          const filtered = (member.additionalRoles || []).filter(
            (_, i) => i !== roleIndex
          );

          return {
            ...member,
            additionalRoles: filtered,
          };
        });

        return {
          ...lineup,
          bandMembers: updatedBandMembers,
        };
      })
    );
  };


  // Helper: define auto-added DJ-related roles
  const getAutoDJRoles = (member) => {
    const roles = [];

    if (member.canDJ) {
      roles.push("Up to 3hrs DJing with Mixing Console/Decks");
      if (member.haveMixingConsoleOrDecks)
        roles.push("Mixing Console/Decks Porterage");
      if (member.hasDjTable) roles.push("DJ Table Porterage");
      if (member.haveBooth) roles.push("DJ Booth Porterage");
    }

    return roles;
  };

  const djFlags = lineups
    .flatMap((l) =>
      l.bandMembers.map((m) => [
        m.canDJ,
        m.haveBooth,
        m.hasDjTable,
        m.haveMixingConsoleOrDecks,
      ])
    )
    .flat();

  useEffect(() => {
    setLineups((prevLineups) =>
      prevLineups.map((lineup) => {
        const updatedMembers = (lineup.bandMembers || []).map((member) => {
          const autoRoles = getAutoDJRoles(member);
          
          let currentRoles = member.additionalRoles || [];
          
          // ✅ Capture preserved DJ role fees from the member
          const preservedFees = {};
          currentRoles.forEach((r) => {
            if (
              [
                "Up to 3hrs DJing with Mixing Console/Decks",
                "Mixing Console/Decks Porterage",
                "DJ Table Porterage",
                "DJ Booth Porterage",
              ].includes(r.role)
            ) {
              preservedFees[r.role] = r.additionalFee ?? r.fee ?? "";            }
          });
          
          // ✅ Filter out old DJ auto roles
          currentRoles = currentRoles.filter(
            (r) =>
              ![
                "Up to 3hrs DJing with Mixing Console/Decks",
                "Mixing Console/Decks Porterage",
                "DJ Table Porterage",
                "DJ Booth Porterage",
              ].includes(r.role)
          );
          
          // ✅ Re-add them with preserved fees
          autoRoles.forEach((roleText) => {
            if (!currentRoles.some((r) => r.role === roleText)) {
              currentRoles.push({
                role: roleText,
                additionalFee: preservedFees[roleText] || "",
              });
            }
          });

          return {
            ...member,
            additionalRoles: currentRoles,
          };
        });

        return {
          ...lineup,
          bandMembers: updatedMembers,
        };
      })
    );
  }, [JSON.stringify(djFlags)]);

  const [openBandMembers, setOpenBandMembers] = useState(() => {
    const initialState = {};
    lineups.forEach((lineup, lineupIndex) => {
      initialState[lineupIndex] = {};
      (lineup.bandMembers || []).forEach((_, memberIndex) => {
        initialState[lineupIndex][memberIndex] = true;
      });
    });
    return initialState;
  });

  const toggleBandMember = (lineupIndex, memberIndex) => {
    setOpenBandMembers((prev) => ({
      ...prev,
      [lineupIndex]: {
        ...prev[lineupIndex],
        [memberIndex]: !prev[lineupIndex]?.[memberIndex],
      },
    }));
  };

  const removeBandMember = (lineupIndex, memberIndex) => {
    setLineups((prev) =>
      prev.map((lineup, lIdx) => {
        if (lIdx !== lineupIndex) return lineup;
        const updated = [...lineup.bandMembers];
        updated.splice(memberIndex, 1);
        return { ...lineup, bandMembers: updated };
      })
    );

    setOpenBandMembers((prev) => {
      const updated = { ...prev };
      if (updated[lineupIndex]) {
        delete updated[lineupIndex][memberIndex];
      }
      return updated;
    });
  };

  const handleAddBandMember = (lineupIndex, newMember) => {
    setLineups((prevLineups) => {
      const newLineups = prevLineups.map((lineup, i) => {
        if (i === lineupIndex) {
          return {
            ...lineup,
            bandMembers: [...lineup.bandMembers, newMember],
          };
        }
        return lineup;
      });

      const newMemberIndex = newLineups[lineupIndex].bandMembers.length - 1;

      setOpenBandMembers((prev) => ({
        ...prev,
        [lineupIndex]: {
          ...(prev[lineupIndex] || {}),
          [newMemberIndex]: true,
        },
      }));

      return newLineups;
    });
  };



  return (
    <div className="w-full grid grid-cols-1 gap-4 ">
      {lineups.map((lineupItem, lineupIndex) => (
    <div
      key={lineupIndex}
      className={`border p-4 rounded mb-6 w-full bg-gray-100 transition-all duration-300 shadow-sm ${
        openLineups[lineupIndex] ? "col-span-8 " : "col-span-8"
      }`}
    >
      <div className="flex  items-center justify-between cursor-pointer mb-2 w-full">
       <div
          className="flex items-center gap-4 w-full"
          onClick={() => toggleLineup(lineupIndex)}
        >
          <img
            src={assets.dropdown_icon}
            alt="Toggle"
            className={`transition-transform duration-200 ${
              openLineups[lineupIndex] ? "rotate-90" : ""
            }`}
          />
          <h2 className="text-xl font-semibold">
            {lineupItem.actSize || `Lineup ${lineupIndex + 1}`}
            {(() => {
              const memberOrder = [
                'lead vocal',
                'female lead vocal',
                'male lead vocal',
                'vocalist-guitarist',
                'vocalist',
                'keys',
                'keyboard',
                'guitar',
                'bass',
                'bass guitar',
                'electric guitar',
                'drums' // Drums intentionally last
              ];
              const bandMembers = lineupItem.bandMembers || [];

              const essentialInstruments = bandMembers
                .filter(m => m.isEssential)
                .map(m => ({
                  name: m.instrument === 'Other' ? m.customInstrument || 'Other' : m.instrument,
                  role: (m.instrument || '').toLowerCase(),
                }));

              const essentialRoles = Array.from(new Set(
                bandMembers
                  .flatMap(m => (m.additionalRoles || []).filter(r => r.isEssential).map(r => r.role))
                  .filter(Boolean)
              ));

              // Sort so that all "Vocal" instruments appear first, drums last, others by memberOrder
              const sortedMembers = [...essentialInstruments].sort((a, b) => {
                const isAVocal = a.name?.toLowerCase().includes("vocal");
                const isBVocal = b.name?.toLowerCase().includes("vocal");

                if (isAVocal && !isBVocal) return -1;
                if (!isAVocal && isBVocal) return 1;

                const aIsDrums = a.role === "drums";
                const bIsDrums = b.role === "drums";
                if (aIsDrums && !bIsDrums) return 1;
                if (!aIsDrums && bIsDrums) return -1;

                const aIndex = memberOrder.indexOf(a.role.toLowerCase());
                const bIndex = memberOrder.indexOf(b.role.toLowerCase());
                return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
              });

              const instrumentsList = sortedMembers.map(m => m.name).join(', ').replace(/, ([^,]*)$/, ' & $1');
              const rolesText = essentialRoles.length > 0 ? ` (with ${essentialRoles.join(' and ')})` : '';

              // Prepend "with " after the opening parenthesis of rolesText if present
              const rolesTextWithWith = essentialRoles.length > 0
                ? ` (with ${essentialRoles.join(' and ')})`
                : '';

              return instrumentsList ? (
                <span className="text-base font-normal"> – {instrumentsList}{rolesTextWithWith}</span>
              ) : '';
            })()}
          </h2>
        </div>
        {lineups.length > 1 && (
          <button
          type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeLineup(lineupIndex);
            }}
            className="text-gray-400 hover:text-red-500 text-lg font-bold ml-4"
            title="Remove lineup"
          >
            <img src={assets.cross_icon} alt="Remove" className="w-5 h-5 items-end" />
          </button>
        )}
      </div>

            {openLineups[lineupIndex] && (
              <>
                <div className="flex gap-4 items-end mt-4 ">
                  <div className="flex-1">
                    <LineupsLineupSize
                      lineupItem={lineupItem}
                      lineupIndex={lineupIndex}
                      setLineups={setLineups}
                    />
                  </div>
                  <div className="flex-1">
                    <SpaceRequired
                      lineup={lineupItem}
                      index={lineupIndex}
                      setLineups={setLineups}
                    />
                  </div>
                  <div className="flex-1">
                    <ElectricityReqs
                      lineup={lineupItem}
                      index={lineupIndex}
                      setLineups={setLineups}
                    />
                  </div>
                  <div className="flex-1">
                    <SoundLimitations
                      lineup={lineupItem}
                      index={lineupIndex}
                      setLineups={setLineups}
                    />
                  </div>
                </div>

                <div className="flex gap-4 items-end mt-4">
                  <div className="flex-1">
                    <SetupAndSoundCheckTimes
                      lineup={lineupItem}
                      index={lineupIndex}
                      setLineups={setLineups}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-6 items-start mt-4">
                  <div className="space-y-5 col-span-5">
                    <DryAndLevel
                      lineup={lineupItem}
                      index={lineupIndex}
                      setLineups={setLineups}
                    />
                    <CoverOverhead
                      lineup={lineupItem}
                      index={lineupIndex}
                      setLineups={setLineups}
                    />
                    <ChangingRoom
                      lineup={lineupItem}
                      index={lineupIndex}
                      setLineups={setLineups}
                    />
                  </div>
                  <div className="space-y-5 col-span-7">
                    <HotMeal
                      lineup={lineupItem}
                      index={lineupIndex}
                      setLineups={setLineups}
                    />
                    <Parking
                      lineup={lineupItem}
                      index={lineupIndex}
                      setLineups={setLineups}
                    />
                    <OtherRequests
                      lineup={lineupItem}
                      index={lineupIndex}
                      setLineups={setLineups}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-6 items-start mt-4">
                  <div className="space-y-5 col-span-5">
                    <IemsToggle
                      lineup={lineupItem}
                      lineupIndex={lineupIndex}
                      setLineups={setLineups}
                    />
                    <AmplessToggle
                      lineup={lineupItem}
                      lineupIndex={lineupIndex}
                      setLineups={setLineups}
                    />
                    <AcousticToggle
                      lineup={lineupItem}
                      lineupIndex={lineupIndex}
                      setLineups={setLineups}
                    />
                    <AnotherVocalistToggle
                      lineup={lineupItem}
                      lineupIndex={lineupIndex}
                      setLineups={setLineups}
                    />
                  </div>
                  <div className="space-y-5 col-span-7">
                    <HasDrumsToggle
                      lineup={lineupItem}
                      lineupIndex={lineupIndex}
                      setLineups={setLineups}
                    />
                    <WithoutDrumsToggle
                      lineup={lineupItem}
                      lineupIndex={lineupIndex}
                      setLineups={setLineups}
                    />
                    <ElectricDrumsToggle
                      lineup={lineupItem}
                      lineupIndex={lineupIndex}
                      setLineups={setLineups}
                    />
                  </div>
                  {lineupItem.hasDrums && lineupItem.bandMembers.some((m) => m.canDJ) && (
  <RoamingPercussion
    lineup={lineupItem}
    lineupIndex={lineupIndex}
    setLineups={setLineups}
  />
)}
                </div>

                <div className="mt-6 w-full bg-white p-3">
                  <label className="text-xl">Team Members</label>
                  {lineupItem.bandMembers.map((member, memberIndex) => (
                    <div
                      key={memberIndex}
                      className="flex grid grid-cols-8 items-start m-4"
                    >
                      <div className="col-span-8 flex justify-between items-center mb-2">
                        <div
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() =>
                            toggleBandMember(lineupIndex, memberIndex)
                          }
                        >
                          <img
                            src={assets.dropdown_icon}
                            alt="Toggle"
                            className={`transition-transform duration-200 w-4 h-6 m-1 ${
                              openBandMembers[lineupIndex]?.[memberIndex]
                                ? "rotate-90"
                                : ""
                            }`}
                          />
                          <h4 className="text-lg font-semibold">
                            {member.firstName || member.instrument
                              ? `${member.firstName || "Unnamed"}${
                                  member.instrument
                                    ? ` – ${member.instrument}`
                                    : ""
                                }`
                              : `Team Member ${memberIndex + 1}`}
                          </h4>
                        </div>

                        <button
                        type="button"
                          className="text-gray-400 hover:text-red-500"
                          onClick={() =>
                            removeBandMember(lineupIndex, memberIndex)
                          }
                        >
                          <img
                            src={assets.cross_icon}
                            alt="Remove"
                            className="w-5 h-5"
                          />
                        </button>
                      </div>
                      {openBandMembers[lineupIndex]?.[memberIndex] && (
                        <>
                          {/* Left side: col-span-4, inputs col-span-2 */}
                          <div className="col-span-4 grid grid-cols-2 gap-4">
                            <div className="col-span-1">
                              <FirstNameInput
                                member={member}
                                index={lineupIndex}
                                memberIndex={memberIndex}
                                updateBandMember={updateBandMember}
                              />
                            </div>
                            <div className="col-span-1">
                              <LastNameInput
                                member={member}
                                index={lineupIndex}
                                memberIndex={memberIndex}
                                updateBandMember={updateBandMember}
                              />
                            </div>
                            <div className="col-span-1">
                              <EmailInput
                                member={member}
                                index={lineupIndex}
                                memberIndex={memberIndex}
                                updateBandMember={updateBandMember}
                              />
                            </div>
                            <div className="col-span-1">
                              <MobileNumberInput
                                member={member}
                                index={lineupIndex}
                                memberIndex={memberIndex}
                                updateBandMember={updateBandMember}
                              />
                            </div>
                            <div className="col-span-1">
                              <CarRegistrationInput
                                member={member}
                                index={lineupIndex}
                                memberIndex={memberIndex}
                                updateBandMember={updateBandMember}
                              />
                            </div>
                            <div className="col-span-1">
                              <DietaryRequirementsInput
                                member={member}
                                index={lineupIndex}
                                memberIndex={memberIndex}
                                updateBandMember={updateBandMember}
                              />
                            </div>
                            <div className="col-span-1">
                              <AccountNameInput
                                member={member}
                                index={lineupIndex}
                                memberIndex={memberIndex}
                                updateBandMember={updateBandMember}
                        
                              />
                            </div>
                            <div className="col-span-1">
                              <SortCodeInput
                                member={member}
                                index={lineupIndex}
                                memberIndex={memberIndex}
                                updateBandMember={updateBandMember}
                                sortCodeError={sortCodeError}
                                setSortCodeError={setSortCodeError}
                                validateSortCode={validateSortCode}
                              />
                            </div>
                            <div className="col-span-1">
                              <AccountNumberInput
                                member={member}
                                index={lineupIndex}
                                memberIndex={memberIndex}
                                updateBandMember={updateBandMember}
                                accountError={accountError}
                                setAccountError={setAccountError}
                                validateAccountNumber={validateAccountNumber}
                              />
                            </div>
                            <div className="col-span-1">
                              <PostCodeInput
                                member={member}
                                index={lineupIndex}
                                memberIndex={memberIndex}
                                updateBandMember={updateBandMember}
                                postCodeError={postCodeError}
                                setPostCodeError={setPostCodeError}
                              />
                            </div>
                            <div className="col-span-1">
                              <WirelessCheckbox
                                member={member}
                                index={lineupIndex}
                                memberIndex={memberIndex}
                                updateBandMember={updateBandMember}
                              />
                            </div>
                            <div className="col-span-1">
                              <InPromoCheckbox
                                member={member}
                                index={lineupIndex}
                                memberIndex={memberIndex}
                                updateBandMember={updateBandMember}
                              />
                            </div>
                            <div className="col-span-1">
                              <SoloPACheckbox
                                member={member}
                                index={lineupIndex}
                                memberIndex={memberIndex}
                                updateBandMember={updateBandMember}
                              />
                            </div>
                            <div className="col-span-1">
                              <DuoPACheckbox
                                member={member}
                                index={lineupIndex}
                                memberIndex={memberIndex}
                                updateBandMember={updateBandMember}
                              />
                            </div>
                            <div className="col-span-1">
                              <CanDJCheckbox
                                member={member}
                                index={lineupIndex}
                                memberIndex={memberIndex}
                                updateBandMember={updateBandMember}
                              />
                            </div>
                            {/* Conditional DJ gear checkboxes (only if canDJ is true) */}
                            {member.canDJ && (
                              <>
                                <div className="col-span-1">
                                  <HaveMixingConsoleCheckbox
                                    member={member}
                                    index={lineupIndex}
                                    memberIndex={memberIndex}
                                    updateBandMember={updateBandMember}
                                  />
                                </div>
                                <div className="col-span-1">
                                  <HasDjTableCheckbox
                                    member={member}
                                    index={lineupIndex}
                                    memberIndex={memberIndex}
                                    updateBandMember={updateBandMember}
                                  />
                                </div>
                                <div className="col-span-1">
                                  <HasDJBoothCheckbox
                                    member={member}
                                    index={lineupIndex}
                                    memberIndex={memberIndex}
                                    updateBandMember={updateBandMember}
                                  />
                                </div>
                              </>
                            )}
                          </div>

                          {/* Right side: col-span-4, with input spans */}
                          <div className="col-span-4 grid grid-cols-4 gap-4 ml-4 items-start">
                          <div className="col-span-4 grid grid-cols-12 gap-4 items-center">
  
  <div className="col-span-6">

  </div>
  <div className="col-span-12">
  <MusicianProfileImageUpload
    // Convert the stored string → array for the component
    profileImage={
      member.musicianProfileImageUpload
        ? [
            {
              id: "existing",
              url: member.musicianProfileImageUpload,
              title: "Profile",
            },
          ]
        : []
    }
    // Convert array → string and persist to the band member
    setProfileImage={(arr) =>
      updateBandMember(
        lineupIndex,
        memberIndex,
        "musicianProfileImageUpload",
        arr?.[0]?.url || ""
      )
    }

    bandMembers={lineupItem?.bandMembers || []}
    lineupSize={lineupItem?.actSize}
    additionalKeywords={[member?.firstName, member?.instrument].filter(Boolean)}
  />

    <InstrumentInput
      member={member}
      index={lineupIndex}
      memberIndex={memberIndex}
      updateBandMember={updateBandMember}
      MU_RATES={MU_RATES}
    />
  </div>
  <div className="col-span-3">
    <FeeInput
      member={member}
      index={lineupIndex}
      memberIndex={memberIndex}
      updateBandMember={updateBandMember}
      MU_RATES={MU_RATES}
    />
  </div>
  <div className="col-span-3 text-sm text-center justify-center">    <MURatesToggle
      member={member}
      index={lineupIndex}
      memberIndex={memberIndex}
      updateBandMember={updateBandMember}
    />
  </div>


</div>
    <div className="col-span-4">
      {(member.additionalRoles && member.additionalRoles.length > 0
        ? member.additionalRoles
        : []
      ).map((role, i) => (
        <div key={i} className="mb-2">
          <AdditionalRoleInput
            role={role}
            index={i}
            isLast={i === (member.additionalRoles?.length || 1) - 1}
            updateAdditionalRole={(
              roleIndex,
              field,
              value
            ) =>
              updateAdditionalRole(
                lineupIndex,
                memberIndex,
                roleIndex,
                field,
                value
              )
            }
            removeAdditionalRole={(roleIndex) =>
              removeAdditionalRole(
                lineupIndex,
                memberIndex,
                roleIndex
              )
            }
            addAdditionalRole={() =>
              addAdditionalRole(lineupIndex, memberIndex)
            }
            OTHER_ROLES={OTHER_ROLES}
          />
       {i === member.additionalRoles.length - 1 && (
         <button
           type="button"
           className="text-blue-500 text-xs underline ml-1"
           onClick={() => addAdditionalRole(lineupIndex, memberIndex)}
         >
           Add Another
         </button>
       )}
        </div>
      ))}
      {/* Show "Add Additional Role" button if no roles exist */}
      {(!member.additionalRoles || member.additionalRoles.length === 0) && (
        <button
          type="button"
          className="border px-2 py-1 rounded text-sm mt-2 bg-gray-100 hover:bg-gray-200"
          onClick={() => addAdditionalRole(lineupIndex, memberIndex)}
        >
          Add Additional Role
        </button>
      )}
    </div>
                         
                          </div>
                          
                      <div className="col-span-8">
          <DeputiesInput
            member={member}
   index={lineupIndex}
      memberIndex={memberIndex}
   updateBandMember={updateBandMember}
      actRepertoire={Array.isArray(selectedSongs) ? selectedSongs : []}   // ← act’s songs
   isVocalSlot={/vocal|singer|lead|backing/i.test((member?.instrument || ""))}  // ← force vocal filter
     actGenres={Array.isArray(actGenres) ? actGenres : []}

 />
                    </div>
                    </>
                      )}
                    </div>
                  ))}

                  

                  <div className="flex gap-4 items-center mt-4">
                    <AddAnotherBandMemberButton
                      lineup={lineupIndex}
                      index={lineupIndex}
                      onAdd={() => {
                        const newMember = {
                          firstName: "",
                          lastName: "",
                          instrument: "",
                          additionalRoles: [],
                          phone: "",
                          email: "",
                          useMURatesForFees: false,
                          additionalFee: 0,
                          fee: "",
                          sortCode: "",
                          accountNumber: "",
                          dietaryRequirements: "",
                          postCode: "",
                          carRegistration: "",
                          canDJ: false,
                          haveMixingConsoleOrDecks: false,
                          hasDjTable: false,
                          haveBooth: false,
                          wireless: false,
                          inPromo: false,
                          haveSoloPa: false,
                          haveDuoPa: false,
                        
                          isEssential: true,
                          deputies: [
                            {
                              firstName: "",
                              lastName: "",
                              phoneNumber: "",
                              email: "",
                            },
                          ],
                        };
                        handleAddBandMember(lineupIndex, newMember);
                      }}
                    />
                    <select
                      className="border px-4 py-2 mt-2 rounded"
                      onChange={(e) => {
                        const selectedIndex = e.target.value;
                        if (selectedIndex !== "") {
                          const selectedMember = allSavedMembers[selectedIndex];
                          const clonedMember = {
                            ...JSON.parse(JSON.stringify(selectedMember)),
                            isEssential: selectedMember.isEssential ?? true,
                          };
                          handleAddBandMember(lineupIndex, clonedMember);
                          e.target.value = "";
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Add a Saved Band Member
                      </option>
                      {allSavedMembers.map((member, i) => (
                        <option key={i} value={i}>
                          {member.firstName} {member.lastName} –{" "}
                          {member.instrument}
                        </option>
                        
                      ))}
                    </select>

                  </div>
                </div>
              </>
            )}
          
         </div>
         
  ))}


  {/* Add A Lineup button row */}
  <div className="col-span-12">
  <AddAnotherLineup
  lineups={lineups}
  setLineups={setLineups}
  setOpenLineups={setOpenLineups}
/>

  </div>
 
</div>
  );
};

export default LineupsComponent;
