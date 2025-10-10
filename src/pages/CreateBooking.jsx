import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import CustomToast from "../components/CustomToast";

const CreateTestBooking = ({ token }) => {
  const [acts, setActs] = useState([]);
  const [selectedActId, setSelectedActId] = useState("");
  const [lineups, setLineups] = useState([]);
  const [selectedLineupIndex, setSelectedLineupIndex] = useState(0);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventPostcode, setEventPostcode] = useState("");
  const [baseFee, setBaseFee] = useState("");
  const [travelFee, setTravelFee] = useState("");

  useEffect(() => {
    const fetchActs = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/act/list`);
        if (res.data.success) {
          setActs(res.data.acts);
        }
      } catch (err) {
        console.error(err);
        toast(<CustomToast type="error" message="Failed to fetch acts" />);
      }
    };
    fetchActs();
  }, []);

  useEffect(() => {
    const act = acts.find((a) => a._id === selectedActId);
    if (act) {
      setLineups(act.lineups || []);
    }
  }, [selectedActId]);

  const handleSubmit = async () => {
    try {
      const payload = {
        actId: selectedActId,
        lineupIndex: selectedLineupIndex,
        client: {
          name: clientName,
          email: clientEmail,
        },
        eventDate,
        eventPostcode,
        baseFee,
        travelFee,
      };

      const res = await axios.post(`${backendUrl}/api/booking/manual-create`, payload, {
        headers: { token },
      });

      if (res.data.success) {
        toast(<CustomToast type="success" message="Booking created successfully!" />);
      } else {
        toast(<CustomToast type="error" message={res.data.message} />);
      }
    } catch (err) {
      console.error(err);
      toast(<CustomToast type="error" message="Error creating booking" />);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Create Test Booking</h2>

      <label>Act</label>
      <select
        className="w-full border p-2 rounded mb-4"
        value={selectedActId}
        onChange={(e) => setSelectedActId(e.target.value)}
      >
        <option value="">Select an act</option>
        {acts.map((act) => (
          <option key={act._id} value={act._id}>
            {act.name}
          </option>
        ))}
      </select>

      {lineups.length > 0 && (
        <>
          <label>Lineup</label>
          <select
            className="w-full border p-2 rounded mb-4"
            value={selectedLineupIndex}
            onChange={(e) => setSelectedLineupIndex(Number(e.target.value))}
          >
            {lineups.map((lineup, index) => (
              <option key={index} value={index}>
                {lineup.actSize} - {lineup.spaceRequirements || "No info"}
              </option>
            ))}
          </select>
        </>
      )}

      <label>Client Name</label>
      <input
        type="text"
        className="w-full border p-2 rounded mb-4"
        value={clientName}
        onChange={(e) => setClientName(e.target.value)}
      />

      <label>Client Email</label>
      <input
        type="email"
        className="w-full border p-2 rounded mb-4"
        value={clientEmail}
        onChange={(e) => setClientEmail(e.target.value)}
      />

      <label>Event Date</label>
      <input
        type="date"
        className="w-full border p-2 rounded mb-4"
        value={eventDate}
        onChange={(e) => setEventDate(e.target.value)}
      />

      <label>Venue Postcode</label>
      <input
        type="text"
        className="w-full border p-2 rounded mb-4"
        value={eventPostcode}
        onChange={(e) => setEventPostcode(e.target.value)}
      />

      <label>Base Fee</label>
      <input
        type="number"
        className="w-full border p-2 rounded mb-4"
        value={baseFee}
        onChange={(e) => setBaseFee(e.target.value)}
      />

      <label>Travel Fee</label>
      <input
        type="number"
        className="w-full border p-2 rounded mb-6"
        value={travelFee}
        onChange={(e) => setTravelFee(e.target.value)}
      />

      <button onClick={handleSubmit} className="bg-green-600 text-white px-4 py-2 rounded">
        Create Booking
      </button>
    </div>
  );
};

export default CreateTestBooking;
