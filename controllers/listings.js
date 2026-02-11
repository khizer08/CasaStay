const Listing = require("../models/listing");
const { getCoordinates } = require("../utils/geocode");
const Booking = require("../models/booking");

module.exports.index = async (req, res) => {
  // this module is used to list all listings.
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  // this module is used to render a form to create new listing.
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  // this module is used to list the particular listing details in breif.

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
    req.flash("error", "your listing was deleted!");
    return res.redirect("/listings");
  }

  // check if listing is currently booked
  const today = new Date();

  const activeBooking = await Booking.findOne({
    listing: listing._id,
    paymentStatus: "confirmed",
    checkIn: { $lte: today },
    checkOut: { $gte: today },
  });

  let daysLeft = null;

  if (activeBooking) {
    const diff = activeBooking.checkOut - today;
    daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
  // booking availability logic ends here.

  res.render("listings/show.ejs", {
    listing,
    activeBooking,
    daysLeft,
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
    req.flash("error", "Location not found!");
    return res.redirect("/listings/new");
  }

  newListing.lat = coords.lat;
  newListing.lng = coords.lng;
  // map part ends here

  newListing.owner = req.user._id;
  newListing.image = { url, filename };

  await newListing.save();
  req.flash("success", "New listing created!"); // key message pair.
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  // this module is used to render a form to edit that particular listing.
  let { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "your listing was deleted!"); // key message pair.
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
    req.flash("error", "your listing was deleted!"); // key message pair.
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
      req.flash("error", "Updated location not found.");
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

  req.flash("success", "listing updated!"); // key message pair.
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  // this module is used to delete a particular listing.
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "listing deleted!"); // key message pair.
  res.redirect("/listings");
};
