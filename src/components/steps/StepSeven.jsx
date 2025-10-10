import React from "react";
import Discount from "../Discount";

const StepSeven = ({
  discountToClient,
  setDiscountToClient,
  isPercentage,
  setIsPercentage,
  reviews, 
  setReviews,
  isChanged = () => false,
}) => {
  const hasDiscountChanges = isChanged("discountToClient") || isChanged("isPercentage");

  const handleMediaUpload = async (e, index) => {
    const files = Array.from(e.target.files);
    const uploadedUrls = await Promise.all(
      files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "musicians"); // Use your actual Cloudinary preset
        // Use the generic Cloudinary upload endpoint for both images and videos
        const response = await fetch("https://api.cloudinary.com/v1_1/dvcgr3fyd/upload", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        return data.secure_url; // Return the secure URL string
      })
    );
    const updated = [...reviews];
    updated[index].eventMedia = uploadedUrls; // Store as array of strings
    setReviews(updated);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Step 7: Reviews & Complete Registration</h2>

      <div className="w-full">
        <h3 className="text-lg font-semibold">Reviews</h3>
        <p className="text-sm text-gray-600">
          Please provide reviews you've recieved from past gigs. We recommend addiing at least 10, and if you can provide the client email addresses we can verify the reviews and also ask the client if they have any addiitonal photos or footage that we can add to your profile.
        </p>
        {/* Review Input Form */}
        <div className="space-y-4 mt-4">
          {reviews.map((review, index) => (
            <div key={index} className="border p-4 rounded bg-gray-50 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Client First Name"
                  className="w-1/2 border px-3 py-2 text-sm"
                  value={review.clientFirstName}
                  onChange={(e) => {
                    const updated = [...reviews];
                    updated[index].clientFirstName = e.target.value;
                    setReviews(updated);
                  }}
                />
                <input
                  type="text"
                  placeholder="Client Last Name"
                  className="w-1/2 border px-3 py-2 text-sm"
                  value={review.clientLastName}
                  onChange={(e) => {
                    const updated = [...reviews];
                    updated[index].clientLastName = e.target.value;
                    setReviews(updated);
                  }}
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Client Email (optional)"
                  className="w-1/2 border px-3 py-2 text-sm"
                  value={review.clientEmail}
                  onChange={(e) => {
                    const updated = [...reviews];
                    updated[index].clientEmail = e.target.value;
                    setReviews(updated);
                  }}
                />
                <input
                  type="date"
                  placeholder="Event Date"
                  className="w-1/2 border px-3 py-2 text-sm"
                  value={review.eventDate || ""}
                  onChange={(e) => {
                    const updated = [...reviews];
                    updated[index].eventDate = e.target.value;
                    setReviews(updated);
                  }}
                />
              </div>
              <div className="flex gap-2">
              <div className="w-1/2">
  {review.eventType?.toLowerCase() === "other" ? (
    <input
      type="text"
      placeholder="Enter custom event type"
      className="w-full border px-3 py-2 text-sm"
      value={review.customEventType || ""}
      onChange={(e) => {
        const updated = [...reviews];
        updated[index].customEventType = e.target.value;
        setReviews(updated);
      }}
    />
  ) : (
    <select
      className="w-full border px-3 py-2 text-sm"
      value={review.eventType || ""}
      onChange={(e) => {
        const updated = [...reviews];
        updated[index].eventType = e.target.value;
        setReviews(updated);
      }}
    >
      <option value="">Select Event Type</option>
      {[
        "anniversary", "awards ceremony", "bar & batmitzvah", "birthday party", "ceremony",
        "club night", "corporate event", "drinks reception", "evening reception", "festival",
        "Isreali wedding", "memorial", "NYE celebration", "party", "product launch",
        "retirement party", "sporting event", "summer ball", "wedding", "winter staff party", "other"
      ]
        .sort((a, b) => a.localeCompare(b))
        .map((type) => (
          <option key={type} value={type}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </option>
        ))}
    </select>
  )}
</div>
<div className="w-1/2">
  {review.eventLocation?.toLowerCase() === "other" ? (
    <input
      type="text"
      placeholder="Enter custom location"
      className="w-full border px-3 py-2 text-sm"
      value={review.customEventLocation || ""}
      onChange={(e) => {
        const updated = [...reviews];
        updated[index].customEventLocation = e.target.value;
        setReviews(updated);
      }}
    />
  ) : (
    <select
      className="w-full border px-3 py-2 text-sm"
      value={review.eventLocation || ""}
      onChange={(e) => {
        const updated = [...reviews];
        updated[index].eventLocation = e.target.value;
        setReviews(updated);
      }}
    >
      <option value="">Select County</option>
      {[
        "Bedfordshire", "Berkshire", "Bristol", "Buckinghamshire", "Cambridgeshire",
        "Cheshire", "City of London", "Cornwall", "County Durham", "Cumbria",
        "Derbyshire", "Devon", "Dorset", "East Riding of Yorkshire", "East Sussex",
        "Essex", "Gloucestershire", "Greater London", "Greater Manchester", "Hampshire",
        "Herefordshire", "Hertfordshire", "Isle of Wight", "Kent", "Lancashire",
        "Leicestershire", "Lincolnshire", "Merseyside", "Norfolk", "North Yorkshire",
        "Northamptonshire", "Northumberland", "Nottinghamshire", "Oxfordshire", "Rutland",
        "Shropshire", "Somerset", "South Yorkshire", "Staffordshire", "Suffolk",
        "Surrey", "Tyne and Wear", "Warwickshire", "West Midlands", "West Sussex",
        "West Yorkshire", "Wiltshire", "Worcestershire", "Other"
      ].map((county) => (
        <option key={county} value={county}>
          {county}
        </option>
      ))}
    </select>
  )}
</div>
              </div>
              <textarea
                placeholder="Review Comment"
                className="w-full border px-3 py-2 text-sm"
                rows={4}
                value={review.comment}
                onChange={(e) => {
                  const updated = [...reviews];
                  updated[index].comment = e.target.value;
                  setReviews(updated);
                }}
              />
              {/* Event Media Dropzone */}
              <div className="w-full border border-dashed border-gray-400 px-3 py-6 text-center text-sm rounded bg-white">
                <label htmlFor={`eventMedia-${index}`} className="block cursor-pointer">
                  {review.eventMedia?.length > 0
                    ? `Uploaded ${review.eventMedia.length} file(s)`
                    : "Drag and drop media files here or click to upload"}
                  <input
                    id={`eventMedia-${index}`}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      // Use the shared upload handler for consistency
                      await handleMediaUpload(e, index);
                    }}
                  />
                </label>
              </div>
             
              <button
                type="button"
                className="text-red-500 text-sm underline"
                onClick={() => {
                  const updated = reviews.filter((_, i) => i !== index);
                  setReviews(updated);
                }}
              >
                Remove Review
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setReviews([
                ...reviews,
                {
                  clientFirstName: "",
                  clientLastName: "",
                  clientEmail: "",
                  comment: "",
                  rating: 5,
                  eventType: "",
                  customEventType: "",
                  eventLocation: "",
                  customEventLocation: "",
                  eventMedia: [],
                },
              ])
            }
            className="px-4 py-2 bg-black text-white text-sm rounded"
          >
            + Add Another Review
          </button>
        </div>
        
      </div>
      <div className={hasDiscountChanges ? "border-l-4 border-yellow-400 pl-4" : ""}>
        <Discount 
          discountToClient={discountToClient} 
          setDiscountToClient={setDiscountToClient} 
          isPercentage={isPercentage} 
          setIsPercentage={setIsPercentage} 
          
        />
      </div>

    </div>
  );
};

export default StepSeven;