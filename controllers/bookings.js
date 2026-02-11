const ejs = require("ejs");
const path = require("path");
const crypto = require("crypto");
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const sendEmail = require("../utils/sendEmail"); // mail sending logic.
const bookingConfirmationStyle = require("../views/emails/bookingConfirmationStyle");
const paymentOTPStyle = require("../views/emails/paymentOTPStyle");
const cancelOTPStyle = require("../views/emails/cancelOTPStyle");
const cancellationConfirmationStyle = require("../views/emails/cancellationConfirmationStyle");
const refundStyle = require("../views/emails/refundStyle");
const refundProcessedStyle = require("../views/emails/refundProcessedStyle");
const { generateOTP, hashOTP } = require("../utils/generateOTP");

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

  // prevent booking past dates
  const today = new Date();
  today.setHours(0, 0, 0, 0); // normalize

  if (startDate < today) {
    req.flash("error", "You cannot book past dates.");
    return res.redirect(`/listings/${id}`);
  }
  // past date validation ends here.

  if (startDate >= endDate) {
    req.flash("error", "Check-out must be after check-in.");
    return res.redirect(`/listings/${id}`);
  }

  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing not found.");
    return res.redirect("/listings");
  }

  // prevent same user double booking.
  const userExistingBooking = await Booking.findOne({
    listing: listing._id,
    user: req.user._id,
    paymentStatus: "confirmed",
    bookingStatus: "active",
  });

  if (userExistingBooking) {
    req.flash("error", "You have already booked this listing.");
    return res.redirect(`/listings/${id}`);
  }
  // ends here same user double booking.

  // prevent date overlapping with other users.
  const overlappingBooking = await Booking.findOne({
    listing: listing._id,
    paymentStatus: "confirmed",
    checkIn: { $lt: endDate },
    checkOut: { $gt: startDate },
  });

  if (overlappingBooking) {
    req.flash(
      "error",
      "This listing is already booked for the selected dates.",
    );
    return res.redirect(`/listings/${id}`);
  }
  // ends here date overlapping with other users.

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
    paymentStatus: "pending",
    bookingStatus: "pending",
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

module.exports.sendPaymentOTP = async (req, res) => {
  // this module is used to send OTP before confirmation of booking.
  let { id } = req.params;

  const booking = await Booking.findById(id).populate("user");

  if (!booking) {
    req.flash("error", "Booking not found.");
    return res.redirect("/listings");
  }

  if (!booking.user._id.equals(req.user._id)) {
    req.flash("error", "Unauthorized.");
    return res.redirect("/bookings");
  }

  const otp = generateOTP();
  const otpHash = hashOTP(otp);

  booking.paymentOTPHash = otpHash;
  booking.paymentOTPExpires = Date.now() + 2 * 60 * 1000;

  await booking.save();

  const otpHTML = await ejs.renderFile(
    path.join(__dirname, "../views/emails/paymentOTP.ejs"),
    {
      username: booking.user.username,
      otp,
      ...paymentOTPStyle,
    },
  );

  await sendEmail({
    to: booking.user.email,
    subject: "Verify Payment OTP",
    html: otpHTML,
  });

  res.redirect(`/bookings/${id}/verify-payment`);
};

module.exports.verifyPaymentOTP = async (req, res) => {
  // this module is used to verify the OTP being sent is correct or not.
  let { id } = req.params;
  const { otp } = req.body;

  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

  const booking = await Booking.findOne({
    _id: id,
    paymentOTPHash: otpHash,
    paymentOTPExpires: { $gt: Date.now() },
  }).populate("listing user");

  if (!booking) {
    req.flash("error", "Invalid or expired OTP.");
    return res.redirect(`/bookings/${id}/verify-payment`);
  }

  booking.paymentStatus = "confirmed";
  booking.bookingStatus = "active";
  booking.paymentOTPHash = undefined;
  booking.paymentOTPExpires = undefined;

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
    },
  );

  // Send booking confirmation email
  await sendEmail({
    to: booking.user.email,
    subject: "Your Booking is Confirmed 🎉",
    html: bookingHTML,
  });

  req.flash("success", "Payment confirmed successfully.");
  res.redirect(`/bookings/${id}/confirmation`);
};

