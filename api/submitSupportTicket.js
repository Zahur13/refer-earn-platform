const { db, FieldValue } = require("./_firebase-admin");
const { verifyAuth } = require("./_helpers");
const cors = require("./_cors");

module.exports = async (req, res) => {
  if (cors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("📨 Support ticket submission started");

    const decodedToken = await verifyAuth(req);
    const userId = decodedToken.uid;

    const { userName, userEmail, userPhone, subject, message } = req.body;

    if (!userName || !userEmail || !subject || !message) {
      return res.status(400).json({ error: "Please fill all required fields" });
    }

    console.log("📨 Creating ticket for:", userName);

    // 1. Store in Firestore
    const supportTicket = {
      userId: userId,
      userName: userName,
      userEmail: userEmail,
      userPhone: userPhone || "",
      subject: subject,
      message: message,
      status: "PENDING",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("supportTickets").add(supportTicket);
    console.log("✅ Ticket created in Firestore:", docRef.id);

    // 2. Send email notification to admin
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">💬 New Support Request</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background: #fff;">
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold; width: 150px;">Name</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${userName}</td>
              </tr>
              <tr style="background: #f9f9f9;">
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Email</td>
                <td style="padding: 12px; border: 1px solid #ddd;"><a href="mailto:${userEmail}" style="color: #667eea;">${userEmail}</a></td>
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
              <tr style="background: #f9f9f9;">
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Submitted At</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${new Date().toLocaleString(
                  "en-IN",
                  { timeZone: "Asia/Kolkata" }
                )}</td>
              </tr>
            </table>
            
            <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #667eea;">Message:</h3>
              <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="mailto:${userEmail}?subject=Re: ${encodeURIComponent(
        subject
      )}" 
                 style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Reply to ${userName}
              </a>
            </div>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>This is an automated notification from Refer & Earn Platform</p>
            <p><a href="${
              process.env.NEXT_PUBLIC_APP_URL || "https://yoursite.com"
            }/admin/support" style="color: #667eea;">View in Admin Panel</a></p>
          </div>
        </div>
      `;

      // Use FormSubmit.co to send email (no setup required)
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
        SubmittedAt: new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
      });

      const emailResponse = await fetch(
        "https://formsubmit.co/ajax/refernearnplatform@gmail.com",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: formData.toString(),
        }
      );

      const emailResult = await emailResponse.json();

      if (emailResult.success === "true" || emailResponse.ok) {
        console.log("✅ Email sent successfully via FormSubmit");
      } else {
        console.log("⚠️ Email send warning:", emailResult);
      }
    } catch (emailError) {
      console.error("⚠️ Email send error:", emailError.message);
      // Continue - ticket is still saved in Firestore
    }

    // 3. Create notification for admin
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

        console.log("✅ Admin notification created");
      }
    } catch (notifError) {
      console.error("⚠️ Notification error:", notifError);
    }

    return res.status(200).json({
      success: true,
      message:
        "Your message has been sent successfully! Our support team will get back to you within 24 hours.",
      ticketId: docRef.id,
    });
  } catch (error) {
    console.error("❌ Support ticket error:", error);
    return res.status(500).json({
      error: "Failed to send message. Please try again later.",
    });
  }
};
