const { db, FieldValue } = require("./_firebase-admin");
const { verifyAdmin } = require("./_helpers");
const cors = require("./_cors");

module.exports = async (req, res) => {
  if (cors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const decodedToken = await verifyAdmin(req);
    const { withdrawalId, reason } = req.body;

    if (!withdrawalId) {
      return res.status(400).json({ error: "Withdrawal ID is required" });
    }

    const withdrawalDoc = await db
      .collection("withdrawals")
      .doc(withdrawalId)
      .get();

    if (!withdrawalDoc.exists) {
      return res.status(404).json({ error: "Withdrawal not found" });
    }

    const withdrawalData = withdrawalDoc.data();

    await db
      .collection("withdrawals")
      .doc(withdrawalId)
      .update({
        status: "REJECTED",
        rejectedBy: decodedToken.uid,
        rejectedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        adminNote: reason || "Withdrawal rejected",
      });

    await db.collection("notifications").add({
      userId: withdrawalData.userId,
      type: "WITHDRAWAL_REJECTED",
      title: "❌ Withdrawal Rejected",
      message:
        reason ||
        "Your withdrawal request was rejected. Please contact support.",
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      message: "Withdrawal rejected",
    });
  } catch (error) {
    console.error("Rejection error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
};
