// utils/bookingNotifications.js
import musicianModel from "../models/musicianModel.js";
import sendWhatsAppMessage from "../utils/twilioClient.js";
import sendEmail from "../utils/sendEmail.js"; // Assume nodemailer setup

const BookingNotifications = async (booking, act, lineup) => {
  try {
    const messagesSent = [];
    const emailsSent = [];

    for (const member of lineup.band_members) {
      const musician = await musicianModel.findById(member.musicianId);
      if (!musician) continue;

      // WhatsApp message (simplified)
      const whatsappMsg = `Hey ${musician.firstName},\nYou're booked for a gig with ${act.name} on ${new Date(
        booking.date
      ).toDateString()} at ${booking.venue.name}. Please confirm availability.`;

      await sendWhatsAppMessage(musician.phone, whatsappMsg);
      messagesSent.push(musician.phone);

      // Email (optional)
      const emailMsg = `Hi ${musician.firstName},\n\nYou're booked for a gig with ${act.name} on ${new Date(
        booking.date
      ).toDateString()} at ${booking.venue.name}.\n\nThanks!`;

      await sendEmail({
        to: musician.email,
        subject: `Booking Confirmation for ${act.name}`,
        text: emailMsg,
      });

      emailsSent.push(musician.email);
    }

    return { messagesSent, emailsSent };
  } catch (error) {
    console.error("Notification Error:", error);
    return { messagesSent: [], emailsSent: [], error };
  }
};

export default BookingNotifications;
