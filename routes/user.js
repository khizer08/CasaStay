const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/users.js");

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
router.post("/resend-otp", wrapAsync(userController.resendOTP));

module.exports = router;
