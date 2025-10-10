// pages/EditActModeration.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AddAct2StepperForm from "../components/AddAct2StepperForm";
import axios from "axios";
import { backendUrl } from "../App";

const EditActModeration = () => {
  const { id } = useParams();
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    const fetchAct = async () => {
      const res = await axios.get(`${backendUrl}/api/musician/acts/get/${id}`);
      setInitialData(res.data);
    };
    fetchAct();
  }, [id]);

  return (
    <div className="p-6">
      {initialData ? (
        <AddAct2StepperForm initialData={initialData} mode="edit" userRole="agent" />
      ) : (
        <p>Loading act data...</p>
      )}
    </div>
  );
};

export default EditActModeration;