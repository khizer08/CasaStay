const rateLimit = require("express-rate-limit");
const MongoStore = require("rate-limit-mongo");
require("dotenv").config();

const createOtpResendLimiter = (redirectPathFn) => {
  return rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 3,

    store: new MongoStore({
      uri: process.env.ATLASDB_URL,
      collectionName: "rateLimitResendOTP",
    }),

    standardHeaders: true,
    legacyHeaders: false,

    handler: (req, res) => {
      const resetTime = req.rateLimit?.resetTime;
      let minutesLeft = 10;

      if (resetTime) {
        const remainingMs = resetTime - Date.now();
        minutesLeft = Math.ceil(remainingMs / 60000);
      }

      req.flash(
        "error",
        `Resend OTP Limit Reached. Please Try After ${minutesLeft} Minute(s).`,
      );

      return res.redirect(redirectPathFn(req));
    },
  });
};

module.exports = { createOtpResendLimiter };
