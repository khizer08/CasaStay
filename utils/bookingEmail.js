const ejs = require("ejs");
const path = require("path");
const sendEmail = require("./sendEmail");
const bookingConfirmationStyle = require("../views/emails/bookingConfirmationStyle");

const sendBookingConfirmationEmail = async (booking) => {
  try {
    const templatePath = path.join(
      __dirname,
      "../views/emails/bookingConfirmation.ejs",
    );

    const html = await ejs.renderFile(templatePath, {
      username: booking.user.username,
      listingTitle: booking.listing.title,
      checkIn: booking.checkIn.toDateString(),
      checkOut: booking.checkOut.toDateString(),
      nights: booking.nights,
      totalAmount: booking.totalAmount,
      bookingId: booking._id,
      ...bookingConfirmationStyle,
    });

    await sendEmail({
      to: booking.user.email,
      subject: "Your Booking is Confirmed 🎉",
      html,
    });
  } catch (err) {
    console.error("Booking confirmation email failed:", err.message);
  }
};

module.exports = sendBookingConfirmationEmail;
