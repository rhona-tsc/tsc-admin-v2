import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AddAct2StepperForm from "./AddAct2StepperForm";
import { backendUrl } from "../App";
import { toast } from "react-toastify";

const EditAct2StepperForm = ({ token, userRole, isModeration = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAct = async () => {
      setLoading(true);
      try {
        console.log("🟢 Edit wrapper: fetching v2", id);
        const v2 = await axios.get(`${backendUrl}/api/musician/act-v2/${id}`);
        const act = v2?.data?.act || v2?.data;
        if (act?._id) {
          console.log("✅ v2 fetched:", { id: act._id, name: act.name });
          setInitialData(act);
          return;
        }
      } catch (e) {
        console.warn("⚠️ v2 failed, falling back:", e?.response?.data || e?.message);
      }

      try {
        console.log("🟠 Edit wrapper: fetching legacy", id);
        const legacy = await axios.get(`${backendUrl}/api/musician/acts/get/${id}`);
        if (legacy?.data?.success && legacy.data?.act?._id) {
          console.log("✅ legacy fetched:", { id: legacy.data.act._id, name: legacy.data.act.name });
          setInitialData(legacy.data.act);
          return;
        }
      } catch (e) {
        console.error("❌ legacy failed:", e?.response?.data || e?.message);
      }

      toast.error("Act not found");
      navigate("/list");
    };

    fetchAct().finally(() => setLoading(false));
  }, [id, token, navigate]);

  if (loading) return <p>Loading...</p>;
  if (!initialData) return null;

  console.log("🎯 Wrapper rendering form with:", {
    isModeration,
    id,
    hasInitial: Boolean(initialData?._id),
  });

  return (
    <AddAct2StepperForm
      token={token}
      userRole={userRole}
      userEmail={userEmail}
      initialData={initialData}
      mode="edit"
      id={id}
      isModeration={isModeration}
    />
  );
};

export default EditAct2StepperForm;