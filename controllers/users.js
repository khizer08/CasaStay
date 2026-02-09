const User = require("../models/user.js");
const sendEmail = require("../utils/sendEmail"); // mail sending logic.
const welcomeStyle = require("../views/emails/welcomeStyle"); // welcome email styling file.
const otpStyle = require("../views/emails/otpStyle"); // otp email styling file.
const ejs = require("ejs");
const path = require("path");
const crypto = require("crypto");
const { generateOTP, hashOTP } = require("../utils/generateOTP"); //OTP utilities

module.exports.renderSignupForm = (req, res) => {
  // this module is used to render a form so that a user can make their account.
  res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
  // this module saves the user details in database and displays correct flash message.
  try {
    let { username, email, password } = req.body;

    // create user
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);

    // Generate OTP logic.
    const otp = generateOTP();
    const otpHash = hashOTP(otp);

    registeredUser.emailOTPHash = otpHash;
    registeredUser.emailOTPExpires = Date.now() + 10 * 60 * 1000; // 10 min
    registeredUser.emailOTPAttempts = 0;
    registeredUser.isEmailVerified = false;

    await registeredUser.save();
    // otp generation logic ends here.

    //  Render OTP email
    const otpEmailHTML = await ejs.renderFile(
      path.join(__dirname, "../views/emails/otp.ejs"),
      {
        username: registeredUser.username,
        otp,
        otpStyle,
      },
    );

    //  Send OTP email
    await sendEmail({
      to: registeredUser.email,
      subject: "Verify your email — CasaStay 🔐",
      html: otpEmailHTML,
    });

    //  DO NOT auto-login yet
    req.flash(
      "success",
      "Account created! Please verify your email using the OTP sent to your email.",
    );

    res.redirect("/verify-email");
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/signup");
  }
};

module.exports.renderVerifyEmailForm = (req, res) => {
  // this module is used to render a form so that a user can enter the OTP for verification.
  res.render("users/verifyEmail.ejs");
};

// verifying email
module.exports.verifyEmail = async (req, res, next) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      req.flash("error", "OTP is required");
      return res.redirect("/verify-email");
    }

    // Hash incoming OTP
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // Find valid user
    const user = await User.findOne({
      emailOTPHash: otpHash,
      emailOTPExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash("error", "Invalid or expired OTP");
      return res.redirect("/verify-email");
    }

    // Mark email verified
    user.isEmailVerified = true;
    user.emailOTPHash = undefined;
    user.emailOTPExpires = undefined;
    user.emailOTPAttempts = 0;

    await user.save();

    //Send Welcome Email AFTER otp verification
    const welcomeHTML = await ejs.renderFile(
      path.join(__dirname, "../views/emails/welcome.ejs"),
      {
        username: user.username,
        welcomeStyle,
      },
    );

    await sendEmail({
      to: user.email,
      subject: "Welcome to CasaStay 🏡 Your journey starts here!",
      html: welcomeHTML,
    });

    // Login AFTER verification
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "Welcome to Wanderlust");
      res.redirect("/listings");
    });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/signup");
  }
};

module.exports.renderLoginForm = (req, res) => {
  // this module is used to render a login form so that a user can login.
  res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
  // this module decides after login what actions to be taken.
  req.flash("success", "Welcome back to Wanderlust");
  let redirectUrl = res.locals.redirectUrl || "/listings";
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
  //this module is used to logout the particular user.
  req.logout((err) => {
    //"req.logout" method is used to logged out the user in the session.
    if (err) {
      return next(err);
    }
    req.flash("success", "logged out!");
    res.redirect("/listings");
  });
};
