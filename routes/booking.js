const express = require("express");
const router = express.Router({ mergeParams: true });

const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../middleware");
const bookingController = require("../controllers/bookings");

// Create Booking
router.post(
    "/listings/:id/book",
    isLoggedIn,
    wrapAsync(bookingController.createBooking)
);

module.exports = router;