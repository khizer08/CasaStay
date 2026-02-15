const User = require("../models/user.js");
const sendEmail = require("../utils/sendEmail"); // mail sending logic.
const mailStyle = require("../views/emails/message/mailStyle"); // message email styling file.
const otpStyle = require("../views/emails/otp/otpStyle"); // otp email styling file.
const ejs = require("ejs");
const path = require("path");
const { hashOTP } = require("../utils/generateOTP");
const { sendOTP } = require("../utils/sendOTP");

module.exports.renderSignupForm = (req, res) => {
  // this module is used to render a form so that a user can make their account.
  res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
  // this module saves the user details in database and displays correct flash message.
  try {
    let { username, email, password } = req.body;

    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      req.flash(
        "error",
        "An Account With This Email Already Exists. Please Log In Instead.",
      );
      return req.session.save(() => {
        res.redirect("/login");
      });
    }

    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);

    registeredUser.emailOTPAttempts = 0;
    registeredUser.isEmailVerified = false;

    await sendOTP({
      target: registeredUser,
      hashField: "emailOTPHash",
      expiryField: "emailOTPExpires",
      subject: "Verify Your Email — CasaStay 🔐",
      template: "otp.ejs",
      templateData: (otp) => ({
        username: registeredUser.username,
        otp,
        otpStyle,
      }),
      recipientEmail: registeredUser.email,
    });

    req.flash(
      "success",
      "Account Created! Please Verify Your Email Using The OTP Sent To Your Email.",
    );

    return req.session.save(() => {
      res.redirect("/verify-email");
    });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/signup");
  }
};

module.exports.renderVerifyEmailForm = async (req, res) => {
  // this module is used to render a form so that a user can enter the OTP for verification.
  const user = await User.findOne({
    isEmailVerified: false,
  }).sort({ createdAt: -1 });

  if (!user) {
    req.flash("error", "No Pending Verification Found. Please Sign Up Again.");
    return res.redirect("/signup");
  }

  // Get attempts from session
  const resendAttemptsLeft =
    typeof req.session.resendAttemptsLeft !== "undefined"
      ? req.session.resendAttemptsLeft
      : null;

  res.render("users/verifyEmail.ejs", {
    otpExpiry: user.emailOTPExpires ? user.emailOTPExpires.getTime() : 0,
    resendAttemptsLeft,
  });
};

// verifying email
module.exports.verifyEmail = async (req, res, next) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      req.flash("error", "OTP Is Required");
      return res.redirect("/verify-email");
    }

    const otpHash = hashOTP(otp);

    const user = await User.findOne({
      emailOTPHash: otpHash,
      emailOTPExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash("error", "Invalid Or Expired OTP");
      return res.redirect("/verify-email");
    }

    user.isEmailVerified = true;
    user.emailOTPHash = undefined;
    user.emailOTPExpires = undefined;
    user.emailOTPAttempts = 0;

    await user.save();

    const welcomeHTML = await ejs.renderFile(
      path.join(__dirname, "../views/emails/message/welcome.ejs"),
      {
        username: user.username,
        mailStyle,
      },
    );

    await sendEmail({
      to: user.email,
      subject: "Welcome To CasaStay 🏡 Your Journey Starts Here!",
      html: welcomeHTML,
    });

    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "Welcome To CasaStay");
      req.session.save(() => {
        res.redirect("/listings");
      });
    });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/signup");
  }
};

