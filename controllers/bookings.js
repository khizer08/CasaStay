const Booking = require("../models/booking");
const Listing = require("../models/listing");
const sendEmail = require("../utils/sendEmail"); // mail sending logic.
const bookingConfirmationStyle = require("../views/emails/bookingConfirmationStyle"); // booking email styling file.
const ejs = require("ejs");
const path = require("path");

module.exports.createBooking = async (req, res) => {
  // this module is used to handle the "booking logic".
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

  // simple tax logic (18%)
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

module.exports.renderPaymentPage = async (req, res) => {
  // this module is used to handle the payment page initially rendered logic.
  let { id } = req.params;

  const booking = await Booking.findById(id)
    .populate("listing")
    .populate("user");

  if (!booking) {
    req.flash("error", "Booking not found.");
    return res.redirect("/listings");
  }

  // Only booking owner can access
  if (!booking.user._id.equals(req.user._id)) {
    req.flash("error", "Unauthorized access.");
    return res.redirect("/listings");
  }

  res.render("bookings/payment.ejs", { booking });
};

module.exports.confirmPayment = async (req, res) => {
  // this module is used to handle the confirmation of the payment.
  
  let { id } = req.params;

  const booking = await Booking.findById(id)
    .populate("listing")
    .populate("user");

  if (!booking) {
    req.flash("error", "Booking not found.");
    return res.redirect("/listings");
  }

  if (!booking.user._id.equals(req.user._id)) {
    req.flash("error", "Unauthorized.");
    return res.redirect("/listings");
  }

  if (booking.paymentStatus === "confirmed") {
    req.flash("success", "Booking already confirmed.");
    return res.redirect(`/bookings/${id}/confirmation`);
  }

  booking.paymentStatus = "confirmed";
  booking.bookingStatus = "active";

  await booking.save();

  // Render booking confirmation email
  const bookingHTML = await ejs.renderFile(
    path.join(__dirname, "../views/emails/bookingConfirmation.ejs"),
    {
      username: booking.user.username,
      listingTitle: booking.listing.title,
      checkIn: booking.checkIn.toDateString(),
      checkOut: booking.checkOut.toDateString(),
      nights: booking.nights,
      totalAmount: booking.totalAmount,
      bookingId: booking._id,
      ...bookingConfirmationStyle,
    }
  );

  // Send booking confirmation email
  await sendEmail({
    to: booking.user.email,
    subject: "Your Booking is Confirmed 🎉",
    html: bookingHTML,
  });

  req.flash("success", "Payment successful! Booking confirmed.");
  res.redirect(`/bookings/${booking._id}/confirmation`);
};

module.exports.renderConfirmationPage = async (req, res) => {
  // this module is used to display page after successfull payment
  let { id } = req.params;

  const booking = await Booking.findById(id).populate("listing");

  if (!booking) {
    req.flash("error", "Booking not found.");
    return res.redirect("/listings");
  }

  res.render("bookings/confirmation.ejs", { booking });
};
