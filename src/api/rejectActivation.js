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
    const adminUserId = decodedToken.uid;

    const adminDoc = await db.collection("users").doc(adminUserId).get();
    if (!adminDoc.exists || adminDoc.data().role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { requestId, reason } = req.body;

    if (!requestId) {
      return res.status(400).json({ error: "Request ID is required" });
    }

    const requestDoc = await db
      .collection("activationRequests")
      .doc(requestId)
      .get();

    if (!requestDoc.exists) {
      return res.status(404).json({ error: "Request not found" });
    }

    const requestData = requestDoc.data();

    await db
      .collection("activationRequests")
      .doc(requestId)
      .update({
        status: "REJECTED",
        rejectedBy: adminUserId,
        rejectionReason: reason || "Payment verification failed",
        rejectedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    await db.collection("notifications").add({
      userId: requestData.userId,
      type: "ACTIVATION_REJECTED",
      title: "❌ Activation Rejected",
      message: reason || "Payment verification failed. Please contact support.",
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      message: "Activation rejected",
    });
  } catch (error) {
    console.error("Reject activation error:", error);
    return res.status(500).json({
      error: error.message || "Failed to reject activation",
    });
  }
};
