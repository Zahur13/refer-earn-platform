const { db, FieldValue } = require("./_firebase-admin");
const { verifyAuth } = require("./_helpers");
const cors = require("./_cors");

module.exports = async (req, res) => {
  // Handle CORS
  if (cors(req, res)) return;

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify authentication
    const decodedToken = await verifyAuth(req);
    const userId = decodedToken.uid;

    const { utrNumber } = req.body;

    // Validate UTR
    if (!utrNumber || utrNumber.length < 12) {
      return res.status(400).json({
        error: "Invalid UTR number. Must be at least 12 characters.",
      });
    }

    // Get user data
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();

    // Check if already activated
    if (userData.isReferralActive) {
      return res.status(400).json({ error: "Account already activated" });
    }

    // Check for duplicate pending requests
    const existingRequests = await db
      .collection("activationRequests")
      .where("userId", "==", userId)
      .where("status", "==", "PENDING")
      .get();

    if (!existingRequests.empty) {
      return res.status(400).json({
        error: "You already have a pending activation request",
      });
    }

    // Check for duplicate UTR
    const duplicateUTR = await db
      .collection("activationRequests")
      .where("utrNumber", "==", utrNumber.toUpperCase())
      .get();

    if (!duplicateUTR.empty) {
      return res.status(400).json({
        error: "This UTR number has already been used",
      });
    }

    const hasReferrer = userData.referrerId ? true : false;
    let referrerName = null;

    // Get referrer name if exists
    if (hasReferrer) {
      try {
        const referrerDoc = await db
          .collection("users")
          .doc(userData.referrerId)
          .get();
        referrerName = referrerDoc.exists ? referrerDoc.data().name : null;
      } catch (err) {
        console.error("Error fetching referrer:", err);
      }
    }

    // Create activation request
    const activationData = {
      userId: userId,
      userName: userData.name,
      userEmail: userData.email,
      userPhone: userData.phone || "",
      utrNumber: utrNumber.toUpperCase(),
      amount: 20,
      hasReferrer: hasReferrer,
      referrerId: userData.referrerId || null,
      referrerName: referrerName,
      status: "PENDING",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await db.collection("activationRequests").add(activationData);

    // Send notification to user
    try {
      await db.collection("notifications").add({
        userId: userId,
        type: "ACTIVATION_SUBMITTED",
        title: "Activation Request Submitted",
        message:
          "Your payment is being verified. You'll be notified once approved.",
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (notifError) {
      console.error("Notification error:", notifError);
    }

    return res.status(200).json({
      success: true,
      message: "Activation request submitted! Admin will verify your payment.",
    });
  } catch (error) {
    console.error("Activation request error:", error);
    return res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
};
