const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },

  //Email Verification Fields.
  isEmailVerified: {
    type: Boolean,
    default: false,
  },

  emailOTPHash: {
    type: String,
  },

  emailOTPExpires: {
    type: Date,
  },

  emailOTPAttempts: {
    type: Number,
    default: 0,
  },
});
// till here

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
