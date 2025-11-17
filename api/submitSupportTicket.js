const { db, FieldValue } = require("./_firebase-admin");
const { verifyAuth } = require("./_helpers");
const cors = require("./_cors");

module.exports = async (req, res) => {
  if (cors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const decodedToken = await verifyAuth(req);
    const userId = decodedToken.uid;

    const { userName, userEmail, userPhone, subject, message } = req.body;

    if (!userName || !userEmail || !subject || !message) {
      return res.status(400).json({ error: "Please fill all required fields" });
    }

    const supportTicket = {
      userId: userId,
      userName: userName,
      userEmail: userEmail,
      userPhone: userPhone || "",
      subject: subject,
      message: message,
      status: "PENDING",
      replies: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("supportTickets").add(supportTicket);

    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">💬 New Support Request</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background: #fff;">
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Name</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${userName}</td>
              </tr>
              <tr style="background: #f9f9f9;">
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Email</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${userEmail}</td>
              </tr>
              <tr style="background: #fff;">
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Phone</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${
                  userPhone || "Not provided"
                }</td>
              </tr>
              <tr style="background: #f9f9f9;">
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Subject</td>
                <td style="padding: 12px; border: 1px solid #ddd;"><strong>${subject}</strong></td>
              </tr>
              <tr style="background: #fff;">
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Ticket ID</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${
                  docRef.id
                }</td>
              </tr>
            </table>
            
            <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #667eea;">Message:</h3>
              <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
            </div>
          </div>
        </div>
      `;

      const formData = new URLSearchParams({
        _subject: `🆘 Support Request: ${subject}`,
        _template: "box",
        _captcha: "false",
        Name: userName,
        Email: userEmail,
        Phone: userPhone || "Not provided",
        Subject: subject,
        Message: message,
        TicketID: docRef.id,
      });

      await fetch("https://formsubmit.co/ajax/refernearnplatform@gmail.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: formData.toString(),
      });
    } catch (emailError) {
      // Email error is non-critical, ticket is still created
    }

    try {
      const adminSnapshot = await db
        .collection("users")
        .where("role", "==", "admin")
        .limit(1)
        .get();

      if (!adminSnapshot.empty) {
        const adminId = adminSnapshot.docs[0].id;

        await db.collection("notifications").add({
          userId: adminId,
          type: "SUPPORT_REQUEST",
          title: "New Support Request",
          message: `${userName} submitted: ${subject}`,
          read: false,
          ticketId: docRef.id,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    } catch (notifError) {
      // Notification error is non-critical
    }

    return res.status(200).json({
      success: true,
      message:
        "Your message has been sent successfully! Our support team will get back to you within 24 hours.",
      ticketId: docRef.id,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to send message. Please try again later.",
    });
  }
};
