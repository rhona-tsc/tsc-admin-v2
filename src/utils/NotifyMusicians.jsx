// utils/notifyMusicians.js
import axios from 'axios';
import twilio from 'twilio';
import nodemailer from 'nodemailer';
import musicianModel from '../models/musicianModel.js';
import actModel from '../models/actModel.js';

const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const notifyMusicians = async ({ actId, eventDetails, lineups, customNotes }) => {
  const act = await actModel.findById(actId).lean();
  if (!act) throw new Error("Act not found");

  const allMembers = lineups.flatMap(l => l.members);
  const uniqueMusicianIds = [...new Set(allMembers.map(m => m.musicianId))];

  const musicians = await musicianModel.find({ _id: { $in: uniqueMusicianIds } });

  for (const member of musicians) {
    const whatsappBody = `🎵 Booking Confirmation 🎵\n\nAct: ${act.name}\nDate: ${eventDetails.date}\nVenue: ${eventDetails.venue}\nFee: £${member.fee || 'TBC'} + travel\n${customNotes || ''}`;

    // Send WhatsApp
    if (member.phone) {
      try {
        await twilioClient.messages.create({
          from: `whatsapp:${process.env.TWILIO_WA_SENDER}`,
          to: `whatsapp:${member.phone}`,
          body: whatsappBody,
        });
      } catch (err) {
        console.error("Twilio error for", member.phone, err);
      }
    }

    // Send Email
    if (member.email) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: member.email,
          subject: `Confirmed Booking: ${act.name} at ${eventDetails.venue}`,
          text: whatsappBody,
        });
      } catch (err) {
        console.error("Email error for", member.email, err);
      }
    }
  }
};
