const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const Booking = require("../models/booking.js");
const { getCoordinates } = require("../utils/geocode");

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/casastay");
  console.log("DB Connection Successful");
}

const initDB = async () => {
  await Listing.deleteMany({});
  await User.deleteMany({});
  await Booking.deleteMany({});

  // create default user
  const admin = new User({
    username: "khizer",
    email: "khizer@CasaStay.com",
    isEmailVerified: true,
  });

  await User.register(admin, "khizer123");

  // seed listings
  for (let obj of initData.data) {
    const coords = await getCoordinates(obj.location, obj.country);
    if (!coords) continue;

    obj.owner = admin._id;
    obj.lat = coords.lat;
    obj.lng = coords.lng;

    await Listing.create(obj);
  }

  console.log("Data Was Initialized");
};

main().then(initDB).catch(console.log);
