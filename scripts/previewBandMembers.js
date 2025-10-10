import mongoose from "mongoose";
import dotenv from "dotenv";
import actModel from "../../backend/models/actModel.js"; // adjust if path is different

dotenv.config();

const runPreview = async () => {
  try {
await mongoose.connect(process.env.MONGO_URI);

    const acts = await actModel.find({});
    console.log(`✅ Found ${acts.length} acts`);

    const seenEmails = new Set();
    const musicians = [];

    acts.forEach((act) => {
      act.lineups.forEach((lineup) => {
        lineup.bandMembers.forEach((member) => {
          if (member.email && !seenEmails.has(member.email)) {
            seenEmails.add(member.email);
            musicians.push({
              firstName: member.firstName,
              lastName: member.lastName,
              email: member.email,
              instrument: member.instrument,
              postCode: member.postCode,
              fromAct: act.name,
            });
          }
        });
      });
    });

    console.table(musicians.slice(0, 10));
    console.log(`🎸 Unique musicians collected: ${musicians.length}`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
};

runPreview();