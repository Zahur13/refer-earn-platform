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
    const { withdrawalId, adminNote } = req.body;

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

    if (withdrawalData.status !== "PENDING") {
      return res.status(400).json({ error: "Withdrawal already processed" });
    }

    const batch = db.batch();

    // Update withdrawal
    const withdrawalRef = db.collection("withdrawals").doc(withdrawalId);
    batch.update(withdrawalRef, {
      status: "APPROVED",
      approvedBy: decodedToken.uid,
      approvedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      adminNote: adminNote || "Approved and processed",
    });

    // Deduct from user wallet
    const userRef = db.collection("users").doc(withdrawalData.userId);
    batch.update(userRef, {
      "wallet.balance": FieldValue.increment(-withdrawalData.amount),
      "wallet.lastUpdated": FieldValue.serverTimestamp(),
    });

    // Create transaction
    const txnRef = db.collection("transactions").doc();
    batch.set(txnRef, {
      userId: withdrawalData.userId,
      amount: withdrawalData.amount,
      type: "WITHDRAWAL",
      status: "SUCCESS",
      description: `Withdrawal to UPI: ${withdrawalData.upiId}`,
      withdrawalId: withdrawalId,
      upiId: withdrawalData.upiId,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Notify user
    const notifRef = db.collection("notifications").doc();
    batch.set(notifRef, {
      userId: withdrawalData.userId,
      type: "WITHDRAWAL_APPROVED",
      title: "✅ Withdrawal Approved!",
      message: `Your withdrawal of ₹${withdrawalData.amount} to ${withdrawalData.upiId} has been processed.`,
      amount: withdrawalData.amount,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return res.status(200).json({
      success: true,
      message: "Withdrawal approved",
    });
  } catch (error) {
    console.error("Approval error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
};
