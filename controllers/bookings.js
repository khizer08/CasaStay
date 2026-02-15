const ejs = require("ejs");
const path = require("path");
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const sendEmail = require("../utils/sendEmail"); // mail sending logic.
const mailStyle = require("../views/emails/message/mailStyle"); // message email styling file.
const otpStyle = require("../views/emails/otp/otpStyle"); // otp email styling file.
const { hashOTP } = require("../utils/generateOTP");
const { sendOTP } = require("../utils/sendOTP");
const razorpay = require("../razorpayConfig");
const crypto = require("crypto");

module.exports.createBooking = async (req, res) => {
  // this module is used to handle the "booking logic".
  let { id } = req.params; // listing id
  let { checkIn, checkOut } = req.body;

  if (!checkIn || !checkOut) {
    req.flash("error", "Please Select Valid Dates.");
    return res.redirect(`/listings/${id}`);
  }

  const startDate = new Date(checkIn);
  const endDate = new Date(checkOut);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (startDate < today) {
    req.flash("error", "You Cannot Book Past Dates.");
    return res.redirect(`/listings/${id}`);
  }

  if (startDate >= endDate) {
    req.flash("error", "Check-Out Must Be After Check-In.");
    return res.redirect(`/listings/${id}`);
  }

  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing Not Found.");
    return res.redirect("/listings");
  }

  const userExistingBooking = await Booking.findOne({
    listing: listing._id,
    user: req.user._id,
    paymentStatus: "paid",
    bookingStatus: "confirmed",
  });

  if (userExistingBooking) {
    req.flash("error", "You Have Already Booked This Listing.");
    return res.redirect(`/listings/${id}`);
  }

  const overlappingBooking = await Booking.findOne({
    listing: listing._id,
    paymentStatus: "paid",
    bookingStatus: "confirmed",
    checkIn: { $lt: endDate },
    checkOut: { $gt: startDate },
  });

  if (overlappingBooking) {
    req.flash(
      "error",
      "This Listing Is Already Booked For The Selected Dates.",
    );
    return res.redirect(`/listings/${id}`);
  }

  const diffTime = endDate - startDate;
  const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const pricePerNight = listing.price;
  const subtotal = nights * pricePerNight;
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

  res.redirect(`/bookings/${newBooking._id}/payment`);
};

module.exports.renderPaymentPage = async (req, res) => {
  // this module is used to handle the payment page initially rendered logic.
  const { id } = req.params;

  const booking = await Booking.findById(id)
    .populate("listing")
    .populate("user");

  if (!booking) {
    req.flash("error", "Booking Not Found.");
    return res.redirect("/listings");
  }

  if (!booking.user._id.equals(req.user._id)) {
    req.flash("error", "Unauthorized Access.");
    return res.redirect("/listings");
  }

  if (booking.paymentStatus === "paid") {
    req.flash("success", "Payment Already Completed.");
    return res.redirect(`/bookings/${id}/confirmation`);
  }

  // Create Razorpay Order
  const options = {
    amount: booking.totalAmount * 100, // paise
    currency: "INR",
    receipt: `receipt_${booking._id}`,
  };

  const order = await razorpay.orders.create(options);

  booking.razorpayOrderId = order.id;
  await booking.save();

  res.render("bookings/payment.ejs", {
    booking,
    razorpayKey: process.env.RAZORPAY_KEY_ID,
    orderId: order.id,
  });
};

module.exports.verifyRazorpayPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    bookingId,
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false });
  }

  // 🔥 Only Save Payment Details — DO NOT Confirm Here
  await Booking.findByIdAndUpdate(bookingId, {
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  });

  return res.json({ success: true });
};

module.exports.renderConfirmationPage = async (req, res) => {
  const { id } = req.params;

  const booking = await Booking.findById(id).populate("listing");

  if (!booking || !booking.listing) {
    req.flash("error", "Booking Not Found.");
    return res.redirect("/listings");
  }

  if (!booking.user.equals(req.user._id)) {
    req.flash("error", "Unauthorized Access.");
    return res.redirect("/listings");
  }

  res.render("bookings/confirmation", { booking });
};

module.exports.renderMyBookings = async (req, res) => {
  // this module is used to display all bookings of logged-in user.

  const bookings = await Booking.find({
    user: req.user._id,
    bookingStatus: "confirmed",
    paymentStatus: "paid",
  })
    .populate("listing")
    .sort({ createdAt: -1 });

  res.render("bookings/myBookings.ejs", { bookings });
};

module.exports.cancelBooking = async (req, res) => {
  // this module is used to initiate cancellation flow.
  let { id } = req.params;

  const booking = await Booking.findById(id);

  if (!booking) {
    req.flash("error", "Booking Not Found.");
    return res.redirect("/bookings");
  }

  if (!booking.user.equals(req.user._id)) {
    req.flash("error", "Unauthorized.");
    return res.redirect("/bookings");
  }

  res.redirect(`/bookings/${id}/send-cancel-otp`);
};

