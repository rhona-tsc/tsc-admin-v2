import React from "react";
import { FaInstagram, FaFacebookF, FaYoutube, FaTiktok, FaTwitter, FaGlobe } from "react-icons/fa";
import { useState } from "react";


const DeputyStepThree = ({ formData = {}, setFormData = () => {} }) => {
  const {
    function_bands_performed_with = [],
    original_bands_performed_with = [],
    sessions = [],
    social_media_links = []
  } = formData;

  const platformIcons = {
    Instagram: <FaInstagram className="text-pink-500" />,
    Facebook: <FaFacebookF className="text-blue-600" />,
    YouTube: <FaYoutube className="text-red-600" />,
    TikTok: <FaTiktok className="text-black" />,
    Twitter: <FaTwitter className="text-blue-400" />,
    Other: <FaGlobe className="text-gray-500" />,
  };

  const updateArrayItem = (arrayName, index, field, value) => {
    const updatedArray = [...(formData[arrayName] || [])];
    updatedArray[index] = { ...updatedArray[index], [field]: value };
    setFormData({ [arrayName]: updatedArray });
  };

  const addItem = (arrayName, template) => {
    const updatedArray = [...(formData[arrayName] || []), template];
    setFormData({ [arrayName]: updatedArray });
  };

  const removeItem = (arrayName, index) => {
    const updatedArray = [...(formData[arrayName] || [])];
    updatedArray.splice(index, 1);
    setFormData({ [arrayName]: updatedArray });
  };

  const [emailErrors, setEmailErrors] = useState({
    function: {},
    original: {},
    social: {}
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Function Bands */}
      <div>
        <h2 className="font-semibold mb-2">Function Bands You've Performed With</h2>
        {function_bands_performed_with.map((band, index) => (
          <div key={index} className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Band Name</label>
              <input
                type="text"
                value={band.function_band_name || ""}
                onChange={(e) => updateArrayItem("function_bands_performed_with", index, "function_band_name", e.target.value)}
                className="p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Reference Email</label>
              <input
                type="email"
                value={band.function_band_leader_email || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  updateArrayItem("function_bands_performed_with", index, "function_band_leader_email", value);

                  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                  setEmailErrors(prev => ({
                    ...prev,
                    function: {
                      ...prev.function,
                      [index]: !isValid && value.length > 3 ? "Please enter a valid email address." : ""
                    }
                  }));
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                  setEmailErrors(prev => ({
                    ...prev,
                    function: {
                      ...prev.function,
                      [index]: !isValid && value ? "Please enter a valid email address." : ""
                    }
                  }));
                }}
                className={`p-2 border rounded w-full ${emailErrors.function[index] ? "border-red-500" : ""}`}
              />
              {emailErrors.function[index] && (
                <p className="text-red-500 text-sm mt-1">{emailErrors.function[index]}</p>
              )}
            </div>
            <button
              onClick={() => removeItem("function_bands_performed_with", index)}
              className="text-red-500 text-left col-span-2"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={() => addItem("function_bands_performed_with", { function_band_name: "", function_band_leader_email: "" })}
          className="mt-2 text-sm text-blue-600 underline"
        >
          + Add Band
        </button>
      </div>

      {/* Original Bands */}
      <div>
        <h2 className="font-semibold mb-2">Original Bands You've Performed With</h2>
        {original_bands_performed_with.map((band, index) => (
          <div key={index} className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Band Name</label>
              <input
                type="text"
                value={band.original_band_name || ""}
                onChange={(e) => updateArrayItem("original_bands_performed_with", index, "original_band_name", e.target.value)}
                className="p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Reference Email</label>
              <input
                type="email"
                value={band.original_band_leader_email || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  updateArrayItem("original_bands_performed_with", index, "original_band_leader_email", value);

                  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                  setEmailErrors(prev => ({
                    ...prev,
                    original: {
                      ...prev.original,
                      [index]: !isValid && value.length > 3 ? "Please enter a valid email address." : ""
                    }
                  }));
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                  setEmailErrors(prev => ({
                    ...prev,
                    original: {
                      ...prev.original,
                      [index]: !isValid && value ? "Please enter a valid email address." : ""
                    }
                  }));
                }}
                className={`p-2 border rounded w-full ${emailErrors.original[index] ? "border-red-500" : ""}`}
              />
              {emailErrors.original[index] && (
                <p className="text-red-500 text-sm mt-1">{emailErrors.original[index]}</p>
              )}
            </div>
            <button
              onClick={() => removeItem("original_bands_performed_with", index)}
              className="text-red-500 text-left col-span-2"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={() => addItem("original_bands_performed_with", { original_band_name: "", original_band_leader_email: "" })}
          className="mt-2 text-sm text-blue-600 underline"
        >
          + Add Band
        </button>
      </div>

      {/* Big Name Sessions */}
      <div>
        <h2 className="font-semibold mb-2">Sessions</h2>
        {sessions.map((session, index) => (
          <div key={index} className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Artist</label>
              <input
                type="text"
                value={session.artist || ""}
                onChange={(e) => updateArrayItem("sessions", index, "artist", e.target.value)}
                className="p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Session Type</label>
              <input
                type="text"
                value={session.session_type || ""}
                onChange={(e) => updateArrayItem("sessions", index, "session_type", e.target.value)}
                className="p-2 border rounded w-full"
              />
            </div>
            <button
              onClick={() => removeItem("sessions", index)}
              className="text-red-500 text-left col-span-2"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={() => addItem("sessions", { artist: "", session_type: "" })}
          className="mt-2 text-sm text-blue-600 underline"
        >
          + Add Session
        </button>
      </div>

      {/* Social Media Links */}
      <div>
        <h2 className="font-semibold mb-2">Social Media Links</h2>
        {social_media_links.map((link, index) => (
          <div key={index} className="grid grid-cols-3 gap-4 items-center mb-3">
            <select
              value={link.platform || ""}
              onChange={(e) => updateArrayItem("social_media_links", index, "platform", e.target.value)}
              className="p-2 border rounded"
            >
              <option value="">Select Platform</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
              <option value="YouTube">YouTube</option>
              <option value="TikTok">TikTok</option>
              <option value="Twitter">Twitter</option>
              <option value="Other">Other</option>
            </select>
            <div className="flex flex-col">
              <input
                type="text"
                placeholder="https://..."
                value={link.link || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  updateArrayItem("social_media_links", index, "link", value);

                  const isValid = /^(https?:\/\/)?([\w.-]+)+(:\d+)?(\/([\w/_-]*(\?\S+)?)?)?$/.test(value);
                  setEmailErrors(prev => ({
                    ...prev,
                    social: {
                      ...prev.social,
                      [index]: !isValid && value.length > 4 ? "Please enter a valid URL." : ""
                    }
                  }));
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  const isValid = /^(https?:\/\/)?([\w.-]+)+(:\d+)?(\/([\w/_-]*(\?\S+)?)?)?$/.test(value);
                  setEmailErrors(prev => ({
                    ...prev,
                    social: {
                      ...prev.social,
                      [index]: !isValid && value ? "Please enter a valid URL." : ""
                    }
                  }));
                }}
                className={`p-2 border rounded ${emailErrors.social[index] ? "border-red-500" : ""}`}
              />
              {emailErrors.social[index] && (
                <p className="text-red-500 text-sm mt-1">{emailErrors.social[index]}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xl">{platformIcons[link.platform] || null}</div>
              <button
                onClick={() => removeItem("social_media_links", index)}
                className="text-red-500 text-sm"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={() => addItem("social_media_links", { platform: "", link: "" })}
          className="mt-2 text-sm text-blue-600 underline"
        >
          + Add Social Link
        </button>
      </div>
    </div>
  );
};

export default DeputyStepThree;