import React from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CustomToast from "../components/CustomToast";


const SaveProgress = () => {
  return (
    <button
      type="button"
      onClick={() => {
        const dataToSave = JSON.parse(localStorage.getItem("actFormData"));
        localStorage.setItem("actFormData", JSON.stringify(dataToSave));
        toast(<CustomToast type="success" message="Saved successfully!" />);
            }}
      className="px-4 py-2 bg-black hover:bg-[#ff6667] text-white rounded transition"
    >
      Save Progress
    </button>
  );
};

export default SaveProgress;