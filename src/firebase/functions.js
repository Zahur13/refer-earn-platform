import { db } from "./config";
import {
  doc,
  updateDoc,
  setDoc,
  getDoc,
  increment,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";
import {
  CONSTANTS,
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
} from "../utils/constants";
import { createNotification } from "./notificationService";

/**
 * Get admin user ID
 */
let cachedAdminId = null;

export const getAdminUserId = async () => {
  if (cachedAdminId) return cachedAdminId;

  try {
    const q = query(collection(db, "users"), where("role", "==", "admin"));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      cachedAdminId = snapshot.docs[0].id;
      return cachedAdminId;
    }
    return null;
  } catch (error) {
    console.error("Error getting admin ID:", error);
    return null;
  }
};

/**
 * Process activation payment (UPI based - NO OTP)
 */
export const processActivationPayment = async (
  userId,
  amount,
  paymentDetails
) => {
  try {
    // console.log("🔄 Processing activation payment...");
    // console.log("User ID:", userId);
    // console.log("Amount:", amount);
    // console.log("Payment Details:", paymentDetails);

    // Get user data
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("User not found");
    }

    const userData = userSnap.data();

    if (userData.isReferralActive) {
      throw new Error("Account already activated");
    }

    const hasReferrer = userData.referrerId ? true : false;

    // Calculate distributions
    let userCredit = 0;
    let referrerBonus = 0;
    let adminShare = 0;

    if (hasReferrer) {
      // Has referrer: ₹10 to referrer, ₹10 to admin, ₹0 to user
      referrerBonus = CONSTANTS.REFERRAL_BONUS;
      adminShare = CONSTANTS.ADMIN_SHARE;
      userCredit = 0;
    } else {
      // No referrer: ₹10 to user, ₹10 to admin
      userCredit = CONSTANTS.REFERRAL_BONUS; // User gets ₹10
      adminShare = CONSTANTS.ADMIN_SHARE;
      referrerBonus = 0;
    }

    // console.log("💰 Distribution:", { userCredit, referrerBonus, adminShare });

    // Update user wallet and activate
    await updateDoc(userRef, {
      "wallet.balance": increment(userCredit),
      "wallet.lastUpdated": serverTimestamp(),
      isReferralActive: true,
      activatedAt: serverTimestamp(),
    });
    console.log("✅ User activated");
    try {
      const referralCodeRef = doc(db, "referralCodes", userData.referralCode);
      await updateDoc(referralCodeRef, {
        isActive: true,
      });
      console.log("✅ Referral code activated");
    } catch (error) {
      console.error("⚠️ Could not activate referral code:", error);
    }

    // Create transaction for user
    await addDoc(collection(db, "transactions"), {
      userId: userId,
      amount: userCredit,
      type: TRANSACTION_TYPES.ACTIVATION_PAYMENT,
      status: TRANSACTION_STATUS.SUCCESS,
      utrNumber: paymentDetails.utrNumber,
      paymentMethod: paymentDetails.method,
      description: hasReferrer
        ? "Account activation (Referral bonus to referrer)"
        : `Account activation (₹${userCredit} credited to wallet)`,
      createdAt: serverTimestamp(),
    });

    // Process referrer bonus
    if (hasReferrer && referrerBonus > 0) {
      console.log("📝 Processing referrer bonus...");

      const referrerRef = doc(db, "users", userData.referrerId);
      const referrerSnap = await getDoc(referrerRef);

      if (referrerSnap.exists()) {
        await updateDoc(referrerRef, {
          "wallet.balance": increment(referrerBonus),
          "wallet.lastUpdated": serverTimestamp(),
          "stats.totalReferrals": increment(1),
          "stats.activeReferrals": increment(1),
          "stats.totalEarnings": increment(referrerBonus),
        });

        await addDoc(collection(db, "transactions"), {
          userId: userData.referrerId,
          amount: referrerBonus,
          type: TRANSACTION_TYPES.REFERRAL_BONUS,
          status: TRANSACTION_STATUS.SUCCESS,
          description: `Referral bonus from ${userData.name}`,
          referredUserId: userId,
          createdAt: serverTimestamp(),
        });

        // Send notification to referrer
        await createNotification(userData.referrerId, {
          type: "REFERRAL_ACTIVATED",
          title: "🎉 New Referral Activated!",
          message: `${userData.name} activated their account. You earned ₹${referrerBonus}!`,
          amount: referrerBonus,
        });

        console.log("✅ Referrer bonus processed");
      }
    }

    // Process admin earnings
    if (adminShare > 0) {
      console.log("📝 Processing admin earnings...");

      const adminId = await getAdminUserId();

      if (adminId) {
        const adminRef = doc(db, "users", adminId);

        await updateDoc(adminRef, {
          "wallet.balance": increment(adminShare),
          "wallet.lastUpdated": serverTimestamp(),
          "stats.totalEarnings": increment(adminShare),
        });

        await addDoc(collection(db, "transactions"), {
          userId: adminId,
          amount: adminShare,
          type: TRANSACTION_TYPES.PLATFORM_FEE,
          status: TRANSACTION_STATUS.SUCCESS,
          description: `Platform fee from ${userData.name}'s activation`,
          sourceUserId: userId,
          utrNumber: paymentDetails.utrNumber,
          createdAt: serverTimestamp(),
        });

        console.log("✅ Admin earnings processed");
      }

      // Update admin stats
      const adminStatsRef = doc(db, "adminStats", "earnings");
      const adminStatsSnap = await getDoc(adminStatsRef);

      if (adminStatsSnap.exists()) {
        await updateDoc(adminStatsRef, {
          totalEarnings: increment(adminShare),
          totalActivations: increment(1),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(adminStatsRef, {
          totalEarnings: adminShare,
          totalActivations: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }

    // Send welcome notification to user
    await createNotification(userId, {
      type: "WELCOME",
      title: "🎉 Welcome to Refer & Earn!",
      message: hasReferrer
        ? `Your account is activated! Start referring to earn ₹${CONSTANTS.REFERRAL_BONUS} per referral.`
        : `Your account is activated with ₹${userCredit} bonus! Start referring to earn more.`,
    });

    console.log("🎉 Activation complete!");

    return {
      success: true,
      message: hasReferrer
        ? "🎉 Account activated! You can now start earning through referrals."
        : `🎉 Account activated! ₹${userCredit} added to your wallet.`,
      userCredit,
      referrerBonus,
      adminShare,
    };
  } catch (error) {
    console.error("❌ Activation error:", error);
    throw error;
  }
};

/**
 * Validate referral code
 */
export const validateReferralCode = async (code) => {
  try {
    const codeRef = doc(db, "referralCodes", code.toUpperCase());
    const codeSnap = await getDoc(codeRef);

    if (!codeSnap.exists()) {
      return { valid: false, message: "Invalid referral code" };
    }

    const userId = codeSnap.data().userId;
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { valid: false, message: "Referrer not found" };
    }

    const userData = userSnap.data();

    if (!userData.isReferralActive) {
      return { valid: false, message: "Referrer account is not active" };
    }

    return {
      valid: true,
      userId,
      referrerName: userData.name,
    };
  } catch (error) {
    console.error("Error validating referral code:", error);
    return { valid: false, message: "Error validating code" };
  }
};

/**
 * Get user statistics
 */
export const getUserStats = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("User not found");
    }

    return userSnap.data();
  } catch (error) {
    console.error("Error getting user stats:", error);
    throw error;
  }
};
