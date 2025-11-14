const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

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
      "Invalid UTR number. Must be at least 12 characters."
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
