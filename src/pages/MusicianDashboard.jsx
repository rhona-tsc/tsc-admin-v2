import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Define backendUrl or import it from a configuration file
const backendUrl = 'http://localhost:4000';
const MusicianDashboard = ({token}) => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/act-v2/my-drafts`, {
          headers: { token },
        });
        setDrafts(response.data.drafts);
      } catch (err) {
        console.error("Error fetching drafts", err);
      }
    };
    fetchDrafts();
  }, []);


  const getActStatusLabel = (act) => {
    if (act.status === "approved" && act.amendment?.isPending) {
      return "Approved (Changes Pending)";
    }
    return act.status.charAt(0).toUpperCase() + act.status.slice(1); // Capitalise
  };

  return (
    <div>
  {drafts.map(act => (
    <div key={act._id}>
      <h3>{act.name}</h3>
      <p>Status: {getActStatusLabel(act)}</p>

      {act.amendmentDraft && (
        <p className="text-yellow-500">Pending amendment awaiting moderation</p>
      )}

      <button onClick={() => navigate(`/edit/${act._id}`)}>Edit</button>
    </div>
  ))}
  </div>
)}

export default MusicianDashboard
