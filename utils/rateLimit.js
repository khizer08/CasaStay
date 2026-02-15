const rateLimit = require("express-rate-limit");

const otpResendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 Minutes
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    const remainingMs = req.rateLimit.resetTime - Date.now();
    const minutesLeft = Math.ceil(remainingMs / 60000);

    req.flash(
      "error",
      `Resend OTP Limit Reached. Please Try After ${minutesLeft} Minute(s).`,
    );

    return res.redirect("/verify-email");
  },
});

module.exports = { otpResendLimiter };
