import mongoose from "mongoose";
import dotenv from "dotenv";
import Act from "../../backend/models/actModel.js";
import Musician from "../../backend/models/musicianModel.js";

dotenv.config({ path: "./.env" });

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is not defined. Check your .env file.");
  process.exit(1);
}

mongoose.set("debug", true);

await mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 30000, // wait 30s before failing
});

const convertBandMemberToMusician = (member) => {
  if (!member?.email) return null;

  return {
    role: "musician",
    firstName: member.firstName || "",
    lastName: member.lastName || "",
    phone: member.phoneNumber || "",
    email: member.email,
    address: {
      postcode: member.postCode || "",
    },
    instrumentation: member.instrument ? [{ instrument: member.instrument }] : [],
    canDJ: member.canDJ || false,
    wireless: member.wireless || false,
    additionalEquipment: {
      mic_stands: member.additionalEquipment?.mic_stands || "",
      di_boxes: member.additionalEquipment?.di_boxes || "",
      wireless_guitar_jacks: member.additionalEquipment?.wireless_guitar_jacks || "",
    },
    bank_account: {
      sort_code: member.sortCode || "",
      account_number: member.accountNumber || "",
      account_name: member.accountName || "",
    },
  };
};

const runMigration = async () => {
  const acts = await Act.find({});
  let created = 0, skipped = 0;

  for (const act of acts) {
    for (const lineup of act.lineups || []) {
      for (const member of lineup.bandMembers || []) {
        const musicianData = convertBandMemberToMusician(member);
        if (!musicianData) continue;

        const existing = await Musician.findOne({ email: musicianData.email });
        if (existing) {
          skipped++;
          continue;
        }

        await Musician.create(musicianData);
        created++;
      }
    }

    for (const member of act.northernTeam || []) {
      const musicianData = convertBandMemberToMusician(member);
      if (!musicianData) continue;

      const existing = await Musician.findOne({ email: musicianData.email });
      if (existing) {
        skipped++;
        continue;
      }

      await Musician.create(musicianData);
      created++;
    }
  }

  console.log(`✅ Migration complete. Created: ${created}, Skipped: ${skipped}`);
  mongoose.disconnect();
};

runMigration().catch((err) => {
  console.error("❌ Migration failed:", err);
  mongoose.disconnect();
});