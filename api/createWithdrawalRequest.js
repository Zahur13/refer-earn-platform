const { db, FieldValue } = require("./_firebase-admin");
const { verifyAuth, CONSTANTS } = require("./_helpers");
const cors = require("./_cors");

module.exports = async (req, res) => {
  if (cors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const decodedToken = await verifyAuth(req);
    const userId = decodedToken.uid;

    const { amount, upiId } = req.body;

    // Validate amount
    if (!amount || amount < CONSTANTS.MIN_WITHDRAWAL) {
      return res.status(400).json({
        error: `Minimum withdrawal is ₹${CONSTANTS.MIN_WITHDRAWAL}`,
      });
    }

    if (amount > CONSTANTS.MAX_WITHDRAWAL) {
      return res.status(400).json({
        error: `Maximum withdrawal is ₹${CONSTANTS.MAX_WITHDRAWAL}`,
      });
    }

    // Validate UPI ID
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
    if (!upiId || !upiRegex.test(upiId)) {
      return res.status(400).json({ error: "Invalid UPI ID format" });
    }

    // Get user data
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();

    // Check balance
    if (amount > userData.wallet.balance) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Create withdrawal request
    await db.collection("withdrawals").add({
      userId: userId,
      userName: userData.name,
      userEmail: userData.email,
      amount: amount,
      upiId: upiId.toLowerCase(),
      status: "PENDING",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      message: "Withdrawal request submitted",
    });
  } catch (error) {
    console.error("Withdrawal request error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
};
