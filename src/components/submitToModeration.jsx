const submitToModeration = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/moderation/submit-pending-songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songs: selectedSongs,
          userId: "moderator", // Optional field
        }),
      });
  
      if (response.ok) {
        alert("🎉 Songs submitted for moderation");
      } else {
        const data = await response.json();
        alert("❌ Failed to submit: " + data.error);
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("❌ Error submitting songs");
    }
  };

  export default submitToModeration