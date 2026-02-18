if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const multerErrorHandler = require("./utils/multerErrorHandler"); // image upload (create+edit) validation.

const listingRouter = require("./routes/listing.js"); // requiring the whole "listings" related routes.
const reviewRouter = require("./routes/review.js"); // requiring the whole "reviews" related routes.
const userRouter = require("./routes/user.js"); // requiring the whole "users" related routes.
const bookingRouter = require("./routes/booking.js"); // requiring the whole "booking" related routes.
const webhookRouter = require("./routes/webhook"); // requiring the whole "webhook" related routes.

const port = 8080;
const app = express();

app.set("trust proxy", 1); //  Required For Render (Rate Limiter Behind Proxy).

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(
  //razorpay webhook
  "/webhook/razorpay",
  express.raw({ type: "application/json" }),
  webhookRouter,
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

const dbUrl = process.env.ATLASDB_URL; // connection string from atlas which is stored in .env

// const dbUrl = "mongodb://127.0.0.1:27017/casastay";// while working on local machine.

main()
  .then(() => {
    console.log("Connection Successful");
  })
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect(dbUrl);
}

const store = new MongoStore({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.log("Error In Mongo Session URL", err);
});

const sessionOptions = {
  // mentioning different session "options".
  store, // mongo "store" variable information passed to session
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true, // for security purpose
  },
};

app.use(session(sessionOptions)); // once we use this middleware ,for all routes a session default cookie will be sent to client .
app.use(flash()); // flash has to be used before the routes which requires the functionality of "flash".

app.use(passport.initialize()); // middleware which initializes "passport".
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.engine("ejs", ejsMate);

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

//Home Page
// app.get("/", (req, res) => {
//   res.render("listings/home.ejs");
// });

// Root redirect
app.get("/", (req, res) => {
  res.redirect("/listings");
});

app.use("/listings", listingRouter); // using the "listingRouter" route, any route which is found in the "listings" module will default start with "/listings".
app.use("/listings/:id/reviews", reviewRouter); // using the "reviewRouter" route, any route which is found in the "reviews" module will default start with "/reviews".
app.use("/", userRouter); // using the "users" route, any route which is found in the "users" module will default start with "/".
app.use("/bookings", bookingRouter); // using the "bookingRouter" route, any route which is found in the "bookings" module will default start with "/".

app.use(multerErrorHandler); // image upload (create+edit) validation.

//for any route that doesnt exist.
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

//error handling middleware.
app.use((err, req, res, next) => {
  let { status = 500, message = "Something Went Wrong" } = err;
  res.status(status).render("error.ejs", { err });
});

app.listen(port, () => {
  console.log("Server Running At Port", port);
});
