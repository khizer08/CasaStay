const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  console.log("📧 Attempting to send email to:", to);
  console.log("📧 Using EMAIL_USER:", process.env.EMAIL_USER);

  await transporter.sendMail({
    from: `"Wanderlust" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log("✅ Email sent successfully");
};

module.exports = sendEmail;