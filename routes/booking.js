const express = require("express");
const router = express.Router({ mergeParams: true });

const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../middleware");
const bookingController = require("../controllers/bookings");

//to get users booking page.
router.get(
  "/bookings",
  isLoggedIn,
  wrapAsync(bookingController.renderMyBookings)
);


// Create Booking
router.post(
  "/listings/:id/book",
  isLoggedIn,
  wrapAsync(bookingController.createBooking),
);

// Render Payment Page
router.get(
  "/bookings/:id/payment",
  isLoggedIn,
  wrapAsync(bookingController.renderPaymentPage),
);

//Send Payment OTP (when user clicks confirm)
router.post(
  "/bookings/:id/send-payment-otp",
  isLoggedIn,
  wrapAsync(bookingController.sendPaymentOTP),
);

//Render OTP verification page
router.get(
  "/bookings/:id/verify-payment",
  isLoggedIn,
  wrapAsync(bookingController.renderVerifyPaymentPage),
);

//Verify OTP and confirm payment
router.post(
  "/bookings/:id/verify-payment",
  isLoggedIn,
  wrapAsync(bookingController.verifyPaymentOTP),
);

// Confirmation page
router.get(
  "/bookings/:id/confirmation",
  isLoggedIn,
  wrapAsync(bookingController.renderConfirmationPage),
);

router.post(
  "/bookings/:id/send-cancel-otp",
  isLoggedIn,
  wrapAsync(bookingController.sendCancelOTP)
);

router.get(
  "/bookings/:id/verify-cancel",
  isLoggedIn,
  wrapAsync(bookingController.renderVerifyCancelPage)
);

router.post(
  "/bookings/:id/verify-cancel",
  isLoggedIn,
  wrapAsync(bookingController.verifyCancelOTP)
);

module.exports = router;