import React, { useState } from "react";
import DeputyForm from "../components/DeputyForm";

const RegisterAsDeputy = (props ) => {
  return (
    <div className="w-full px-6 py-6">
      <h1 className="text-xl font-bold mb-4">Register as a Deputy</h1>
      <DeputyForm {...props} />
    </div>
  );
};

export default RegisterAsDeputy;