// resend otp logic.
module.exports.resendOTP = async (req, res) => {
  try {
    const user = await User.findOne({
      isEmailVerified: false,
    }).sort({ createdAt: -1 });

    if (!user) {
      req.flash(
        "error",
        "No Pending Verification Found. Please Sign Up Again.",
      );
      return res.redirect("/signup");
    }

    if (user.emailOTPExpires && Date.now() < user.emailOTPExpires) {
      req.flash("error", "Please Wait Before Requesting A New OTP.");
      return res.redirect("/verify-email");
    }

    await sendOTP({
      target: user,
      hashField: "emailOTPHash",
      expiryField: "emailOTPExpires",
      subject: "Your New OTP — CasaStay 🔐",
      template: "otp.ejs",
      templateData: (otp) => ({
        username: user.username,
        otp,
        otpStyle,
      }),
      recipientEmail: user.email,
    });

    req.flash("success", "A new OTP Has Been Sent To Your Email.");
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

  const user = req.user;

  if (!user.isEmailVerified) {
    await sendOTP({
      target: user,
      hashField: "emailOTPHash",
      expiryField: "emailOTPExpires",
      subject: "Verify Your Email — CasaStay 🔐",
      template: "otp.ejs",
      templateData: (otp) => ({
        username: user.username,
        otp,
        otpStyle,
      }),
      recipientEmail: user.email,
    });

    req.logout(() => {});

    req.flash(
      "error",
      "Email Not Verified. A New OTP Has Been Sent To Your Email.",
    );

    return res.redirect("/verify-email");
  }

  req.flash("success", "Welcome Back To CasaStay");
  const redirectUrl = res.locals.redirectUrl || "/listings";

  req.session.save(() => {
    res.redirect(redirectUrl);
  });
};

module.exports.logout = (req, res, next) => {
  //this module is used to logout the particular user.
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "Logged Out!");
    res.redirect("/listings");
  });
};

module.exports.renderForgotPasswordForm = (req, res) => {
  //this module is used to display forgot_password form.
  res.render("users/forgotPassword.ejs");
};

module.exports.renderResetPasswordForm = async (req, res) => {
  // this module is used to display "reset password form".
  if (!req.session.resetEmail) {
    req.flash("error", "Session Expired. Please Try Again.");
    return res.redirect("/forgot-password");
  }

  const user = await User.findOne({
    email: req.session.resetEmail,
  });

  res.render("users/resetPassword.ejs", {
    otpExpiry: user.resetOTPExpires ? user.resetOTPExpires.getTime() : 0,
  });
};

module.exports.sendResetOTP = async (req, res) => {
  // after we click forgot_password to get otp to the registerd email

  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      req.flash("error", "No Account Found With This Email.");
      return res.redirect("/forgot-password");
    }

    req.session.resetEmail = user.email;

    await sendOTP({
      target: user,
      hashField: "resetOTPHash",
      expiryField: "resetOTPExpires",
      subject: "Reset Your Password — CasaStay 🔐",
      template: "otp.ejs",
      templateData: (otp) => ({
        username: user.username,
        otp,
        otpStyle,
      }),
      recipientEmail: user.email,
    });

    req.flash("success", "OTP Sent To Your Email.");
    res.redirect("/reset-password");
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/forgot-password");
  }
};

module.exports.resendResetOTP = async (req, res) => {
  const email = req.session.resetEmail;

  if (!email) {
    req.flash("error", "Session Expired. Please Try Again.");
    return res.redirect("/forgot-password");
  }

  const user = await User.findOne({ email });

  if (user.resetOTPExpires && Date.now() < user.resetOTPExpires) {
    req.flash("error", "Please Wait Before Requesting A New OTP.");
    return res.redirect("/reset-password");
  }

  await sendOTP({
    target: user,
    hashField: "resetOTPHash",
    expiryField: "resetOTPExpires",
    subject: "New OTP — CasaStay 🔐",
    template: "otp.ejs",
    templateData: (otp) => ({
      username: user.username,
      otp,
      otpStyle,
    }),
    recipientEmail: user.email,
  });

  req.flash("success", "A New OTP Has Been Sent.");
  res.redirect("/reset-password");
};

module.exports.resetPassword = async (req, res) => {
  // this module is used for password reset logic
  const { otp, password } = req.body;

  const otpHash = hashOTP(otp);

  const email = req.session.resetEmail;

  if (!email) {
    req.flash("error", "Session Expired. Please Try Again.");
    return res.redirect("/forgot-password");
  }

  const user = await User.findOne({
    email,
    resetOTPHash: otpHash,
    resetOTPExpires: { $gt: Date.now() },
  });

  if (!user) {
    req.flash("error", "Invalid Or Expired OTP.");
    return res.redirect("/reset-password");
  }

  await user.setPassword(password);

  user.resetOTPHash = undefined;
  user.resetOTPExpires = undefined;

  await user.save();

  delete req.session.resetEmail;

  req.flash("success", "Password Updated Successfully. Please Login.");
  req.session.save(() => {
    res.redirect("/login");
  });
};
