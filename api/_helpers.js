// api/_helpers.js
const { db } = require("./_firebase-admin");

const CONSTANTS = {
  ACTIVATION_AMOUNT: 20,
  REFERRAL_BONUS: 10,
  ADMIN_SHARE: 10,
  MIN_WITHDRAWAL: 100,
  MAX_WITHDRAWAL: 10000,
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

function generateReferralCode(name, uid) {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const namePrefix = name.substring(0, 3).toUpperCase();
  const uidSuffix = uid.substring(0, 4).toUpperCase();
  return `${namePrefix}${randomNum}${uidSuffix}`;
}

async function verifyAuth(req) {
  const token = req.headers.authorization?.split("Bearer ")[1];

  if (!token) {
    throw new Error("No authentication token provided");
  }

  const { auth } = require("./_firebase-admin");
  const decodedToken = await auth.verifyIdToken(token);
  return decodedToken;
}

async function verifyAdmin(req) {
  const decodedToken = await verifyAuth(req);
  const userDoc = await db.collection("users").doc(decodedToken.uid).get();

  if (!userDoc.exists || userDoc.data().role !== "admin") {
    throw new Error("Admin access required");
  }

  return decodedToken;
}

module.exports = {
  CONSTANTS,
  getAdminUserId,
  generateReferralCode,
  verifyAuth,
  verifyAdmin,
};