module.exports.renderConfirmationPage = async (req, res) => {
  // this module is used to display page after successfull payment.
  let { id } = req.params;

  const booking = await Booking.findById(id).populate("listing");

  if (!booking) {
    req.flash("error", "Booking not found.");
    return res.redirect("/listings");
  }

  res.render("bookings/confirmation.ejs", { booking });
};

module.exports.renderMyBookings = async (req, res) => {
  // this module is used to display all bookings of logged-in user.

  const bookings = await Booking.find({
    user: req.user._id,
    bookingStatus: "active",
    paymentStatus: "confirmed",
  })
    .populate("listing")
    .sort({ createdAt: -1 });

  res.render("bookings/myBookings.ejs", { bookings });
};

module.exports.sendCancelOTP = async (req, res) => {
  // this module is used to send OTP before confirmation of cancellation of booking.
  let { id } = req.params;

  const booking = await Booking.findById(id).populate("user");

  if (!booking) {
    req.flash("error", "Booking not found.");
    return res.redirect("/bookings");
  }

  if (!booking.user._id.equals(req.user._id)) {
    req.flash("error", "Unauthorized.");
    return res.redirect("/bookings");
  }

  const otp = generateOTP();
  const otpHash = hashOTP(otp);

  booking.cancelOTPHash = otpHash;
  booking.cancelOTPExpires = Date.now() + 5 * 60 * 1000;

  await booking.save();

  const cancelHTML = await ejs.renderFile(
    path.join(__dirname, "../views/emails/cancelOTP.ejs"),
    {
      username: booking.user.username,
      otp,
      ...cancelOTPStyle,
    },
  );

  await sendEmail({
    to: booking.user.email,
    subject: "Confirm Booking Cancellation",
    html: cancelHTML,
  });

  res.redirect(`/bookings/${id}/verify-cancel`);
};

module.exports.verifyCancelOTP = async (req, res) => {
  let { id } = req.params;
  const { otp } = req.body;

  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

  const booking = await Booking.findOne({
    _id: id,
    cancelOTPHash: otpHash,
    cancelOTPExpires: { $gt: Date.now() },
  }).populate("user listing");

  if (!booking) {
    req.flash("error", "Invalid or expired OTP.");
    return res.redirect("/bookings");
  }

  booking.bookingStatus = "cancelled";
  booking.paymentStatus = "cancelled";
  booking.cancelOTPHash = undefined;
  booking.cancelOTPExpires = undefined;

  await booking.save();

  // Send cancellation confirmation mail
  const cancelConfirmHTML = await ejs.renderFile(
    path.join(__dirname, "../views/emails/cancellationConfirmation.ejs"),
    {
      username: booking.user.username,
      listingTitle: booking.listing.title,
      checkIn: booking.checkIn.toDateString(),
      checkOut: booking.checkOut.toDateString(),
      totalAmount: booking.totalAmount,
      ...cancellationConfirmationStyle,
    },
  );

  await sendEmail({
    to: booking.user.email,
    subject: "Your Booking Has Been Cancelled",
    html: cancelConfirmHTML,
  });

  // refund processed email
  const refundHTML = await ejs.renderFile(
    path.join(__dirname, "../views/emails/refundProcessed.ejs"),
    {
      username: booking.user.username,
      listingTitle: booking.listing.title,
      totalAmount: booking.totalAmount,
      ...refundProcessedStyle,
    },
  );

  setTimeout(async () => {
    await sendEmail({
      to: booking.user.email,
      subject: "Your Refund Has Been Processed",
      html: refundHTML,
    });
  }, 10000);

  req.flash("success", "Booking cancelled successfully.");
  res.redirect("/bookings");
};