module.exports.renderVerifyCancelPage = async (req, res) => {
  // this module is used to render OTP verification page before cancellation.
  let { id } = req.params;

  const booking = await Booking.findById(id);

  if (!booking) {
    req.flash("error", "Booking Not Found.");
    return res.redirect("/bookings");
  }

  if (!booking.user.equals(req.user._id)) {
    req.flash("error", "Unauthorized Access.");
    return res.redirect("/bookings");
  }

  const cancelResendAttemptsLeft =
    typeof req.session.cancelResendAttemptsLeft !== "undefined"
      ? req.session.cancelResendAttemptsLeft
      : null;

  res.render("bookings/verifyCancel.ejs", {
    booking,
    otpExpiry: booking.cancelOTPExpires
      ? booking.cancelOTPExpires.getTime()
      : 0,
    cancelResendAttemptsLeft: 3 - booking.cancelOTPAttempts,
  });
};

module.exports.sendCancelOTP = async (req, res) => {
  let { id } = req.params;

  const booking = await Booking.findById(id).populate("user");

  if (!booking) {
    req.flash("error", "Booking Not Found.");
    return res.redirect("/bookings");
  }

  if (!booking.user._id.equals(req.user._id)) {
    req.flash("error", "Unauthorized Access.");
    return res.redirect("/bookings");
  }

  const MAX_ATTEMPTS = 3;
  const WINDOW_TIME = 10 * 60 * 1000;

  if (
    booking.cancelOTPLastSentAt &&
    Date.now() - booking.cancelOTPLastSentAt > WINDOW_TIME
  ) {
    booking.cancelOTPAttempts = 0;
  }

  if (booking.cancelOTPAttempts >= MAX_ATTEMPTS) {
    const timeLeft = WINDOW_TIME - (Date.now() - booking.cancelOTPLastSentAt);

    const minutesLeft = Math.ceil(timeLeft / 60000);

    req.flash(
      "error",
      `Resend OTP Limit Reached. Please Try After ${minutesLeft} Minute(s).`,
    );

    return res.redirect(`/bookings/${id}/verify-cancel`);
  }

  await sendOTP({
    target: booking,
    hashField: "cancelOTPHash",
    expiryField: "cancelOTPExpires",
    subject: "Confirm Booking Cancellation",
    template: "cancelOTP.ejs",
    templateData: (otp) => ({
      username: booking.user.username,
      otp,
      otpStyle,
    }),
    recipientEmail: booking.user.email,
  });

  booking.cancelOTPAttempts += 1;
  booking.cancelOTPLastSentAt = Date.now();
  await booking.save();

  res.redirect(`/bookings/${id}/verify-cancel`);
};

module.exports.verifyCancelOTP = async (req, res) => {
  const { id } = req.params;
  const { otp } = req.body;

  const otpHash = hashOTP(otp);

  const booking = await Booking.findOne({
    _id: id,
    cancelOTPHash: otpHash,
    cancelOTPExpires: { $gt: Date.now() },
  }).populate("user listing");

  if (!booking) {
    req.flash("error", "Invalid Or Expired OTP.");
    return res.redirect("/bookings");
  }

  if (booking.paymentStatus !== "paid") {
    req.flash("error", "Booking Is Not Eligible For Refund.");
    return res.redirect("/bookings");
  }

  try {
    // Clear OTP
    booking.cancelOTPHash = undefined;
    booking.cancelOTPExpires = undefined;
    booking.cancelOTPAttempts = 0;
    await booking.save();

    // Send Cancellation Email Immediately
    const cancelConfirmHTML = await ejs.renderFile(
      path.join(
        __dirname,
        "../views/emails/message/cancellationConfirmation.ejs",
      ),
      {
        username: booking.user.username,
        listingTitle: booking.listing.title,
        checkIn: booking.checkIn.toDateString(),
        checkOut: booking.checkOut.toDateString(),
        totalAmount: booking.totalAmount,
        mailStyle,
      },
    );

    await sendEmail({
      to: booking.user.email,
      subject: "Your Booking Has Been Cancelled",
      html: cancelConfirmHTML,
    });

    // 🔥 Only Initiate Refund (Do NOT Update Status)
    await razorpay.payments.refund(booking.razorpayPaymentId, {
      amount: booking.totalAmount * 100,
    });

    req.flash("success", "Refund Initiated Successfully.");

    req.session.save(() => {
      res.redirect("/bookings");
    });
  } catch (err) {
    console.error("Refund Initiation Error:", err);
    req.flash("error", "Refund Failed. Please Contact Support.");
    res.redirect("/bookings");
  }
};
