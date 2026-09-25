import React, { useState } from "react";
import {
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaTiktok,
  FaTwitter,
  FaGlobe,
} from "react-icons/fa";

const DeputyStepThree = ({ formData = {}, setFormData = () => {} }) => {
  const {
    function_bands_performed_with = [],
    original_bands_performed_with = [],
    sessions = [],
    social_media_links = [],
    socialHighlightPostLinks = [],
  } = formData;

  const platformIcons = {
    Instagram: <FaInstagram className="text-pink-500" />,
    Facebook: <FaFacebookF className="text-blue-600" />,
    YouTube: <FaYoutube className="text-red-600" />,
    TikTok: <FaTiktok className="text-black" />,
    Twitter: <FaTwitter className="text-blue-400" />,
    Other: <FaGlobe className="text-gray-500" />,
  };

  // --- HELPERS WITH LOGGING ---
  const updateArrayItem = (arrayName, index, field, value) => {
    console.log(
      `🟦 DS3 updateArrayItem → ${arrayName}[${index}].${field} =`,
      value,
    );
    const updatedArray = [...(formData[arrayName] || [])];
    updatedArray[index] = { ...updatedArray[index], [field]: value };

    console.log("🟦 DS3 updated item:", updatedArray[index]);
    console.log("🟦 DS3 full updated array:", updatedArray);

    setFormData((prev) => {
      const newState = { ...prev, [arrayName]: updatedArray };
      console.log("🟦 DS3 new formData state:", newState);
      return newState;
    });
  };

  const addItem = (arrayName, template) => {
    console.log(`🟩 DS3 addItem → ${arrayName}`, template);
    const updatedArray = [...(formData[arrayName] || []), template];

    console.log("🟩 DS3 updated array after ADD:", updatedArray);

    setFormData((prev) => {
      const newState = { ...prev, [arrayName]: updatedArray };
      console.log("🟩 DS3 new formData state:", newState);
      return newState;
    });
  };

  const removeItem = (arrayName, index) => {
    console.log(`🟥 DS3 removeItem → ${arrayName}[${index}]`);
    const updatedArray = [...(formData[arrayName] || [])];
    updatedArray.splice(index, 1);

    console.log("🟥 DS3 updated array after REMOVE:", updatedArray);

    setFormData((prev) => {
      const newState = { ...prev, [arrayName]: updatedArray };
      console.log("🟥 DS3 new formData state:", newState);
      return newState;
    });
  };

  const [emailErrors, setEmailErrors] = useState({
    function: {},
    original: {},
    social: {},
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Function Bands */}
      <div>
        <h2 className="font-semibold mb-2">
          Function Bands You've Performed With
        </h2>

        {function_bands_performed_with.map((band, index) => (
          <div key={index} className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Band Name
              </label>
              <input
                type="text"
                value={band.function_band_name || ""}
                onChange={(e) =>
                  updateArrayItem(
                    "function_bands_performed_with",
                    index,
                    "function_band_name",
                    e.target.value,
                  )
                }
                className="p-2 border rounded w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Reference Email
              </label>
              <input
                type="email"
                value={band.function_band_leader_email || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  updateArrayItem(
                    "function_bands_performed_with",
                    index,
                    "function_band_leader_email",
                    value,
                  );

                  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                  setEmailErrors((prev) => ({
                    ...prev,
                    function: {
                      ...prev.function,
                      [index]:
                        !isValid && value.length > 3
                          ? "Please enter a valid email address."
                          : "",
                    },
                  }));
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                  setEmailErrors((prev) => ({
                    ...prev,
                    function: {
                      ...prev.function,
                      [index]:
                        !isValid && value
                          ? "Please enter a valid email address."
                          : "",
                    },
                  }));
                }}
                className={`p-2 border rounded w-full ${emailErrors.function[index] ? "border-red-500" : ""}`}
              />
              {emailErrors.function[index] && (
                <p className="text-red-500 text-sm mt-1">
                  {emailErrors.function[index]}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => removeItem("function_bands_performed_with", index)}
              className="text-red-500 text-left col-span-2"
            >
              Remove
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            addItem("function_bands_performed_with", {
              function_band_name: "",
              function_band_leader_email: "",
            })
          }
          className="mt-2 text-sm text-blue-600 underline"
        >
          + Add Band
        </button>
      </div>

      {/* Original Bands */}
      <div>
        <h2 className="font-semibold mb-2">
          Original Bands You've Performed With
        </h2>

        {original_bands_performed_with.map((band, index) => (
          <div key={index} className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Band Name
              </label>
              <input
                type="text"
                value={band.original_band_name || ""}
                onChange={(e) =>
                  updateArrayItem(
                    "original_bands_performed_with",
                    index,
                    "original_band_name",
                    e.target.value,
                  )
                }
                className="p-2 border rounded w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Reference Email
              </label>
              <input
                type="email"
                value={band.original_band_leader_email || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  updateArrayItem(
                    "original_bands_performed_with",
                    index,
                    "original_band_leader_email",
                    value,
                  );

                  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

                  setEmailErrors((prev) => ({
                    ...prev,
                    original: {
                      ...prev.original,
                      [index]:
                        !isValid && value.length > 3
                          ? "Please enter a valid email address."
                          : "",
                    },
                  }));
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

                  setEmailErrors((prev) => ({
                    ...prev,
                    original: {
                      ...prev.original,
                      [index]:
                        !isValid && value
                          ? "Please enter a valid email address."
                          : "",
                    },
                  }));
                }}
                className={`p-2 border rounded w-full ${emailErrors.original[index] ? "border-red-500" : ""}`}
              />
              {emailErrors.original[index] && (
                <p className="text-red-500 text-sm mt-1">
                  {emailErrors.original[index]}
                </p>
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
          type="button"
          onClick={() =>
            addItem("original_bands_performed_with", {
              original_band_name: "",
              original_band_leader_email: "",
            })
          }
          className="mt-2 text-sm text-blue-600 underline"
        >
          + Add Band
        </button>
      </div>

      {/* Sessions */}
      <div>
        <h2 className="font-semibold mb-2">Sessions</h2>

        {sessions.map((session, index) => (
          <div key={index} className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Artist
              </label>
              <input
                type="text"
                value={session.artist || ""}
                onChange={(e) =>
                  updateArrayItem("sessions", index, "artist", e.target.value)
                }
                className="p-2 border rounded w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Session Type
              </label>
              <input
                type="text"
                value={session.session_type || ""}
                onChange={(e) =>
                  updateArrayItem(
                    "sessions",
                    index,
                    "session_type",
                    e.target.value,
                  )
                }
                className="p-2 border rounded w-full"
              />
            </div>

            <button
              type="button"
              onClick={() => removeItem("sessions", index)}
              className="text-red-500 text-left col-span-2"
            >
              Remove
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => addItem("sessions", { artist: "", session_type: "" })}
          className="mt-2 text-sm text-blue-600 underline"
        >
          + Add Session
        </button>
      </div>

      {/* Social Media */}
      <div>
        <h2 className="font-semibold mb-2">Social Media Links</h2>

        {social_media_links.map((link, index) => (
          <div key={index} className="grid grid-cols-3 gap-4 items-center mb-3">
            <select
              value={link.platform || ""}
              onChange={(e) =>
                updateArrayItem(
                  "social_media_links",
                  index,
                  "platform",
                  e.target.value,
                )
              }
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
                value={link.url || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  updateArrayItem("social_media_links", index, "url", value);

                  const isValid =
                    /^(https?:\/\/)?([\w.-]+)+(:\d+)?(\/([\w/_-]*(\?\S+)?)?)?$/.test(
                      value,
                    );

                  setEmailErrors((prev) => ({
                    ...prev,
                    social: {
                      ...prev.social,
                      [index]:
                        !isValid && value.length > 4
                          ? "Please enter a valid URL."
                          : "",
                    },
                  }));
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  const isValid =
                    /^(https?:\/\/)?([\w.-]+)+(:\d+)?(\/([\w/_-]*(\?\S+)?)?)?$/.test(
                      value,
                    );

                  setEmailErrors((prev) => ({
                    ...prev,
                    social: {
                      ...prev.social,
                      [index]:
                        !isValid && value ? "Please enter a valid URL." : "",
                    },
                  }));
                }}
                className={`p-2 border rounded ${
                  emailErrors.social[index] ? "border-red-500" : ""
                }`}
              />

              {emailErrors.social[index] && (
                <p className="text-red-500 text-sm mt-1">
                  {emailErrors.social[index]}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="text-xl">
                {platformIcons[link.platform] || null}
              </div>

              <button
                type="button"
                onClick={() => removeItem("social_media_links", index)}
                className="text-red-500 text-sm"
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            addItem("social_media_links", { platform: "", url: "" })
          }
          className="mt-2 text-sm text-blue-600 underline"
        >
          + Add Social Link
        </button>

        <fieldset className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <legend className="px-1 text-sm font-semibold text-gray-900">
            Automatic social highlights
          </legend>
          <p className="mb-3 text-sm text-gray-600">
            Connect Instagram, TikTok or Facebook from your musician dashboard so selected or recent public performance posts can appear automatically. You will approve read-only access directly with each platform before anything is imported, and your public profile will not show your username or profile link.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
            <label className="inline-flex items-center gap-2 text-sm text-gray-800">
              <input
                type="radio"
                name="socialFeedConnectionPreference"
                value="interested"
                checked={formData.socialFeedConnectionPreference === "interested" || formData.socialFeedConnectionPreference === "connected"}
                onChange={() => setFormData((previous) => ({ ...previous, socialFeedConnectionPreference: "interested" }))}
              />
              Show me the connection options on my dashboard
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-800">
              <input
                type="radio"
                name="socialFeedConnectionPreference"
                value="not_now"
                checked={formData.socialFeedConnectionPreference === "not_now"}
                onChange={() => setFormData((previous) => ({ ...previous, socialFeedConnectionPreference: "not_now" }))}
              />
              Not right now
            </label>
          </div>
        </fieldset>

        <div className="mt-5 rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900">
            Individual highlight posts (optional)
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Add a public post or reel you would be happy for us to feature. Your
            username and profile link will not be shown on your public musician
            profile.
          </p>

          <div className="mt-4 space-y-3">
            {socialHighlightPostLinks.map((post, index) => (
              <div
                key={`social-highlight-${index}`}
                className="grid gap-3 rounded-md border border-gray-200 bg-gray-50 p-3 md:grid-cols-[1fr_180px_auto]"
              >
                <input
                  type="url"
                  placeholder="Public Instagram, TikTok or Facebook post URL"
                  value={post.url || ""}
                  onChange={(event) =>
                    updateArrayItem(
                      "socialHighlightPostLinks",
                      index,
                      "url",
                      event.target.value,
                    )
                  }
                  className="rounded border border-gray-300 bg-white p-2 text-sm"
                />
                <input
                  type="text"
                  maxLength={60}
                  placeholder="Short tag, e.g. Live vocals"
                  value={post.tag || post.title || ""}
                  onChange={(event) =>
                    updateArrayItem(
                      "socialHighlightPostLinks",
                      index,
                      "tag",
                      event.target.value,
                    )
                  }
                  className="rounded border border-gray-300 bg-white p-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeItem("socialHighlightPostLinks", index)}
                  className="text-sm text-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              addItem("socialHighlightPostLinks", {
                title: "",
                tag: "",
                url: "",
                mediaUrl: "",
                thumbnailUrl: "",
                mediaType: "unknown",
                visible: true,
              })
            }
            className="mt-3 text-sm text-blue-600 underline"
          >
            + Add a highlight post
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeputyStepThree;
