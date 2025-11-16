const { db, FieldValue } = require("./_firebase-admin");
const { verifyAuth } = require("./_helpers");
const cors = require("./_cors");

const CONSTANTS = {
  ACTIVATION_AMOUNT: 20,
  REFERRAL_BONUS: 10,
  ADMIN_SHARE: 10,
};

async function getAdminUserId() {
  const adminSnapshot = await db
    .collection("users")
    .where("role", "==", "admin")
    .limit(1)
    .get();

  if (adminSnapshot.empty) {
    throw new Error("Admin user not found");
  }

  return adminSnapshot.docs[0].id;
}

module.exports = async (req, res) => {
  if (cors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const decodedToken = await verifyAuth(req);
    const adminUserId = decodedToken.uid;

    // Verify admin role
    const adminDoc = await db.collection("users").doc(adminUserId).get();
    if (!adminDoc.exists || adminDoc.data().role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({ error: "Request ID is required" });
    }

    // Get activation request
    const requestDoc = await db
      .collection("activationRequests")
      .doc(requestId)
      .get();

    if (!requestDoc.exists) {
      return res.status(404).json({ error: "Request not found" });
    }

    const requestData = requestDoc.data();

    if (requestData.status !== "PENDING") {
      return res.status(400).json({ error: "Request already processed" });
    }

    const userId = requestData.userId;
    const hasReferrer = requestData.hasReferrer;

    let userCredit = 0;
    let referrerBonus = 0;
    let adminShare = 0;

    if (hasReferrer) {
      referrerBonus = CONSTANTS.REFERRAL_BONUS;
      adminShare = CONSTANTS.ADMIN_SHARE;
      userCredit = 0;
    } else {
      userCredit = CONSTANTS.REFERRAL_BONUS;
      adminShare = CONSTANTS.ADMIN_SHARE;
      referrerBonus = 0;
    }

    // Get user data
    const userDataDoc = await db.collection("users").doc(userId).get();
    if (!userDataDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    const userData = userDataDoc.data();

    const batch = db.batch();

    // Update user
    const userRef = db.collection("users").doc(userId);
    batch.update(userRef, {
      "wallet.balance": FieldValue.increment(userCredit),
      "wallet.lastUpdated": FieldValue.serverTimestamp(),
      isReferralActive: true,
      activatedAt: FieldValue.serverTimestamp(),
    });

    // Create user transaction
    const userTxnRef = db.collection("transactions").doc();
    batch.set(userTxnRef, {
      userId: userId,
      amount: userCredit,
      type: "ACTIVATION_PAYMENT",
      status: "SUCCESS",
      utrNumber: requestData.utrNumber,
      description: hasReferrer
        ? "Account activation (Referral bonus to referrer)"
        : `Account activation (₹${userCredit} credited to wallet)`,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Process referrer bonus
    if (hasReferrer && referrerBonus > 0 && requestData.referrerId) {
      const referrerRef = db.collection("users").doc(requestData.referrerId);
      batch.update(referrerRef, {
        "wallet.balance": FieldValue.increment(referrerBonus),
        "wallet.lastUpdated": FieldValue.serverTimestamp(),
        "stats.totalReferrals": FieldValue.increment(1),
        "stats.activeReferrals": FieldValue.increment(1),
        "stats.totalEarnings": FieldValue.increment(referrerBonus),
      });

      const referrerTxnRef = db.collection("transactions").doc();
      batch.set(referrerTxnRef, {
        userId: requestData.referrerId,
        amount: referrerBonus,
        type: "REFERRAL_BONUS",
        status: "SUCCESS",
        description: `Referral bonus from ${requestData.userName}`,
        referredUserId: userId,
        createdAt: FieldValue.serverTimestamp(),
      });

      const referrerNotifRef = db.collection("notifications").doc();
      batch.set(referrerNotifRef, {
        userId: requestData.referrerId,
        type: "REFERRAL_ACTIVATED",
        title: "🎉 New Referral Activated!",
        message: `${requestData.userName} activated their account. You earned ₹${referrerBonus}!`,
        amount: referrerBonus,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    // Process admin earnings
    if (adminShare > 0) {
      const adminId = await getAdminUserId();
      const adminRef = db.collection("users").doc(adminId);

      batch.update(adminRef, {
        "wallet.balance": FieldValue.increment(adminShare),
        "wallet.lastUpdated": FieldValue.serverTimestamp(),
        "stats.totalEarnings": FieldValue.increment(adminShare),
      });

      const adminTxnRef = db.collection("transactions").doc();
      batch.set(adminTxnRef, {
        userId: adminId,
        amount: adminShare,
        type: "PLATFORM_FEE",
        status: "SUCCESS",
        description: `Platform fee from ${requestData.userName}'s activation`,
        sourceUserId: userId,
        utrNumber: requestData.utrNumber,
        createdAt: FieldValue.serverTimestamp(),
      });

      const adminStatsRef = db.collection("adminStats").doc("earnings");
      batch.set(
        adminStatsRef,
        {
          totalEarnings: FieldValue.increment(adminShare),
          totalActivations: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    // Update activation request
    const requestRef = db.collection("activationRequests").doc(requestId);
    batch.update(requestRef, {
      status: "APPROVED",
      approvedBy: adminUserId,
      approvedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // User notification
    const userNotifRef = db.collection("notifications").doc();
    batch.set(userNotifRef, {
      userId: userId,
      type: "ACTIVATION_APPROVED",
      title: "🎉 Activation Approved!",
      message: hasReferrer
        ? "Your account is activated! Start referring to earn more."
        : `Your account is activated with ₹${userCredit} bonus!`,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    // COMMIT BATCH
    await batch.commit();

    // ✅ UPDATE REFERRAL CODE AFTER BATCH (CRITICAL FIX)
    if (userData.referralCode) {
      try {
        console.log(`🔄 Updating referral code: ${userData.referralCode}`);

        const referralCodeRef = db
          .collection("referralCodes")
          .doc(userData.referralCode);

        await referralCodeRef.set(
          {
            userId: userId,
            userName: requestData.userName || userData.name,
            isActive: true,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        console.log(
          `✅ Referral code ${userData.referralCode} updated successfully`
        );
      } catch (refError) {
        console.error(`❌ Failed to update referral code:`, refError);
        // Don't fail the whole operation
      }
    } else {
      console.warn(`⚠️ User ${userId} has no referral code`);
    }

    return res.status(200).json({
      success: true,
      message: "Activation approved successfully",
    });
  } catch (error) {
    console.error("Approve activation error:", error);
    return res.status(500).json({
      error: error.message || "Failed to approve activation",
    });
  }
};
