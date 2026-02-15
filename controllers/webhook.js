const crypto = require("crypto");
const ejs = require("ejs");
const path = require("path");
const Booking = require("../models/booking");
const sendEmail = require("../utils/sendEmail");
const mailStyle = require("../views/emails/message/mailStyle");

module.exports.handleRazorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    // 🔒 Verify Signature Using Raw Buffer
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.body) // raw buffer (important)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({ error: "Invalid Signature" });
    }

    // Parse Body Safely
    const body = JSON.parse(req.body.toString());
    const event = body.event;

    /* ======================================================
       PAYMENT CAPTURED
    ====================================================== */
    if (event === "payment.captured") {
      const payment = body.payload.payment.entity;

      const booking = await Booking.findOne({
        razorpayOrderId: payment.order_id,
      }).populate("user listing");

      if (booking && booking.paymentStatus !== "paid") {
        booking.paymentStatus = "paid";
        booking.bookingStatus = "confirmed";
        booking.razorpayPaymentId = payment.id;
        booking.razorpaySignature = signature;

        await booking.save();

        // 📧 Send Booking Confirmation Email
        const bookingHTML = await ejs.renderFile(
          path.join(
            __dirname,
            "../views/emails/message/bookingConfirmation.ejs",
          ),
          {
            username: booking.user.username,
            listingTitle: booking.listing.title,
            checkIn: booking.checkIn.toDateString(),
            checkOut: booking.checkOut.toDateString(),
            nights: booking.nights,
            totalAmount: booking.totalAmount,
            bookingId: booking._id,
            mailStyle,
          },
        );

        await sendEmail({
          to: booking.user.email,
          subject: "Your Booking Has Been Confirmed",
          html: bookingHTML,
        });
      }
    }

    /* ======================================================
       REFUND PROCESSED
    ====================================================== */
    if (event === "refund.processed") {
      const refund = body.payload.refund.entity;

      const booking = await Booking.findOne({
        razorpayPaymentId: refund.payment_id,
      }).populate("user listing");

      if (booking && booking.paymentStatus !== "refunded") {
        booking.paymentStatus = "refunded";
        booking.bookingStatus = "cancelled";

        await booking.save();

        // 📧 Send Refund Confirmation Email
        const refundHTML = await ejs.renderFile(
          path.join(__dirname, "../views/emails/message/refundProcessed.ejs"),
          {
            username: booking.user.username,
            listingTitle: booking.listing.title,
            totalAmount: booking.totalAmount,
            refundId: refund.id,
            refundStatus: refund.status,
            mailStyle,
          },
        );

        await sendEmail({
          to: booking.user.email,
          subject: "Your Refund Has Been Successfully Processed",
          html: refundHTML,
        });
      }
    }

    return res.status(200).json({ status: "Webhook Received" });
  } catch (err) {
    console.error("Webhook Error:", err);
    return res.status(500).json({ error: "Webhook Failed" });
  }
};
