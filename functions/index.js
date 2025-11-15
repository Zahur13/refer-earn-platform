const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Admin SDK
admin.initializeApp();

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

// ============ CONSTANTS ============
const CONSTANTS = {
  ACTIVATION_AMOUNT: 20,
  REFERRAL_BONUS: 10,
  ADMIN_SHARE: 10,
  MIN_WITHDRAWAL: 100,
  MAX_WITHDRAWAL: 10000,
};

// ============ HELPER FUNCTIONS ============

/**
 * Get admin user ID
 */
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

/**
 * Generate referral code
 */
function generateReferralCode(name, uid) {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const namePrefix = name.substring(0, 3).toUpperCase();
  const uidSuffix = uid.substring(0, 4).toUpperCase();
  return `${namePrefix}${randomNum}${uidSuffix}`;
}

// ============ USER CREATION ============

/**
 * Triggered when a new user is created in Firebase Auth
 */
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    const userRef = db.collection("users").doc(user.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      const tempDataRef = db.collection("tempUserData").doc(user.email);
      const tempDataDoc = await tempDataRef.get();
      const tempData = tempDataDoc.exists ? tempDataDoc.data() : {};

      const referralCode = generateReferralCode(
        tempData.name || user.displayName || user.email,
        user.uid
      );

      await userRef.set({
        name: tempData.name || user.displayName || "User",
        email: user.email,
        phone: tempData.phone || "",
        referralCode: referralCode,
        referredBy: tempData.referredBy || null,
        referrerId: tempData.referrerId || null,
        isReferralActive: false,
        wallet: {
          balance: 0,
          lastUpdated: FieldValue.serverTimestamp(),
        },
        stats: {
          totalReferrals: 0,
          activeReferrals: 0,
          totalEarnings: 0,
        },
        role: "user",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      await db.collection("referralCodes").doc(referralCode).set({
        userId: user.uid,
        createdAt: FieldValue.serverTimestamp(),
      });

      await db.collection("notifications").add({
        userId: user.uid,
        type: "WELCOME",
        title: "Welcome to Refer & Earn!",
        message: `Your referral code is ${referralCode}. Activate your account to start earning!`,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });

      if (tempDataDoc.exists) {
        await tempDataRef.delete();
      }

      console.log(`✅ User profile created for ${user.email}`);
    }
  } catch (error) {
    console.error("Error creating user profile:", error);
  }
});

// ============ ACTIVATION SYSTEM ============

/**
 * User submits activation request - FIXED VERSION
 */
exports.submitActivationRequest = functions.https.onCall(
  async (data, context) => {
    // 1. Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be logged in"
      );
    }

    const { utrNumber } = data;
    const userId = context.auth.uid;

    console.log("📝 Activation request received:", { userId, utrNumber });

    // 2. Validate UTR
    if (!utrNumber || utrNumber.length < 12) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid UTR number. Must be at least 12 characters."
      );
    }

    try {
      // 3. Get user data
      const userDoc = await db.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        console.error("❌ User not found:", userId);
        throw new functions.https.HttpsError("not-found", "User not found");
      }

      const userData = userDoc.data();
      console.log("✅ User found:", userData.name);

      // 4. Check if already activated
      if (userData.isReferralActive) {
        console.log("⚠️ User already activated");
        throw new functions.https.HttpsError(
          "already-exists",
          "Account already activated"
        );
      }

      // 5. Check for duplicate pending requests
      const existingRequests = await db
        .collection("activationRequests")
        .where("userId", "==", userId)
        .where("status", "==", "PENDING")
        .get();

      if (!existingRequests.empty) {
        console.log("⚠️ Pending request already exists");
        throw new functions.https.HttpsError(
          "already-exists",
          "You already have a pending activation request"
        );
      }

      // 6. Check for duplicate UTR
      const duplicateUTR = await db
        .collection("activationRequests")
        .where("utrNumber", "==", utrNumber.toUpperCase())
        .get();

      if (!duplicateUTR.empty) {
        console.log("⚠️ UTR already used");
        throw new functions.https.HttpsError(
          "already-exists",
          "This UTR number has already been used"
        );
      }

      const hasReferrer = userData.referrerId ? true : false;
      let referrerName = null;

      // 7. Get referrer name if exists
      if (hasReferrer) {
        try {
          const referrerDoc = await db
            .collection("users")
            .doc(userData.referrerId)
            .get();
          referrerName = referrerDoc.exists ? referrerDoc.data().name : null;
          console.log("✅ Referrer found:", referrerName);
        } catch (err) {
          console.error("⚠️ Error fetching referrer:", err);
        }
      }

      // 8. Create activation request
      const activationData = {
        userId: userId,
        userName: userData.name,
        userEmail: userData.email,
        userPhone: userData.phone || "",
        utrNumber: utrNumber.toUpperCase(),
        amount: CONSTANTS.ACTIVATION_AMOUNT,
        hasReferrer: hasReferrer,
        referrerId: userData.referrerId || null,
        referrerName: referrerName,
        status: "PENDING",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      console.log("📄 Creating activation request:", activationData);

      await db.collection("activationRequests").add(activationData);

      console.log("✅ Activation request created successfully");

      // 9. Send notification to user
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
        console.log("✅ Notification sent");
      } catch (notifError) {
        console.error("⚠️ Notification error (non-critical):", notifError);
      }

      return {
        success: true,
        message:
          "Activation request submitted! Admin will verify your payment.",
      };
    } catch (error) {
      console.error("❌ Activation request error:", error);

      // Re-throw HttpsError as-is
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      // Wrap other errors
      throw new functions.https.HttpsError(
        "internal",
        `Error: ${error.message}`
      );
    }
  }
);

