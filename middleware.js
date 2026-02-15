const Listing = require("./models/listing");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js"); // schema validation by "joi" is being imported.

//listing schema server side validation
module.exports.validateListing = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    // "isAuthenticated" is the method which is used to check weather user exists or not.
    req.session.redirectUrl = req.originalUrl; // here "redirectUrl" is a variable and "originalUrl" is a value of "req" object.
    req.flash("error", "You Must Be Logged In!");
    return res.redirect("/login");
  }
  next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl; //"locals" variable will not be erased by the "passport" so we are storing it in "locals".
  }
  next();
};

module.exports.isOwner = async (req, res, next) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);
  if (!listing.owner.equals(res.locals.currUser._id)) {
    req.flash("error", "You Are Not The Owner Of This Listing");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
  let { id, reviewId } = req.params;
  let review = await Review.findById(reviewId);
  if (!review.author.equals(res.locals.currUser._id)) {
    req.flash("error", "You Are Not The Author Of This Review");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

//review schema server side validation
module.exports.validateReview = (req, res, next) => {
  let { error } = reviewSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};


// for storing the attempts for current IP
module.exports.storeResendAttempts = (req, res, next) => {
  if (req.rateLimit) {
    req.session.resendAttemptsLeft = req.rateLimit.remaining;
  }
  next();
};