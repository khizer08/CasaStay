const express = require("express");
const router = express.Router({ mergeParams: true });

const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, storeResendAttempts } = require("../middleware"); //"storeResendAttempts" is used because "express rate limiter" stores the session for each "IP", so we are using this feature to track current user.

const { createOtpResendLimiter } = require("../utils/rateLimit");

const bookingController = require("../controllers/bookings");

const paymentResendLimiter = createOtpResendLimiter();
const cancelResendLimiter = createOtpResendLimiter();


//to get users booking page.
router.get("/", isLoggedIn, wrapAsync(bookingController.renderMyBookings));

// Create Booking
router.post(
  "/listings/:id/book",
  isLoggedIn,
  wrapAsync(bookingController.createBooking),
);

// Render Payment Page
router.get(
  "/:id/payment",
  isLoggedIn,
  wrapAsync(bookingController.renderPaymentPage),
);

//Send Payment OTP (when user clicks confirm)
router.post(
  "/:id/send-payment-otp",
  isLoggedIn,
  paymentResendLimiter,
  storeResendAttempts("paymentResendAttemptsLeft"),
  wrapAsync(bookingController.sendPaymentOTP),
);

//Render OTP verification page(get)
//Verify OTP and confirm payment(post)
router
  .route("/:id/verify-payment")
  .get(isLoggedIn, wrapAsync(bookingController.renderVerifyPaymentPage))
  .post(isLoggedIn, wrapAsync(bookingController.verifyPaymentOTP));

// Confirmation page
router.get(
  "/:id/confirmation",
  isLoggedIn,
  wrapAsync(bookingController.renderConfirmationPage),
);

router.post(
  "/:id/send-cancel-otp",
  isLoggedIn,
  cancelResendLimiter,
  storeResendAttempts("cancelResendAttemptsLeft"),
  wrapAsync(bookingController.sendCancelOTP),
);

router
  .route("/:id/verify-cancel")
  .get(isLoggedIn, wrapAsync(bookingController.renderVerifyCancelPage))
  .post(isLoggedIn, wrapAsync(bookingController.verifyCancelOTP));

module.exports = router;
