import React, { useEffect, useMemo, useState } from "react";
import { assets } from "../assets/assets";
import { toast } from "react-toastify";

const EXTRA_SET_CONFIG = {
  extra_30min_performance_per_band_member: {
    label: "Extra 30min Performance",
    minutes: 30,
  },
  extra_40min_performance_per_band_member: {
    label: "Extra 40min Performance",
    minutes: 40,
  },
  extra_45min_performance_per_band_member: {
    label: "Extra 45min Performance",
    minutes: 45,
  },
  extra_60min_performance_per_band_member: {
    label: "Extra 60min Performance",
    minutes: 60,
  },
  custom_extra_performance_per_band_member: {
    label: "Custom Extra Performance",
    minutes: null,
    isCustom: true,
  },
};

const safeNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const getEssentialMembersForExtraSet = (lineup) => {
  const members = Array.isArray(lineup?.bandMembers) ? lineup.bandMembers : [];

  return members.filter((member) => {
    if (!member) return false;
    if (member.isEssential === false) return false;
    return true;
  });
};

const getChargeableMembersForExtraSet = (lineup, minutes) => {
  const essentialMembers = getEssentialMembersForExtraSet(lineup);

  return essentialMembers.filter((member) => {
    return getExtraSetFeeFromMember(member, minutes) > 0;
  });
};

const getLineupDisplayName = (lineup, fallbackCount = 0) => {
  const actSize = String(lineup?.actSize || "").trim();
  if (actSize) return actSize;
  return fallbackCount ? `${fallbackCount}-Piece` : "Lineup";
};

const getExtraSetFeeFromMember = (member, minutes) => {
  if (!member) return 0;

  const additionalRates = Array.isArray(member?.additionalPerformanceRates)
    ? member.additionalPerformanceRates
    : [];

  const targetMinutes = safeNumber(minutes);
  if (targetMinutes > 0) {
    const matchedRate = additionalRates.find((rate) => {
      const rateMinutes = safeNumber(rate?.duration);
      return rateMinutes > 0 && rateMinutes === targetMinutes;
    });

    const matchedFee = safeNumber(matchedRate?.fee);
    if (matchedFee > 0) return matchedFee;
  }

  if (!targetMinutes) {
    const customRate = additionalRates.find((rate) => {
      const rateMinutes = safeNumber(rate?.duration);
      const rateFee = safeNumber(rate?.fee);
      return rateFee > 0 && rateMinutes > 0;
    });

    const customFee = safeNumber(customRate?.fee);
    if (customFee > 0) return customFee;
  }

  const directCandidates = [
    member?.[`extraPerformance${minutes}Fee`],
    member?.[`extra${minutes}Fee`],
    member?.[`extra_${minutes}min_fee`],
    member?.[`extra_${minutes}_fee`],
  ];

  for (const candidate of directCandidates) {
    const value = safeNumber(candidate);
    if (value > 0) return value;
  }

  const nestedCandidates = [
    member?.extraPerformanceFees?.[minutes],
    member?.extraPerformanceFees?.[`${minutes}`],
    member?.extraPerformanceFees?.[`${minutes}min`],
    member?.extraSetFees?.[minutes],
    member?.extraSetFees?.[`${minutes}`],
    member?.extraSetFees?.[`${minutes}min`],
    member?.extraPerformanceLengthFees?.[minutes],
    member?.extraPerformanceLengthFees?.[`${minutes}`],
    member?.extraPerformanceLengthFees?.[`${minutes}min`],
  ];

  for (const candidate of nestedCandidates) {
    const value = safeNumber(candidate);
    if (value > 0) return value;
  }

  return 0;
};

