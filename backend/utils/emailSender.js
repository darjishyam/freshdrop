const axios = require('axios');

const sendEmail = async (options) => {
  // USE BREVO HTTP API (Bypasses SMTP Port Blocking)
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.error('BREVO_API_KEY is missing in environment variables');
    throw new Error('Email configuration missing');
  }

  const data = {
    sender: {
      name: process.env.FROM_NAME || 'FreshDrop',
      email: process.env.SMTP_EMAIL || process.env.FROM_EMAIL || 'professorshyam123@gmail.com'
    },
    to: [
      {
        email: options.email,
        name: options.name || 'User'
      }
    ],
    subject: options.subject,
    // Use provided HTML template if available, otherwise fallback to message text
    htmlContent: options.html || `<p>${options.message}</p>`,
  };

  

  try {
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', data, {
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      timeout: 10000 // 10s timeout
    });

    
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('❌ Brevo API Error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Email Sending Error:', error.message);
    }
    // Don't throw, just log to prevent crashing the flow if email fails
    return null;
  }
};

module.exports = sendEmail;