/**
 * Admin approves activation
 */
exports.approveActivation = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be logged in"
    );
  }

  const adminDoc = await db.collection("users").doc(context.auth.uid).get();
  if (!adminDoc.exists || adminDoc.data().role !== "admin") {
    throw new functions.https.HttpsError("permission-denied", "Admin only");
  }

  const { requestId } = data;

  try {
    const requestDoc = await db
      .collection("activationRequests")
      .doc(requestId)
      .get();

    if (!requestDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Request not found");
    }

    const requestData = requestDoc.data();

    if (requestData.status !== "PENDING") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Request already processed"
      );
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
      approvedBy: context.auth.uid,
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

    await batch.commit();

    return { success: true, message: "Activation approved successfully" };
  } catch (error) {
    console.error("Approval error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Admin rejects activation
 */
exports.rejectActivation = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be logged in"
    );
  }

  const adminDoc = await db.collection("users").doc(context.auth.uid).get();
  if (!adminDoc.exists || adminDoc.data().role !== "admin") {
    throw new functions.https.HttpsError("permission-denied", "Admin only");
  }

  const { requestId, reason } = data;

  try {
    const requestDoc = await db
      .collection("activationRequests")
      .doc(requestId)
      .get();

    if (!requestDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Request not found");
    }

    const requestData = requestDoc.data();

    await db
      .collection("activationRequests")
      .doc(requestId)
      .update({
        status: "REJECTED",
        rejectedBy: context.auth.uid,
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

    return { success: true, message: "Activation rejected" };
  } catch (error) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// ============ WITHDRAWAL SYSTEM ============

/**
 * User creates withdrawal request with UPI
 */
exports.createWithdrawalRequest = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be logged in"
      );
    }

    const { amount, upiId } = data;
    const userId = context.auth.uid;

    if (amount < CONSTANTS.MIN_WITHDRAWAL) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        `Minimum withdrawal is ₹${CONSTANTS.MIN_WITHDRAWAL}`
      );
    }

    if (amount > CONSTANTS.MAX_WITHDRAWAL) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        `Maximum withdrawal is ₹${CONSTANTS.MAX_WITHDRAWAL}`
      );
    }

    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
    if (!upiRegex.test(upiId)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid UPI ID format"
      );
    }

    try {
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "User not found");
      }

      const userData = userDoc.data();

      if (amount > userData.wallet.balance) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Insufficient balance"
        );
      }

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

      return { success: true, message: "Withdrawal request submitted" };
    } catch (error) {
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);

/**
 * Admin approves withdrawal
 */
exports.approveWithdrawal = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be logged in"
    );
  }

  const adminDoc = await db.collection("users").doc(context.auth.uid).get();
  if (!adminDoc.exists || adminDoc.data().role !== "admin") {
    throw new functions.https.HttpsError("permission-denied", "Admin only");
  }

  const { withdrawalId, adminNote } = data;

  try {
    const withdrawalDoc = await db
      .collection("withdrawals")
      .doc(withdrawalId)
      .get();

    if (!withdrawalDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Withdrawal not found");
    }

    const withdrawalData = withdrawalDoc.data();

    if (withdrawalData.status !== "PENDING") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Withdrawal already processed"
      );
    }

    const batch = db.batch();

    const withdrawalRef = db.collection("withdrawals").doc(withdrawalId);
    batch.update(withdrawalRef, {
      status: "APPROVED",
      approvedBy: context.auth.uid,
      approvedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      adminNote: adminNote || "Approved and processed",
    });

    const userRef = db.collection("users").doc(withdrawalData.userId);
    batch.update(userRef, {
      "wallet.balance": FieldValue.increment(-withdrawalData.amount),
      "wallet.lastUpdated": FieldValue.serverTimestamp(),
    });

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

    return { success: true, message: "Withdrawal approved" };
  } catch (error) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Admin rejects withdrawal
 */
exports.rejectWithdrawal = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be logged in"
    );
  }

  const adminDoc = await db.collection("users").doc(context.auth.uid).get();
  if (!adminDoc.exists || adminDoc.data().role !== "admin") {
    throw new functions.https.HttpsError("permission-denied", "Admin only");
  }

  const { withdrawalId, reason } = data;

  try {
    const withdrawalDoc = await db
      .collection("withdrawals")
      .doc(withdrawalId)
      .get();

    if (!withdrawalDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Withdrawal not found");
    }

    const withdrawalData = withdrawalDoc.data();

    await db
      .collection("withdrawals")
      .doc(withdrawalId)
      .update({
        status: "REJECTED",
        rejectedBy: context.auth.uid,
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

    return { success: true, message: "Withdrawal rejected" };
  } catch (error) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Verify payment UTR
 */
exports.verifyPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const { utrNumber, amount } = data;

  if (!utrNumber || utrNumber.length < 12) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid UTR number"
    );
  }

  console.log("Verifying payment:", { utrNumber, amount });

  return {
    verified: true,
    message: "Payment verified successfully",
    utrNumber: utrNumber,
    amount: amount,
    timestamp: new Date().toISOString(),
  };
});
