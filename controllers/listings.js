const Listing = require("../models/listing");
const { getCoordinates } = require("../utils/geocode");
const Booking = require("../models/booking");

module.exports.index = async (req, res) => {
  const { search, category } = req.query;

  let filter = {};

  // Location Or Country Search
  if (search && search.trim() !== "") {
    const searchRegex = { $regex: search.trim(), $options: "i" };

    filter.$or = [{ location: searchRegex }, { country: searchRegex }];
  }

  // Category Filter
  if (category && category.trim() !== "") {
    filter.category = category.trim();
  }

  const allListings = await Listing.find(filter);

  // If Search Or Category Applied And No Results
  if ((search || category) && allListings.length === 0) {
    req.flash("error", "No Listings Found For Your Search.");
    return res.redirect("/listings");
  }

  res.render("listings/index.ejs", {
    allListings,
    search,
    category,
  });
};

module.exports.renderNewForm = (req, res) => {
  // this module is used to render a form to create new listing.
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  // this module is used to list the particular listing details in brief.
  let { id } = req.params;

  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Your Listing Was Deleted!");
    return res.redirect("/listings");
  }

  // check if listing has any active confirmed booking
  const activeBooking = await Booking.findOne({
    listing: listing._id,
    paymentStatus: "paid",
    bookingStatus: "confirmed",
  });

  // check if current logged-in user already booked this listing
  let userBooking = null;

  if (req.user) {
    userBooking = await Booking.findOne({
      listing: listing._id,
      user: req.user._id,
      paymentStatus: "paid",
      bookingStatus: "confirmed",
    });
  }
  // current logged-in user already booked logic ends here

  res.render("listings/show.ejs", {
    listing,
    activeBooking,
    userBooking,
  });
};

module.exports.createListing = async (req, res) => {
  // this module is used to list the particular listing details in breif.
  let url = req.file.path;
  let filename = req.file.filename;

  const newListing = new Listing(req.body.listing); // understand "req.body.listing" [hint:- new.ejs form]

  // map part
  const coords = await getCoordinates(
    req.body.listing.location,
    req.body.listing.country,
  );

  if (!coords) {
    req.flash("error", "Location Not Found!");
    return res.redirect("/listings/new");
  }

  newListing.lat = coords.lat;
  newListing.lng = coords.lng;
  // map part ends here

  newListing.owner = req.user._id;
  newListing.image = { url, filename };

  await newListing.save();
  req.flash("success", "New listing Created!"); // key message pair.
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  // this module is used to render a form to edit that particular listing.
  let { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Your Listing Was Deleted!"); // key message pair.
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url;
  originalImageUrl.replace("/upload", "/upload/h_200,w_250"); // we are fixing the pixels of the image that is being displayed in edit form.

  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  // this module updates the changes made in edit form of that particular listing.
  let { id } = req.params;

  let listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Your Listing Was Deleted!"); // key message pair.
    return res.redirect("/listings");
  }

  //map updating logic begin here.
  const oldLocation = listing.location;
  const oldCountry = listing.country;

  listing.set({ ...req.body.listing });

  // map part
  if (
    oldLocation !== req.body.listing.location ||
    oldCountry !== req.body.listing.country
  ) {
    const coords = await getCoordinates(
      req.body.listing.location,
      req.body.listing.country,
    );

    if (!coords) {
      req.flash("error", "Updated Location Not Found.");
      return res.redirect(`/listings/${id}/edit`);
    }

    listing.lat = coords.lat;
    listing.lng = coords.lng;
  }
  // map part ends here

  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
  }

  await listing.save();

  req.flash("success", "Listing Updated!"); // key message pair.
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  // this module is used to delete a particular listing.
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted!"); // key message pair.
  res.redirect("/listings");
};
