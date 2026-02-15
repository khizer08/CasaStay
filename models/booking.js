const mongoose = require("mongoose");
const Schema = mongoose.Schema; // just so that we need to write "mongoose.Schema" often.

const bookingSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    listing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },

    checkIn: {
      type: Date,
      required: true,
    },

    checkOut: {
      type: Date,
      required: true,
    },

    nights: {
      type: Number,
      required: true,
      min: 1,
    },

    pricePerNight: {
      type: Number,
      required: true,
    },

    taxes: {
      type: Number,
      required: true,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },

    bookingStatus: {
      type: String,
      enum: ["pending", "active", "cancelled"],
      default: "pending",
    },

    // otp based
    cancelOTPHash: {
      type: String,
    },

    cancelOTPExpires: {
      type: Date,
    },

    cancelOTPAttempts: {
      type: Number,
      default: 0,
    },
    cancelOTPLastSentAt: {
      type: Date,
    },
    //ends here
  },
  { timestamps: true },
);

module.exports = mongoose.model("Booking", bookingSchema);
