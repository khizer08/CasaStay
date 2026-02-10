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

    // CHECK IF EMAIL ALREADY EXISTS
    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      req.flash(
        "error",
        "An account with this email already exists. Please log in instead.",
      );
      return res.redirect("/login");
    }
    // check logic ends here.

    // create user
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);

    // Generate OTP logic.
    const otp = generateOTP();
    const otpHash = hashOTP(otp);

    registeredUser.emailOTPHash = otpHash;
    registeredUser.emailOTPExpires = Date.now() + 1 * 60 * 1000; // 1 min
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

// resend otp logic.
module.exports.resendOTP = async (req, res) => {
  try {
    // Find the latest unverified user
    const user = await User.findOne({
      isEmailVerified: false,
    }).sort({ createdAt: -1 });

    if (!user) {
      req.flash(
        "error",
        "No pending verification found. Please sign up again.",
      );
      return res.redirect("/signup");
    }

    // OPTIONAL: Enforce resend cooldown (1 min)
    if (
      user.emailOTPExpires &&
      Date.now() < user.emailOTPExpires - 9 * 60 * 1000
    ) {
      req.flash("error", "Please wait before resending OTP.");
      return res.redirect("/verify-email");
    }

    // Generate NEW OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);

    user.emailOTPHash = otpHash;
    user.emailOTPExpires = Date.now() + 10 * 60 * 1000; // 10 mins validity
    user.emailOTPAttempts = 0;

    await user.save();

    // Send OTP email
    const otpEmailHTML = await ejs.renderFile(
      path.join(__dirname, "../views/emails/otp.ejs"),
      {
        username: user.username,
        otp,
        otpStyle: require("../views/emails/otpStyle"),
      },
    );

    await sendEmail({
      to: user.email,
      subject: "Your new OTP — CasaStay 🔐",
      html: otpEmailHTML,
    });

    req.flash("success", "A new OTP has been sent to your email.");
    res.redirect("/verify-email");
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/verify-email");
  }
};
// logic for resend otp ends.

module.exports.renderLoginForm = (req, res) => {
  // this module is used to render a login form so that a user can login.
  res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
  // this module decides after login what actions to be taken.

  const user = req.user; // Passport sets this

  //  BLOCK login if email not verified
  if (!user.isEmailVerified) {
    // Generate fresh OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);

    user.emailOTPHash = otpHash;
    user.emailOTPExpires = Date.now() + 1 * 60 * 1000; // 1 min
    user.emailOTPAttempts = 0;
    await user.save();

    // Send OTP email
    const otpEmailHTML = await ejs.renderFile(
      path.join(__dirname, "../views/emails/otp.ejs"),
      {
        username: user.username,
        otp,
        otpStyle: require("../views/emails/otpStyle"),
      },
    );

    await sendEmail({
      to: user.email,
      subject: "Verify your email — CasaStay 🔐",
      html: otpEmailHTML,
    });

    // Kill session immediately
    req.logout(() => {});

    req.flash(
      "error",
      "Email not verified. A new OTP has been sent to your email.",
    );

    return res.redirect("/verify-email");
  }

  // verified user - normal login
  req.flash("success", "Welcome back to Wanderlust");
  const redirectUrl = res.locals.redirectUrl || "/listings";
  // FORCE session save before redirect
  req.session.save(() => {
    res.redirect(redirectUrl);
  });
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
