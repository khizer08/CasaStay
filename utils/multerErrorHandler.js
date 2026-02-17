const multer = require("multer");

module.exports = (err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message.includes("Only")) {
    req.flash("error", err.message);

    return req.session.save(() => {
      if (req.method === "PUT" && req.params.id) {
        return res.redirect(`/listings/${req.params.id}/edit`);
      }
      return res.redirect("/listings/new");
    });
  }

  next(err);
};
