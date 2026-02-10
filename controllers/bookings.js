const Booking = require("../models/booking");
const Listing = require("../models/listing");

module.exports.createBooking = async (req, res) => {
  let { id } = req.params; // listing id
  let { checkIn, checkOut } = req.body;

  if (!checkIn || !checkOut) {
    req.flash("error", "Please select valid dates.");
    return res.redirect(`/listings/${id}`);
  }

  const startDate = new Date(checkIn);
  const endDate = new Date(checkOut);

  if (startDate >= endDate) {
    req.flash("error", "Check-out must be after check-in.");
    return res.redirect(`/listings/${id}`);
  }

  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing not found.");
    return res.redirect("/listings");
  }

  // calculate nights
  const diffTime = endDate - startDate;
  const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const pricePerNight = listing.price;
  const subtotal = nights * pricePerNight;

  // simple tax logic (10%)
  const taxes = Math.round(subtotal * 0.18);
  const totalAmount = subtotal + taxes;

  const newBooking = new Booking({
    user: req.user._id,
    listing: listing._id,
    checkIn: startDate,
    checkOut: endDate,
    nights,
    pricePerNight,
    taxes,
    totalAmount,
  });

  await newBooking.save();

  // redirect to dummy payment page
  res.redirect(`/bookings/${newBooking._id}/payment`);
};
