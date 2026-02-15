const crypto = require("crypto");
const Booking = require("../models/booking");

module.exports.handleRazorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.body) // raw buffer
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({ error: "Invalid Signature" });
    }

    const body = JSON.parse(req.body.toString());
    const event = body.event;

    // Payment Captured
    if (event === "payment.captured") {
      const payment = body.payload.payment.entity;

      await Booking.findOneAndUpdate(
        { razorpayPaymentId: payment.id },
        {
          paymentStatus: "paid",
          bookingStatus: "confirmed",
        },
      );
    }

    // Refund Processed
    if (event === "refund.processed") {
      const refund = body.payload.refund.entity;

      await Booking.findOneAndUpdate(
        { razorpayPaymentId: refund.payment_id },
        {
          paymentStatus: "refunded",
          bookingStatus: "cancelled",
        },
      );
    }

    return res.status(200).json({ status: "Webhook Received" });
  } catch (err) {
    console.error("Webhook Error:", err);
    return res.status(500).json({ error: "Webhook Failed" });
  }
};
