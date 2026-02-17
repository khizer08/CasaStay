const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer"); //  added

cloudinary.config({
  //the name which we are using (cloud_name,api_key,api_secret) these has to be given the same name as done here , we cannot give our own name.
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "casastay_DEV",
    resource_type: "image",
    allowedFormats: ["jpg", "png", "jpeg"],
  },
});

//  Only Allow Image Formats Here
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, JPEG, PNG Images Are Allowed"), false);
    }
  },
});

module.exports = {
  cloudinary,
  upload, //  export upload instead of storage
};
