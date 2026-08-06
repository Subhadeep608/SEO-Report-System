// Run once to bootstrap the very first Admin account:
//   npm run seed
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const loginId = (process.env.ADMIN_EMAIL || "uday@ppminfotech.com").toLowerCase();
  const existing = await User.findOne({ loginId });

  if (existing) {
    console.log(`Admin already exists with loginId: ${loginId}`);
    process.exit(0);
  }

  const admin = await User.create({
    name: process.env.ADMIN_NAME || "ppm infotech",
    loginId,
    password: process.env.ADMIN_PASSWORD || "admin@seo%ppm1234",
    role: "admin",
  });

  console.log("Admin created:");
  console.log(`  loginId: ${admin.loginId}`);
  console.log(`  password: ${process.env.ADMIN_PASSWORD || "admin@seo%ppm1234"} (change this after first login)`);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
