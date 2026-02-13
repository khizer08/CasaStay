const ejs = require("ejs");
const path = require("path");
const sendEmail = require("./sendEmail");
const { generateOTP, hashOTP } = require("./generateOTP");

module.exports.sendOTP = async ({
  target,
  hashField,
  expiryField,
  subject,
  template,
  templateData,
  recipientEmail,
}) => {
  // 1️ Generate OTP
  const otp = generateOTP();
  const otpHash = hashOTP(otp);

  // 2 Store hash + expiry (2 mins)
  target[hashField] = otpHash;
  target[expiryField] = Date.now() + 0.5 * 60 * 1000;

  await target.save();

  // 3 Render email template dynamically
  const html = await ejs.renderFile(
    path.join(__dirname, `../views/emails/otp/${template}`),
    templateData(otp)
  );

  // 4 Send email
  await sendEmail({
    to: recipientEmail,
    subject,
    html,
  });
};