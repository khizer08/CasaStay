const rateLimit = require("express-rate-limit");

const createOtpResendLimiter = (redirectPathFn) => {
  return rateLimit({
    windowMs: 10 * 60 * 1000, // 10 Minutes
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,

    handler: (req, res) => {
      const resetTime = req.rateLimit?.resetTime;

      let minutesLeft = 10; // fallback

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