const getCustomExtraMinutesFromLineup = (lineup) => {
  const candidates = [
    lineup?.customExtraPerformanceMinutes,
    lineup?.customExtraMinutes,
    lineup?.extraPerformanceCustomMinutes,
    lineup?.extraPerformanceLengthCustom,
  ];

  for (const candidate of candidates) {
    const value = safeNumber(candidate);
    if (value > 0) return value;
  }

  const members = Array.isArray(lineup?.bandMembers) ? lineup.bandMembers : [];
  const customDurations = members
    .flatMap((member) =>
      Array.isArray(member?.additionalPerformanceRates)
        ? member.additionalPerformanceRates
        : []
    )
    .map((rate) => safeNumber(rate?.duration))
    .filter((value) => value > 0 && ![30, 40, 45, 60].includes(value));

  if (customDurations.length) {
    return customDurations[0];
  }

  return 0;
};

const buildAutoExtraSetTotals = (lineups = []) => {
  const result = {};

  Object.entries(EXTRA_SET_CONFIG).forEach(([extraKey, config]) => {
    const lineupBreakdown = (Array.isArray(lineups) ? lineups : [])
      .map((lineup) => {
        const essentialMembers = getEssentialMembersForExtraSet(lineup);
        if (!essentialMembers.length) return null;

        const chargeableMembers = getChargeableMembersForExtraSet(
          lineup,
          config.minutes
        );
        if (!chargeableMembers.length) return null;

        const total = chargeableMembers.reduce((sum, member) => {
          return sum + getExtraSetFeeFromMember(member, config.minutes);
        }, 0);

        if (total <= 0) return null;

        return {
          lineupId:
            lineup?._id ||
            lineup?.id ||
            getLineupDisplayName(lineup, essentialMembers.length),
          lineupLabel: getLineupDisplayName(lineup, essentialMembers.length),
          total,
          memberCount: essentialMembers.length,
          chargedMemberCount: chargeableMembers.length,
          minutes: config.isCustom
            ? getCustomExtraMinutesFromLineup(lineup)
            : config.minutes,
        };
      })
      .filter(Boolean);

    result[extraKey] = lineupBreakdown;
  });

  return result;
};

