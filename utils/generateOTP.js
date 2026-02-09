const crypto = require("crypto");

module.exports.generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

module.exports.hashOTP = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};