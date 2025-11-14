import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  AlertCircle,
  CheckCircle,
  Smartphone,
  Copy,
  Check,
  Shield,
  Loader,
  CreditCard,
  QrCode,
} from "lucide-react";
import { formatCurrency } from "../../utils/helpers";
import { CONSTANTS } from "../../utils/constants";
import { processActivationPayment } from "../../firebase/functions";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const ActivateAccount = () => {
  const { userData, refreshUserData } = useAuth();
  const navigate = useNavigate();

  const [utrNumber, setUtrNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [processing, setProcessing] = useState(false);

  const hasReferrer = userData?.referrerId ? true : false;

  // Distribution calculation
  const distribution = hasReferrer
    ? { referrer: 10, admin: 10, user: 0 }
    : { admin: 10, user: 10, referrer: 0 };

  const handleCopyUPI = async () => {
    try {
      await navigator.clipboard.writeText(CONSTANTS.ADMIN_UPI_ID);
      setCopied(true);
      toast.success("UPI ID copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy UPI ID");
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();

    if (!utrNumber || utrNumber.length < 12) {
      toast.error(
        "Please enter a valid UTR/Transaction ID (minimum 12 characters)"
      );
      return;
    }

    setLoading(true);
    setProcessing(true);

    try {
      // Simulate verification delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Process payment
      const result = await processActivationPayment(
        userData.id,
        CONSTANTS.ACTIVATION_AMOUNT,
        {
          utrNumber: utrNumber.toUpperCase(),
          upiId: CONSTANTS.ADMIN_UPI_ID,
          method: "UPI",
        }
      );

      toast.success(result.message);
      await refreshUserData();

      // Redirect to dashboard
      setTimeout(() => {
        navigate("/user/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(
        error.message || "Payment verification failed. Please try again."
      );
      setProcessing(false);
    } finally {
      setLoading(false);
    }
  };

  if (processing) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <div className="relative">
            <Loader className="h-16 w-16 text-primary-600 mx-auto mb-4 animate-spin" />
            <CheckCircle className="h-6 w-6 text-green-500 absolute top-0 right-1/2 transform translate-x-1/2" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Verifying Payment
          </h3>
          <p className="text-gray-600">
            Please wait while we verify your payment...
          </p>
          <p className="text-sm text-gray-500 mt-2">
            This may take a few moments
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-4 rounded-full">
            <Shield className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">
              Activate Your Referral Account
            </h2>
            <p className="text-primary-100">
              Simple UPI payment to unlock referral features
            </p>
          </div>
        </div>
      </div>

      {/* Payment Breakdown */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          💰 Payment Breakdown
        </h3>
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-gray-300">
              <span className="text-gray-700 font-semibold">
                Activation Fee
              </span>
              <span className="text-3xl font-bold text-primary-600">
                {formatCurrency(CONSTANTS.ACTIVATION_AMOUNT)}
              </span>
            </div>
            <div className="space-y-2">
              {hasReferrer ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">→ Your Referrer Bonus</span>
                    <span className="font-semibold text-green-600">
                      ₹{distribution.referrer}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">→ Platform Fee</span>
                    <span className="font-semibold text-blue-600">
                      ₹{distribution.admin}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">→ Your Wallet</span>
                    <span className="font-semibold text-gray-600">
                      ₹{distribution.user}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">→ Your Wallet</span>
                    <span className="font-semibold text-green-600">
                      ₹{distribution.user}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">→ Platform Fee</span>
                    <span className="font-semibold text-blue-600">
                      ₹{distribution.admin}
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-yellow-800">
                <strong>🎁 Your Benefit:</strong>{" "}
                {hasReferrer
                  ? "Get referral system activated to earn ₹10 per referral!"
                  : "Get ₹10 in wallet + referral system to earn more!"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* UPI QR Code Section */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <QrCode className="h-5 w-5 mr-2 text-primary-600" />
            Scan QR Code
          </h3>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 text-center">
            {/* QR Code Image */}
            <div className="bg-white p-4 rounded-xl inline-block mb-4 shadow-lg">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${CONSTANTS.ADMIN_UPI_ID}&pn=ReferAndEarn&am=${CONSTANTS.ACTIVATION_AMOUNT}&cu=INR`}
                alt="UPI QR Code"
                className="w-48 h-48"
              />
            </div>

            <p className="text-sm text-gray-700 mb-2">Scan with any UPI app</p>
            <div className="flex justify-center space-x-2 flex-wrap">
              <span className="bg-white px-3 py-1 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
                GPay
              </span>
              <span className="bg-white px-3 py-1 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
                PhonePe
              </span>
              <span className="bg-white px-3 py-1 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
                Paytm
              </span>
              <span className="bg-white px-3 py-1 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
                BHIM
              </span>
            </div>
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> After scanning, amount (₹20) will be
              auto-filled
            </p>
          </div>
        </div>

        {/* UPI ID Section */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Smartphone className="h-5 w-5 mr-2 text-primary-600" />
            Or Pay via UPI ID
          </h3>

          <div className="space-y-4">
            {/* UPI ID Display */}
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-2 font-semibold">
                UPI ID:
              </p>
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                <span className="text-xl font-mono font-bold text-gray-900 break-all">
                  {CONSTANTS.ADMIN_UPI_ID}
                </span>
                <button
                  onClick={handleCopyUPI}
                  className="ml-2 bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg transition flex-shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Amount Display */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1 font-semibold">
                Amount to Pay:
              </p>
              <p className="text-3xl font-bold text-green-700">
                {formatCurrency(CONSTANTS.ACTIVATION_AMOUNT)}
              </p>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <span className="bg-primary-100 text-primary-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-sm text-gray-700">Open any UPI app</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="bg-primary-100 text-primary-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-sm text-gray-700">
                  Send ₹20 to above UPI ID
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="bg-primary-100 text-primary-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  3
                </span>
                <p className="text-sm text-gray-700">Copy UTR/Transaction ID</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="bg-primary-100 text-primary-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  4
                </span>
                <p className="text-sm text-gray-700">
                  Enter it below to activate
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UTR Verification Form */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          ✅ Verify Your Payment
        </h3>

        <form onSubmit={handleSubmitPayment} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">
                  Where to find UTR/Transaction ID?
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Open your UPI app transaction history</li>
                  <li>Find the ₹20 payment you just made</li>
                  <li>Look for "UTR" or "Transaction ID" (12 digits)</li>
                  <li>Copy and paste it below</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              UTR / Transaction ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
              className="input-field font-mono uppercase text-lg"
              placeholder="Enter 12-digit UTR number"
              maxLength="20"
              required
            />
            <p className="text-xs text-gray-500 mt-2">Example: 123456789012</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Important:</strong> Make sure you have completed the
              UPI payment before submitting. Wrong UTR will result in activation
              failure.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || utrNumber.length < 12}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-lg py-3"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                Verifying Payment...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <CheckCircle className="mr-2 h-5 w-5" />
                Verify & Activate Account
              </span>
            )}
          </button>
        </form>
      </div>

      {/* Security Badge */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-green-600" />
            <span>🔒 Secure Payment</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-gray-300"></div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>✓ Instant Activation</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivateAccount;
