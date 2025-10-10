import React, { useState } from "react";
import { getTravelData } from "./getTravelData";
import { assets } from "../assets/assets";

const TravelFeeCalculator = ({
  useCountyTravelFee,
  setUseCountyTravelFee,
  countyFees,
  setCountyFees,
  costPerMile,
  setCostPerMile,
  useMUTravelRates,
  setUseMUTravelRates,
  lineups,
}) => {
  const england = ["Bedfordshire", "Berkshire", "Buckinghamshire", "Cambridgeshire", "Cheshire", "Cornwall", "Cumbria", "Derbyshire", "Devon", "Dorset", "Durham", "East Sussex", "Essex", "Gloucestershire", "Greater London", "Greater Manchester", "Hampshire", "Herefordshire", "Hertfordshire", "Isle of Wight", "Kent", "Lancashire", "Leicestershire", "Lincolnshire", "Merseyside", "Norfolk", "North Yorkshire", "Northamptonshire", "Northumberland", "Nottinghamshire", "Oxfordshire", "Rutland", "Shropshire", "Somerset", "South Yorkshire", "Staffordshire", "Suffolk", "Surrey", "Tyne and Wear", "Warwickshire", "West Midlands", "West Sussex", "West Yorkshire", "Wiltshire", "Worcestershire"];

  const wales = ["Carmarthenshire", "Ceredigion", "Conwy", "Denbighshire", "Flintshire", "Gwynedd", "Monmouthshire", "Pembrokeshire", "Powys", "Rhondda Cynon Taf", "Swansea", "Torfaen", "Neath Port Talbot", "Bridgend", "Blaenau Gwent", "Caerphilly", "Cardiff", "Merthyr Tydfil", "Newport", "Wrexham", "West Glamorgan"];

  const scotland = ["Aberdeen City", "Aberdeenshire", "Angus", "Argyll and Bute", "Clackmannanshire", "Dumfries and Galloway", "Dundee City", "East Ayrshire", "East Dunbartonshire", "East Lothian", "East Renfrewshire", "Edinburgh", "Falkirk", "Fife", "Glasgow", "Highland", "Inverclyde", "Midlothian", "Moray", "Na h-Eileanan Siar", "North Ayrshire", "North Lanarkshire", "Orkney Islands", "Perth and Kinross", "Renfrewshire", "Scottish Borders", "Shetland Islands", "South Ayrshire", "South Lanarkshire", "Stirling", "West Dunbartonshire", "West Lothian"];

  const [selectedBandMembers, setSelectedBandMembers] = useState([]);
  const [memberTravelResults, setMemberTravelResults] = useState([]);
  const [showEngland, setShowEngland] = useState(true);
  const [showWales, setShowWales] = useState(true);
  const [showScotland, setShowScotland] = useState(true);

  const exampleDestinations = [
    { county: "Greater London", postcode: "EC1A 1BB" },
    { county: "Surrey", postcode: "GU1 1AA" },
    { county: "Manchester", postcode: "M1 1AE" },
    { county: "Bristol", postcode: "BS1 4ST" },
  ];

  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const handleCountyFeeChange = (county, value) => {
    setCountyFees((prev) => ({ ...prev, [county]: value }));
  };

  const handleExampleCalculate = async () => {
    try {
      if (!selectedBandMembers.length) {
        alert("Please select at least one band member.");
        return;
      }

      const allResults = [];

      for (const dest of exampleDestinations) {
        const row = {
          county: dest.county,
          postcode: dest.postcode,
          members: [],
        };

        for (const id of selectedBandMembers) {
          const [li, mi] = id.split("-").map(Number);          const member = lineups?.[li]?.bandMembers?.[mi];
          if (!member?.postCode) continue;

          const travelData = await getTravelData(member.postCode, dest.postcode, API_KEY);

          if (travelData) {
            const distanceMiles = travelData.distanceValue / 1609.34;
            const durationHours = travelData.durationValue / 3600;
            const returnAfterMidnightFee = 34.8;
            const longDriveLateReturnFee = durationHours > 1 ? 136 : 0;
            const extraCharges = returnAfterMidnightFee + longDriveLateReturnFee;

            const fee = useMUTravelRates
              ? (distanceMiles * 0.56 + durationHours * 13.23) * 2 + extraCharges
              : (distanceMiles * parseFloat(costPerMile || 0)) * 2 + extraCharges;

            row.members.push({
              id,
              fullName: `${member.firstName || "Member"} ${member.lastName || +mi + 1}`,
              postCode: member.postCode,
              fee: fee.toFixed(2),
            });
          }
        }

        allResults.push(row);
      }

      setMemberTravelResults(allResults);
    } catch (err) {
      console.error("Error calculating travel fees:", err);
      alert("Something went wrong calculating travel fees. Check console.");
    }
  };

  const renderCountyGroup = (title, counties, isOpen, toggleFn) => (
    <div className="mb-4">
      <button
      type="button"
        onClick={() => toggleFn((prev) => !prev)}
        className="flex items-center gap-2 text-lg font-semibold"
      >
        <img
          src={assets.dropdown_icon}
          className={`w-4 h-7 mr-2 ml-3 transform transition-transform ${isOpen ? "rotate-90" : "rotate-0"}`}
        />
        {title}
      </button>
      {isOpen && (
        <table className="mt-2 w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border p-2 w-2/3 text-left">County</th>
              <th className="border p-2 w-1/3 text-center">£ / band member</th>
            </tr>
          </thead>
          <tbody>
            {counties.map((county) => (
              <tr key={county}>
                <td className="border p-2">{county}</td>
                <td className="border p-2">
                  <input
                    type="number"
                    value={countyFees[county] || ""}
                    onChange={(e) => handleCountyFeeChange(county, e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="border rounded-md w-full bg-white max-h-[768px] overflow-y-auto">
    {/* Sticky Header */}
    <div className="sticky top-0 z-10 bg-white p-4 shadow-sm">
      <h2 className="text-xl font-semibold mb-2">Travel Fee Setup</h2>
  
      {/* Toggle Between Fee Modes */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <label>Toggle to your preferred method:</label>
        <div className="flex items-center gap-4">
          <div
            className={`toggle ${useCountyTravelFee ? "on" : "off"}`}
            onClick={() => setUseCountyTravelFee((prev) => !prev)}
            style={{
              cursor: "pointer",
              width: "50px",
              height: "30px",
              borderRadius: "15px",
              backgroundColor: "#ff6667",
              position: "relative",
            }}
          >
            <div
    style={{
      position: "absolute",
      top: "5px",
      left: useCountyTravelFee ? "25px" : "5px", 
      width: "20px",
      height: "20px",
      borderRadius: "50%",
      backgroundColor: "white",
      transition: "left 0.2s",
    }}
  ></div>
          </div>
          <span className="text-sm ">
            {useCountyTravelFee ? "Fee per County" : "Fee per Mile"}
          </span>
        </div>
      </div>
    </div>
  
    {/* Per County UI */}
    {useCountyTravelFee ? (
      <div
      className={` w-full bg-white p-4 ${
        useCountyTravelFee ? "max-h-[650px] " : ""
      }`}
    >
        {renderCountyGroup("England", england, showEngland, setShowEngland)}
        {renderCountyGroup("Wales", wales, showWales, setShowWales)}
        {renderCountyGroup("Scotland", scotland, showScotland, setShowScotland)}
      </div>
    ) : (
      // Cost Per Mile UI
      <div className="mb-6 grid grid-cols-3">
    <div className="mb-2 col-span-1 flex flex-col items-center justify-center p-4">
  <label className="block text-sm mb-1 text-center">
    Use{" "}
    <a
      href="https://musiciansunion.org.uk/working-performing/gigs-and-live-performances/live-engagement-rates-of-pay/national-gig-rates"
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline text-sm"
    >
      MU Travel Rates
    </a>
  </label>
  <input
    type="checkbox"
    className="h-5 w-5"
    checked={useMUTravelRates}
    onChange={() => setUseMUTravelRates((prev) => !prev)}
  />
</div>
<div className="mb-2 col-span-1 flex flex-col items-center justify-center">

<label className="block font-medium mb-1">OR</label>
  </div>
  
        <div className="mb-2 col-span-1 flex flex-col items-center justify-center">
          <label className="block mb-1 text-center text-sm">Add a cost per mile (£):</label>
          <input
            type="number"
            value={costPerMile}
            onChange={(e) => setCostPerMile(e.target.value)}
            className={`w-1/2 px-2 py-1 border rounded ${useMUTravelRates ? "bg-gray-200 cursor-not-allowed" : ""}`}
            disabled={useMUTravelRates}
          />
        </div>
      </div>
    )}


{!useCountyTravelFee && (
  <>
  <div className="p-4">
    <h3 className="mt-6 mb-2">
      Select team members to calculate example travel fees based on your input above:
    </h3>

    {Array.from(
      new Map(
        lineups
          ?.flatMap((lineup, li) =>
            (lineup.bandMembers || []).map((member, mi) => ({
              id: `${li}-${mi}`,
              uniqueKey: `${member.firstName || "Member"} ${member.lastName || ""} - ${member.postCode || ""}`,
              fullName: `${member.firstName || "Member"} ${member.lastName || ""}`,
              postCode: member.postCode?.trim() || "",
              li,
              mi,
            }))
          )
          .filter((m) => m.postCode)
          .map((m) => [m.uniqueKey, m])
      ).values()
    ).map(({ id, fullName, postCode }) => {
      const isChecked = selectedBandMembers.includes(id);
      return (
        <div key={id} className="flex items-center gap-2 mb-1">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() =>
              setSelectedBandMembers((prev) =>
                isChecked ? prev.filter((v) => v !== id) : [...prev, id]
              )
            }
          />
          <label>
            {fullName} – {postCode}
          </label>
        </div>
      );
    })}

    <button
      type="button"
      onClick={handleExampleCalculate}
      className="mt-4 bg-black hover:bg-[#ff6667] text-white px-4 py-2 rounded"
    >
      Calculate Travel Fees for Example Counties
    </button>

    {memberTravelResults.length > 0 && (
      <div className="mt-6 ">
        <h3 className="text-lg font-semibold mb-2">Example Travel Fees by County</h3>
        <p className="mb-2 text-sm text-gray-600 italic">
          {useMUTravelRates ? (
            <>
              Using{" "}
              <a
                href="https://musiciansunion.org.uk/working-performing/gigs-and-live-performances/live-engagement-rates-of-pay/national-gig-rates"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                MU Travel Rates
              </a>{" "}
              of £13.23 per hour of travel + 56p per mile with return time rules,
              assuming a midnight finish as standard
            </>
          ) : (
            <>Using Custom Rate: £{costPerMile || 0} per mile + lateness rules</>
          )}
        </p>

        <div className="max-h-[400px] overflow-y-auto border rounded relative  ">
          <div className="p-4">
            <h3 className="text-lg font-semibold">Example Travel Fees by County</h3>
          </div>
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-white">
              <tr>
                <th className="border p-2">County</th>
                <th className="border p-2">Destination Postcode</th>
                {selectedBandMembers.map((id, idx) => {
  const [li, mi] = id.split("-").map(Number);
  const member = lineups?.[li]?.bandMembers?.[mi];
                  return (
                    <th key={idx} className="border p-2">
                      {`${member?.firstName || "Member"}`}
                      <br />
                      <span className="text-sm text-gray-500">{member?.postCode}</span>
                    </th>
                  );
                })}
                <th className="border p-2 font-semibold">Total (£)</th>
              </tr>
            </thead>
            <tbody>
              {memberTravelResults.map((row, idx) => {
                const total = row.members.reduce(
                  (sum, m) => sum + parseFloat(m.fee),
                  0
                );
                return (
                  <tr key={idx}>
                    <td className="border p-2">{row.county}</td>
                    <td className="border p-2">{row.postcode}</td>
                    {selectedBandMembers.map((id, mi) => {
                      const member = row.members.find((m) => m.id === id);
                      return (
                        <td key={mi} className="border p-2 text-right">
                          {member ? `£${member.fee}` : "-"}
                        </td>
                      );
                    })}
                    <td className="border p-2 font-semibold text-right">£{total.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    )}
    </div>
  </>
)}
    </div>
  );
};

export default TravelFeeCalculator;