if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: "../.env" });
}

const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const Booking = require("../models/booking.js");
const initData = require("./data.js");
const { getCoordinates } = require("../utils/geocode.js");

const dbUrl = process.env.ATLASDB_URL;

async function connectDB() {
  await mongoose.connect(dbUrl);
  console.log("DB Connection Successful");
}

// SAFETY CHECK
async function seedDB() {
  if (process.env.NODE_ENV === "production") {
    console.log("Seeding PRODUCTION Database");
  }

  // wipe data , which was in db.
  await Listing.deleteMany({});
  await User.deleteMany({});
  await Booking.deleteMany({});

  // create admin user(this is default user).
  const admin = new User({
    username: "khizer",
    email: "khizer@CasaStay.com",
    isEmailVerified: true,
  });

  await User.register(admin, "khizer123");

  // insert listings
  for (let obj of initData.data) {
    const coords = await getCoordinates(obj.location, obj.country);
    if (!coords) continue;

    obj.owner = admin._id;
    obj.lat = coords.lat;
    obj.lng = coords.lng;

    await Listing.create(obj);
  }

  console.log("Database Seeded Successfully");
}

connectDB()
  .then(seedDB)
  .then(() => mongoose.connection.close())
  .catch((err) => {
    console.error(err);
    mongoose.connection.close();
  });
