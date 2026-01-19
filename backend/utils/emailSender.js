const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();
const sendEmail = async (options) => {
  // Create transporter (using Gmail service for example)
  // For production, use SendGrid, Mailgun, or AWS SES
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // e.g. 'yourname@gmail.com'
      pass: process.env.EMAIL_PASS, // App Password from Google Acczount
    },
  });

  const message = {
    from: `${process.env.FROM_NAME || "FreshDrop"} <${
      process.env.FROM_EMAIL || "noreply@freshdrop.com"
    }>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, // Support HTML emails
  };

  try {
    const info = await transporter.sendMail(message);
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = sendEmail;
