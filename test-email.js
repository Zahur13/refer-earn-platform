const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransporter({
  service: "gmail",
  auth: {
    user: "refernearnplatform@gmail.com",
    pass: "fwysvymkijoxikqy", // Replace with your actual password
  },
});

async function testEmail() {
  try {
    const info = await transporter.sendMail({
      from: "refernearnplatform@gmail.com",
      to: "refernearnplatform@gmail.com",
      subject: "Test Email",
      html: "<h1>Test successful!</h1>",
    });

    console.log("✅ Email sent:", info.messageId);
  } catch (error) {
    console.error("❌ Email error:", error);
  }
}

testEmail();
