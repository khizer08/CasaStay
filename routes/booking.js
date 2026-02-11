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

// route to delete the booked listings
router.delete(
  "/bookings/:id",
  isLoggedIn,
  wrapAsync(bookingController.cancelBooking)
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

// Confirm Payment
router.post(
  "/bookings/:id/confirm",
  isLoggedIn,
  wrapAsync(bookingController.confirmPayment),
);

router.get(
  "/bookings/:id/confirmation",
  isLoggedIn,
  wrapAsync(bookingController.renderConfirmationPage),
);


router.delete(
  "/bookings/:id",
  isLoggedIn,
  wrapAsync(bookingController.cancelBooking)
);

module.exports = router;
