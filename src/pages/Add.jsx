import React from "react";
import AddAct2StepperForm from "../components/AddAct2StepperForm";

const Add = () => {
  const userEmail = localStorage.getItem("userEmail") || "";
  const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
  const userRole = localStorage.getItem("userRole") || "";

  console.log("🔍 Add userEmail:", userEmail);

  return (
    <div className="p-4">
      <AddAct2StepperForm token={token} userEmail={userEmail} userRole={userRole} />
    </div>
  );
};

export default Add;