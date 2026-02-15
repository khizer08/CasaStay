const express = require("express");
const router = express.Router({ mergeParams: true });

const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../middleware");

const bookingController = require("../controllers/bookings");

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

// after razor payment verification is done here.
router.post(
  "/verify-payment",
  isLoggedIn,
  wrapAsync(bookingController.verifyRazorpayPayment),
);

// Confirmation page
router.get(
  "/:id/confirmation",
  isLoggedIn,
  wrapAsync(bookingController.renderConfirmationPage),
);

// Cancel OTP
router.post(
  "/:id/send-cancel-otp",
  isLoggedIn,
  wrapAsync(bookingController.sendCancelOTP),
);

router
  .route("/:id/verify-cancel")
  .get(isLoggedIn, wrapAsync(bookingController.renderVerifyCancelPage))
  .post(isLoggedIn, wrapAsync(bookingController.verifyCancelOTP));

module.exports = router;