const ExtrasPricing = ({ useMURates, setUseMURates, extras, setExtras, lineups, setLineups }) => {
  const [showSound, setShowSound] = useState(true);
  const [showDJ, setShowDJ] = useState(true);
  const [showExtraSets, setShowExtraSets] = useState(true);
  const [showOther, setShowOther] = useState(true);

  const [customExtras, setCustomExtras] = useState([]);
  const [newExtraName, setNewExtraName] = useState("");
  const [newExtraPrice, setNewExtraPrice] = useState("");

  const autoExtraSetTotals = useMemo(() => buildAutoExtraSetTotals(lineups), [lineups]);

  useEffect(() => {
    setExtras((prev) => {
      let hasChanges = false;
      const next = { ...(prev || {}) };

      Object.keys(EXTRA_SET_CONFIG).forEach((extraKey) => {
        const breakdown = autoExtraSetTotals[extraKey] || [];
        if (!breakdown.length) return;

        const totals = breakdown
          .map((item) => safeNumber(item.total))
          .filter((n) => n > 0);

        const lowestTotal = totals.length ? Math.min(...totals) : 0;
        if (!lowestTotal) return;

        const currentPrice = safeNumber(prev?.[extraKey]?.price);
        if (currentPrice !== lowestTotal) {
          hasChanges = true;
          next[extraKey] = {
            ...(prev?.[extraKey] || {}),
            price: lowestTotal,
          };
        }
      });

      return hasChanges ? next : prev;
    });
  }, [autoExtraSetTotals, setExtras]);


  const groupedExtras = {
    "Sound Engineering": [
      "sound_engineering_for_another_act with your acts PA",
      "speedy_setup (60mins) - roadie and engineer duties only (travel added on top later for additional team member)",
      "wired_mic for speeches",
      "wireless_mic for speeches",
    ],
    "DJ Services": [
      "background_music_playlist",
      "up_to_3_hours_manned_playlist",
      "up_to_3_hours_band_member_DJ",
      "extra DJing per 30 mins",
      "DJ_live_sax_3x30mins",
      "DJ_live_bongos_3x30mins",
      "DJ_live_bongos_and_sax_3x30mins",
    ],
    "Extra Sets": [
      "extra_30min_performance_per_band_member",
      "extra_40min_performance_per_band_member",
      "extra_45min_performance_per_band_member",
      "extra_60min_performance_per_band_member",
      "custom_extra_performance_per_band_member",
    ],
    "Others": [
      "israeli_dancing_20mins_per_band_member",
      "late_stay_60min_per_band_member",
      "early_arrival_60min_per_band_member",
      "extra_song_request_per_band_member",
      ...customExtras,
    ],
  };

  const toggleMap = {
    "Sound Engineering": [showSound, setShowSound],
    "DJ Services": [showDJ, setShowDJ],
    "Extra Sets": [showExtraSets, setShowExtraSets],
    "Others": [showOther, setShowOther],
  };

  const handleExtraPriceChange = (extra, value) => {
    setExtras((prev) => ({
      ...prev,
      [extra]: {
        ...(prev[extra] || {}),
        price: Number(value),
      },
    }));
  };

  const handleComplimentaryToggle = (extra) => {
    const isNowComplimentary = !(extras[extra]?.complimentary ?? false);
  
    setExtras((prev) => ({
      ...prev,
      [extra]: {
        ...(prev[extra] || {}),
        complimentary: isNowComplimentary,
        price: isNowComplimentary ? 0 : (prev[extra]?.price || 0),
      },
    }));
  };

  const handleAddCustomExtra = () => {
    if (!newExtraName.trim() || !newExtraPrice) return;
    const key = newExtraName.trim().toLowerCase().replace(/\s+/g, "_");
    setCustomExtras((prev) => [...prev, key]);
    setExtras((prev) => ({
      ...prev,
      [key]: {
        price: Number(newExtraPrice),
        complimentary: false,
      },
    }));    toast.info(`"${newExtraName}" has been added as an extra below.`);
    setNewExtraName("");
    setNewExtraPrice("");
  };

  const allBandMembers = lineups?.flatMap((l) => l.bandMembers || []);
  const canDJ = allBandMembers?.some((m) => m.haveMixingConsoleOrDecks);
  const hasSaxophonist = allBandMembers?.some((m) => (m.instrument || "").toLowerCase().includes("sax"));
  const hasRoamingPercussion = lineups?.some((l) => l.roamingPercussion);

  const isAutoCalculatedExtraSet = (extraKey) => {
    return Object.prototype.hasOwnProperty.call(EXTRA_SET_CONFIG, extraKey);
  };

  const getAutoCalculatedSummary = (extraKey) => {
    const breakdown = autoExtraSetTotals[extraKey] || [];
    if (!breakdown.length) return "";

    return breakdown
      .map((item) => {
        const isCustom = extraKey === "custom_extra_performance_per_band_member";
        const minutesText = item.minutes
          ? isCustom
            ? ` custom ${item.minutes}mins`
            : ` extra ${item.minutes}mins`
          : isCustom
            ? " custom performance"
            : "";

        const chargedText =
          item.chargedMemberCount && item.memberCount !== item.chargedMemberCount
            ? ` (${item.chargedMemberCount} of ${item.memberCount} members charged)`
            : "";

        return `${item.lineupLabel}${minutesText} £${safeNumber(item.total)}${chargedText}`;
      })
      .join(" • ");
  };

  return (
    <div className="border rounded-md max-h-[750px] overflow-y-auto bg-white">
      <div className="sticky top-0 bg-white z-10 p-4 shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Extras Pricing</h2>

      </div>

      <div className="p-4">
        {Object.entries(groupedExtras).map(([group, extrasList]) => {
          const [isOpen, toggleFn] = toggleMap[group];
          if (group === "DJ Services") {
            const hasNonGuaranteedItems = groupedExtras["DJ Services"].some((item) =>
              !["background_music_playlist", "up_to_3_hours_manned_playlist"].includes(item)
            );
            if (!canDJ && !hasNonGuaranteedItems) return null;
          }
          return (
            <div key={group} className="mb-4">
              <button
                type="button"
                onClick={() => toggleFn((prev) => !prev)}
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <img src={assets.dropdown_icon} alt="toggle" className={`w-4 h-7 mr-2 ml-3 transform transition-transform ${isOpen ? "rotate-90" : "rotate-0"}`} />
                {group}
              </button>
              {isOpen && (
                <>
                  <table className="mt-2 w-full border-collapse border border-gray-300">
                    <thead>
                      <tr>
                        <th className="border p-2 text-left">Extra</th>
                        <th className="border p-2 text-center">£</th>
                        <th className="border p-2 text-center">Complimentary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extrasList
                        .filter((extraKey) => {
                          if (["background_music_playlist", "up_to_3_hours_manned_playlist"].includes(extraKey)) return true;
                          if (extraKey === "DJ_live_sax_3x30mins") return hasSaxophonist;
                          if (extraKey === "DJ_live_bongos_3x30mins") return hasRoamingPercussion;
                          if (extraKey === "DJ_live_bongos_and_sax_3x30mins") return hasSaxophonist && hasRoamingPercussion;
                          return true;
                        })
                        .map((extraKey) => (
                          <tr key={extraKey}>
                            <td className="border p-2 w-2/5 align-top">
                              <div>
                                {EXTRA_SET_CONFIG[extraKey]?.label || extraKey.replace(/_/g, " ")}
                              </div>
                              {isAutoCalculatedExtraSet(extraKey) && getAutoCalculatedSummary(extraKey) && (
                                <>
                                  <p className="mt-1 text-xs text-gray-500">
                                    Auto-calculated from lineup extra performance fees:
                                  </p>
                                  <p className="mt-1 text-xs text-gray-600">
                                    {getAutoCalculatedSummary(extraKey)}
                                  </p>
                                  <p className="mt-1 text-xs text-[#ff6667]">
                                    Only members with an additional performance fee entered in the lineup are included in this total. To change it, please go back to the corresponding lineup and update the band members' additional performance fees there.
                                  </p>
                                </>
                              )}
                            </td>
                            <td className="border p-2 w-1/3 align-top">
                              <input
                                type="number"
                                value={extras[extraKey]?.price === 0 ? "" : extras[extraKey]?.price ?? ""}
                                onChange={(e) => handleExtraPriceChange(extraKey, e.target.value)}
                                className="w-full px-2 py-1 border text-right"
                                disabled={extras[extraKey]?.complimentary || isAutoCalculatedExtraSet(extraKey)}
                              />
                            </td>
                            <td className="border p-2 text-center align-top">
                              <input
                                type="checkbox"
                                checked={extras[extraKey]?.complimentary || false}
                                onChange={() => handleComplimentaryToggle(extraKey)}
                              />
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>

                  {group === "DJ Services" && (
  <div className="mt-4">
    <h4 className="font-semibold mb-2">Maximum DJing Length (hours, per day)</h4>
    <div className="flex items-center gap-3">
      <input
        type="number"
        min={0}
        className="w-28 px-2 py-1 border text-right"
        value={extras?.max_dj_hours?.price ?? ""}
        onChange={(e) =>
          setExtras((prev) => ({
            ...prev,
            max_dj_hours: {
              ...(prev.max_dj_hours || {}),
              price: Number(e.target.value) || 0,
              complimentary: false,
            },
          }))
        }
        placeholder="e.g. 4"
      />
      <span className="text-sm text-gray-500">Hide “Additional DJing per 30 mins” if ≤ 3</span>
    </div>
  </div>
)}

                  {group === "Others" && (
                    <div className="flex flex-col gap-2 mt-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Other extra"
                          value={newExtraName}
                          onChange={(e) => setNewExtraName(e.target.value)}
                          className="flex-1 px-2 py-1 border rounded"
                        />
                        <input
                          type="number"
                          placeholder="£"
                          value={newExtraPrice}
                          onChange={(e) => setNewExtraPrice(e.target.value)}
                          className="w-[100px] px-2 py-1 border rounded text-right"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomExtra}
                          className="px-3 py-1 bg-black text-white rounded hover:bg-[#ff6667] hover:text-black"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExtrasPricing;
