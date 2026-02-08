const User = require("../models/user.js");
const sendEmail = require("../utils/sendEmail");

module.exports.renderSignupForm = (req, res) => {
  // this module is used to render a form so that a user can make their account.
  res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
  // this module saves the user details in database and displays correct flash message.
  try {
    let { username, email, password } = req.body;
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);

    // SEND WELCOME EMAIL (after user is saved)
    sendEmail({
      to: registeredUser.email,
      subject: "Welcome to CasaStay 🏡 Your journey starts here!",
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
      <h2 style="color: #ff385c;">Welcome to CasaStay, ${registeredUser.username}! 🎉</h2>

      <p>
        We’re excited to have you on board. Your account has been created successfully,
        and you’re now ready to explore unique stays and unforgettable experiences.
      </p>

      <p>
        🌍 Discover new destinations<br/>
        🏡 Find stays you’ll love<br/>
        ✨ Travel with comfort and confidence
      </p>

      <p>
        If you ever need help, we’re just a click away.
      </p>

      <p style="margin-top: 30px;">
        Happy exploring!<br/>
        <strong>— Team CasaStay</strong>
      </p>

      <hr style="margin-top: 40px;" />
      <p style="font-size: 12px; color: #777;">
        You received this email because you signed up for CasaStay.
      </p>
    </div>
  `,
    });

    req.login(registeredUser, (err) => {
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
