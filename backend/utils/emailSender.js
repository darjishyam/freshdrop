const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();
const sendEmail = async (options) => {
  const hasSmtpHost = Boolean(process.env.EMAIL_HOST);

  // Create transporter (Gmail service fallback; SMTP preferred when configured)
  const transporter = hasSmtpHost
    ? nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT || 587),
        secure: Number(process.env.EMAIL_PORT) === 465, // true for 465, false for 587
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      })
    : nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER, // e.g. 'yourname@gmail.com'
          pass: process.env.EMAIL_PASS, // App Password from Google Account
        },
      });

  const message = {
    // Supports both legacy FROM_* and EMAIL_FROM envs
    from:
      process.env.EMAIL_FROM ||
      `${process.env.FROM_NAME || "FreshDrop"} <${
        process.env.FROM_EMAIL || process.env.EMAIL_USER || "noreply@freshdrop.com"
      }>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, // Support HTML emails
  };

  try {
    await transporter.sendMail(message);
    return true;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Email send failed:", error?.message || error);
    }
    return false;
  }
};

module.exports = sendEmail;
