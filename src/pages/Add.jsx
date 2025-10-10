import React from 'react';
import AddAct2StepperForm from '../components/AddAct2StepperForm';

const Add = () => {
  console.log("🔍 Add userEmail:", userEmail);

  const userEmail = localStorage.getItem("userEmail") || "";
  const token = localStorage.getItem("token") || "";
  const userRole = localStorage.getItem("userRole") || "";

  return (
    <div className="p-4">
      <AddAct2StepperForm userEmail={userEmail} token={token} userRole={userRole} />
    </div>
  );
};

export default Add;