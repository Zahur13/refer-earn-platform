const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const cors = (req, res) => {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }
  return false;
};

module.exports = async (req, res) => {
  if (cors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userName, userEmail, userPhone, subject, message } = req.body;

    if (!userName || !userEmail || !subject || !message) {
      return res.status(400).json({ error: "Please fill all required fields" });
    }

    if (!process.env.SENDGRID_API_KEY) {
      console.error("❌ SENDGRID_API_KEY not set");
      return res.status(500).json({ error: "Email service not configured" });
    }

    const msg = {
      to: "refernearnplatform@gmail.com",
      from: "refernearnplatform@gmail.com", // Must be verified in SendGrid
      replyTo: userEmail,
      subject: `Support Request: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .info-table td { padding: 10px; border: 1px solid #ddd; }
            .info-table td:first-child { background: #f0f0f0; font-weight: bold; width: 150px; }
            .message-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">💬 New Support Request</h2>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
              <table class="info-table">
                <tr><td>Name</td><td>${userName}</td></tr>
                <tr><td>Email</td><td><a href="mailto:${userEmail}">${userEmail}</a></td></tr>
                <tr><td>Phone</td><td>${userPhone || "Not provided"}</td></tr>
                <tr><td>Subject</td><td><strong>${subject}</strong></td></tr>
                <tr><td>Received At</td><td>${new Date().toLocaleString(
                  "en-IN",
                  { timeZone: "Asia/Kolkata" }
                )}</td></tr>
              </table>
              <div class="message-box">
                <h3 style="margin-top: 0; color: #667eea;">Message:</h3>
                <p style="white-space: pre-wrap;">${message}</p>
              </div>
              <p style="text-align: center;">
                <a href="mailto:${userEmail}?subject=Re: ${encodeURIComponent(
        subject
      )}" 
                   style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                  Reply to ${userName}
                </a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await sgMail.send(msg);

    console.log(`✅ Support email sent from ${userName}`);

    return res.status(200).json({
      success: true,
      message:
        "Your message has been sent successfully! We'll get back to you soon.",
    });
  } catch (error) {
    console.error("❌ SendGrid error:", error);

    if (error.response) {
      console.error("Response body:", error.response.body);
    }

    return res.status(500).json({
      error: "Failed to send message. Please try again later.",
    });
  }
};
