const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({//the name which we are using (cloud_name,api_key,api_secret) these has to be given the same name as done here , we cannot give our own name.
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_API_KEY,
    api_secret:process.env.CLOUD_API_SECRET
});

 
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'casastay_DEV',
    allowedFormats: ["jpg","png","pdf","jpeg"],
  },
});

module.exports={
    cloudinary,
    storage,
};