import React from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const TscApprovedBio = ({ tscApprovedBio, setTscApprovedBio }) => {
  return (
    <div className="w-full">
      <p className="mb-2">
        <strong>TSC Approved Bio</strong>
        <span className="text-sm text-gray-500 ml-2">(HTML supported)</span>
      </p>
      <ReactQuill
        value={tscApprovedBio}
        onChange={setTscApprovedBio}
        className="bg-white"
        placeholder="Write a professional bio with paragraphs, bold text, etc."
        modules={{
          toolbar: [
            [{ header: [1, 2, false] }],
            ["bold", "italic", "underline"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link"],
            ["clean"],
          ],
        }}
        formats={[
          "header",
          "bold",
          "italic",
          "underline",
          "list",
          "bullet",
          "link",
        ]}
      />
    </div>
  );
};

export default TscApprovedBio;