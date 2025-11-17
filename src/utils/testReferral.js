import { db, auth } from "../firebase/config";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

// Test function to verify referral code
export const testReferralCode = async (code) => {
  console.log("🧪 Testing referral code:", code);

  try {
    // Check if code exists
    const codeRef = doc(db, "referralCodes", code.toUpperCase());
    const codeSnap = await getDoc(codeRef);

    if (!codeSnap.exists()) {
      console.log("❌ Code does not exist in referralCodes collection");
      return false;
    }

    // console.log("✅ Code found:", codeSnap.data());

    // Check if user exists
    const userId = codeSnap.data().userId;
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.log("❌ User does not exist");
      return false;
    }

    // console.log("✅ User found:", userSnap.data());

    if (!userSnap.data().isReferralActive) {
      console.log("⚠️ User account not active");
      return false;
    }

    console.log("✅ Referral code is valid!");
    return true;
  } catch (error) {
    console.error("❌ Error:", error);
    return false;
  }
};

// Create a test user with proper referral code setup
export const createTestUserWithReferral = async () => {
  try {
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = "test123";

    // console.log("Creating test user:", testEmail);

    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      testEmail,
      testPassword
    );

    const user = userCredential.user;
    const referralCode = `TEST${Math.floor(1000 + Math.random() * 9000)}`;

    // Create user document
    await setDoc(doc(db, "users", user.uid), {
      name: "Test User",
      email: testEmail,
      phone: "9999999999",
      referralCode: referralCode,
      referredBy: null,
      referrerId: null,
      isReferralActive: true, // Make active so it can be used as referrer
      wallet: {
        balance: 100, // Give some balance
        lastUpdated: serverTimestamp(),
      },
      stats: {
        totalReferrals: 0,
        activeReferrals: 0,
        totalEarnings: 0,
      },
      role: "user",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create referral code mapping
    await setDoc(doc(db, "referralCodes", referralCode), {
      userId: user.uid,
      createdAt: serverTimestamp(),
    });

    console.log("✅ Test user created!");
    // console.log("Email:", testEmail);
    // console.log("Password:", testPassword);
    //  console.log("Referral Code:", referralCode);

    return { email: testEmail, password: testPassword, referralCode };
  } catch (error) {
    console.error("Error creating test user:", error);
    throw error;
  }
};
