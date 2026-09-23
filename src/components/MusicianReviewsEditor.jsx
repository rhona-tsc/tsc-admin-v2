import PropTypes from "prop-types";

const blankReview = () => ({
  clientFirstName: "",
  clientLastName: "",
  clientEmail: "",
  eventDate: "",
  eventType: "",
  eventLocation: "",
  rating: "",
  comment: "",
  eventMedia: [],
  source: "musician",
  verified: false,
});

const MusicianReviewsEditor = ({ reviews = [], setReviews }) => {
  const updateReview = (index, field, value) => {
    setReviews((current) =>
      (Array.isArray(current) ? current : []).map((review, reviewIndex) =>
        reviewIndex === index ? { ...review, [field]: value } : review,
      ),
    );
  };

  return (
    <section className="mt-8 border-t pt-6">
      <h3 className="text-lg font-semibold">Reviews and testimonials</h3>
      <p className="mt-1 text-sm text-gray-500">
        Add genuine feedback from previous performances. Reviews recorded by
        TSC against a booking are linked automatically and cannot be edited
        here.
      </p>

      <div className="mt-4 space-y-4">
        {reviews.map((review, index) => {
          const linkedToBooking = review?.source === "booking";
          return (
            <div key={review?._id || review?.reviewId || index} className="rounded border bg-gray-50 p-4">
              {linkedToBooking && (
                <div className="mb-3 text-xs font-semibold text-green-700">
                  Verified booking feedback
                </div>
              )}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input className="rounded border px-3 py-2" placeholder="Client first name" value={review?.clientFirstName || ""} disabled={linkedToBooking} onChange={(e) => updateReview(index, "clientFirstName", e.target.value)} />
                <input className="rounded border px-3 py-2" placeholder="Client last name" value={review?.clientLastName || ""} disabled={linkedToBooking} onChange={(e) => updateReview(index, "clientLastName", e.target.value)} />
                <input className="rounded border px-3 py-2" type="email" placeholder="Client email (kept private)" value={review?.clientEmail || ""} disabled={linkedToBooking} onChange={(e) => updateReview(index, "clientEmail", e.target.value)} />
                <input className="rounded border px-3 py-2" type="date" value={review?.eventDate ? String(review.eventDate).slice(0, 10) : ""} disabled={linkedToBooking} onChange={(e) => updateReview(index, "eventDate", e.target.value)} />
                <input className="rounded border px-3 py-2" placeholder="Event type" value={review?.eventType || ""} disabled={linkedToBooking} onChange={(e) => updateReview(index, "eventType", e.target.value)} />
                <input className="rounded border px-3 py-2" placeholder="Event location" value={review?.eventLocation || ""} disabled={linkedToBooking} onChange={(e) => updateReview(index, "eventLocation", e.target.value)} />
                <select className="rounded border px-3 py-2" value={review?.rating || ""} disabled={linkedToBooking} onChange={(e) => updateReview(index, "rating", e.target.value ? Number(e.target.value) : "")}>
                  <option value="">No star rating supplied</option>
                  {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} star{rating === 1 ? "" : "s"}</option>)}
                </select>
              </div>
              <textarea className="mt-3 w-full rounded border px-3 py-2" rows={4} placeholder="Review or testimonial" value={review?.comment || ""} disabled={linkedToBooking} onChange={(e) => updateReview(index, "comment", e.target.value)} />
              {!linkedToBooking && (
                <button type="button" className="mt-2 text-sm text-red-600 underline" onClick={() => setReviews((current) => current.filter((_, reviewIndex) => reviewIndex !== index))}>
                  Remove review
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button type="button" className="mt-4 rounded bg-black px-4 py-2 text-sm text-white" onClick={() => setReviews((current) => [...(Array.isArray(current) ? current : []), blankReview()])}>
        + Add review or testimonial
      </button>
    </section>
  );
};

MusicianReviewsEditor.propTypes = {
  reviews: PropTypes.arrayOf(PropTypes.object),
  setReviews: PropTypes.func.isRequired,
};

export default MusicianReviewsEditor;
