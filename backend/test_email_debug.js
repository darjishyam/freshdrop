require("dotenv").config();
const nodemailer = require("nodemailer");

const testEmail = async () => {
    console.log("--- STARTING TEST ---");
    console.log(`HOST: ${process.env.EMAIL_HOST}`);
    console.log(`PORT: ${process.env.EMAIL_PORT}`);
    console.log(`USER: ${process.env.EMAIL_USER}`);

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: false, // 587 is STARTTLS, so secure false
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    try {
        console.log("Attempting to send mail...");
        // Verify connection config
        await transporter.verify();
        console.log("✅ SMTP Configuration verification sucessful!");

        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: "Test Email",
            text: "SMTP is working!",
        });
        console.log("✅ Email sent successfully!");
        console.log("Message ID: " + info.messageId);
    } catch (error) {
        console.error("❌ FAILED:");
        console.error(error.message);
        if (error.response) console.error("Response:", error.response);
    }
    console.log("--- END TEST ---");
};

testEmail();
