const rateLimit = require("express-rate-limit");
const MongoStore = require("rate-limit-mongo");

const createOtpResendLimiter = (redirectPathFn, limiterName) => {
  return rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 3,

    store: new MongoStore({
      uri: process.env.ATLASDB_URL,
      collectionName: "rateLimitResendOTP",
      expireTimeMs: 10 * 60 * 1000,
    }),

    keyGenerator: (req) => {
      // Use user ID if logged in, otherwise fallback to IP
      return req.user
        ? `${limiterName}_${req.user._id}`
        : `${limiterName}_${req.ip}`;
    },

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
