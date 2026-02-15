const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/users.js");
const { createOtpResendLimiter } = require("../utils/rateLimit");
const { storeResendAttempts } = require("../middleware"); // "express rate limiter" stores the session for each "IP", so we are using this feature to track current user.

const emailResendLimiter = createOtpResendLimiter(() => "/verify-email");

const resetResendLimiter = createOtpResendLimiter(() => "/reset-password");

// SignUp GET and POST route
router
  .route("/signup")
  .get(userController.renderSignupForm)
  .post(wrapAsync(userController.signup));

// Login GET and POST route
router
  .route("/login")
  .get(userController.renderLoginForm)
  .post(
    saveRedirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    wrapAsync(userController.login),
  );

// Logout
router.get("/logout", userController.logout);

// EMAIL OTP VERIFICATION ROUTES
router
  .route("/verify-email")
  .get(userController.renderVerifyEmailForm)
  .post(wrapAsync(userController.verifyEmail));

// Resend OTP
router.post(
  "/resend-otp",
  emailResendLimiter,
  storeResendAttempts("resendAttemptsLeft"),
  wrapAsync(userController.resendOTP),
);

// Forgot password
router
  .route("/forgot-password")
  .get(userController.renderForgotPasswordForm)
  .post(wrapAsync(userController.sendResetOTP));

// Reset password (OTP + new password)
router
  .route("/reset-password")
  .get(userController.renderResetPasswordForm)
  .post(wrapAsync(userController.resetPassword));

// Resend reset OTP
router.post(
  "/resend-reset-otp",
  resetResendLimiter,
  storeResendAttempts("resetResendAttemptsLeft"),
  wrapAsync(userController.resendResetOTP),
);

module.exports = router;
