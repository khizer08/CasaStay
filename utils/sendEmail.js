const axios = require("axios");

const sendEmail = async ({ to, subject, html }) => {
  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "CasaStay",
          email: "CasaStay008@gmail.com", // verified sender
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (err) {
    console.error("Email API error:", err.response?.data || err.message);
  }
};

module.exports = sendEmail;
