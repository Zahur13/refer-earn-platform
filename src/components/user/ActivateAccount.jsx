import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { submitActivationRequest } from "../../api/vercelFunctions";
import {
  AlertCircle,
  CheckCircle,
  Smartphone,
  Copy,
  Check,
  Shield,
  Loader,
  QrCode,
} from "lucide-react";
import { formatCurrency } from "../../utils/helpers";
import { CONSTANTS } from "../../utils/constants";
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
      console.log("🚀 Submitting activation request...");
      // console.log("User ID:", userData.id);
      // console.log("UTR:", utrNumber);

      // ✅ Call Vercel API
      const result = await submitActivationRequest(utrNumber.toUpperCase());

      // console.log("✅ API Response:", result);

      toast.success(
        result.message || "Activation request submitted successfully!"
      );

      await refreshUserData();

      setTimeout(() => {
        navigate("/user/dashboard");
      }, 2000);
    } catch (error) {
      console.error("❌ Submission Error:", error);

      let errorMessage =
        "Failed to submit activation request. Please try again.";

      if (error.message.includes("already have a pending")) {
        errorMessage =
          "You already have a pending activation request. Please wait for admin approval.";
      } else if (error.message.includes("already activated")) {
        errorMessage = "Your account is already activated!";
      } else if (error.message.includes("already been used")) {
        errorMessage = "This UTR number has already been used.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      setProcessing(false);
    } finally {
      setLoading(false);
    }
  };

  // Check if already activated
  if (userData?.isReferralActive) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="py-12 text-center card">
          <CheckCircle className="mx-auto mb-4 w-16 h-16 text-green-500" />
          <h3 className="mb-2 text-xl font-bold text-gray-900">
            Account Already Activated!
          </h3>
          <p className="mb-4 text-gray-600">
            Your referral account is active. Start sharing your code to earn!
          </p>
          <button
            onClick={() => navigate("/user/dashboard")}
            className="btn-primary"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (processing) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="py-12 text-center card">
          <div className="relative">
            <Loader className="mx-auto mb-4 w-16 h-16 animate-spin text-primary-600" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-900">
            Submitting Request
          </h3>
          <p className="text-gray-600">
            Please wait while we submit your activation request...
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Admin will verify your payment shortly
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6 max-w-4xl">
      {/* Header */}
      <div className="text-white bg-gradient-to-r card from-primary-600 to-primary-700">
        <div className="flex items-center space-x-4">
          <div className="p-4 rounded-full bg-white/20">
            <Shield className="w-8 h-8" />
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
        <h3 className="mb-4 text-xl font-bold text-gray-900">
          💰 Payment Breakdown
        </h3>
        <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-gray-300">
              <span className="font-semibold text-gray-700">
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
            <div className="p-3 mt-4 bg-yellow-50 rounded-lg border border-yellow-200">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* UPI QR Code Section */}
        <div className="card">
          <h3 className="flex items-center mb-4 text-lg font-bold text-gray-900">
            <QrCode className="mr-2 w-5 h-5 text-primary-600" />
            Scan QR Code
          </h3>

          <div className="p-6 text-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
            {/* QR Code Image */}
            <div className="inline-block p-4 mb-4 bg-white rounded-xl shadow-lg">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${CONSTANTS.ADMIN_UPI_ID}&pn=ReferAndEarn&am=${CONSTANTS.ACTIVATION_AMOUNT}&cu=INR`}
                alt="UPI QR Code"
                className="w-48 h-48"
              />
            </div>

            <p className="mb-2 text-sm text-gray-700">Scan with any UPI app</p>
            <div className="flex flex-wrap justify-center space-x-2">
              <span className="px-3 py-1 text-xs font-semibold text-gray-700 bg-white rounded-full shadow-sm">
                GPay
              </span>
              <span className="px-3 py-1 text-xs font-semibold text-gray-700 bg-white rounded-full shadow-sm">
                PhonePe
              </span>
              <span className="px-3 py-1 text-xs font-semibold text-gray-700 bg-white rounded-full shadow-sm">
                Paytm
              </span>
              <span className="px-3 py-1 text-xs font-semibold text-gray-700 bg-white rounded-full shadow-sm">
                BHIM
              </span>
            </div>
          </div>

          <div className="p-3 mt-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> After scanning, amount (₹20) will be
              auto-filled
            </p>
          </div>
        </div>

        {/* UPI ID Section */}
        <div className="card">
          <h3 className="flex items-center mb-4 text-lg font-bold text-gray-900">
            <Smartphone className="mr-2 w-5 h-5 text-primary-600" />
            Or Pay via UPI ID
          </h3>

          <div className="space-y-4">
            {/* UPI ID Display */}
            <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-300 border-dashed">
              <p className="mb-2 text-xs font-semibold text-gray-600">
                UPI ID:
              </p>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                <span className="font-mono text-xl font-bold text-gray-900 break-all">
                  {CONSTANTS.ADMIN_UPI_ID}
                </span>
                <button
                  onClick={handleCopyUPI}
                  className="flex-shrink-0 p-2 ml-2 text-white rounded-lg transition bg-primary-600 hover:bg-primary-700"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Amount Display */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="mb-1 text-xs font-semibold text-gray-600">
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
                  Enter it below and submit
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UTR Verification Form */}
      <div className="card">
        <h3 className="mb-4 text-xl font-bold text-gray-900">
          ✅ Submit Your Payment Details
        </h3>

        <form onSubmit={handleSubmitPayment} className="space-y-4">
          <div className="grid grid-cols-1 gap-6 p-4 mb-4 bg-blue-50 rounded-lg border border-blue-200 lg:grid-cols-2">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="mb-1 font-semibold">
                  Where to find UTR/Transaction ID?
                </p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Open your UPI app transaction history</li>
                  <li>Find the ₹20 payment you just made</li>
                  <li>Look for "UTR" or "Transaction ID" (12 digits)</li>
                  <li>Copy and paste it below</li>
                </ul>
              </div>
            </div>
            <div>
              <img className="w-60" src="/upi.png" alt="" />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              UTR / Transaction ID <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
              className="font-mono text-lg uppercase input-field"
              placeholder="Enter 12-digit UTR number"
              maxLength="20"
              required
            />
            <p className="mt-2 text-xs text-gray-500">Example: 123456789012</p>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Important:</strong> Make sure you have completed the
              UPI payment before submitting. Admin will verify your UTR and
              approve your activation.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || utrNumber.length < 12}
            className="py-3 w-full text-lg btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex justify-center items-center">
                <Loader className="mr-3 -ml-1 w-5 h-5 text-white animate-spin" />
                Submitting Request...
              </span>
            ) : (
              <span className="flex justify-center items-center">
                <CheckCircle className="mr-2 w-5 h-5" />
                Submit for Admin Approval
              </span>
            )}
          </button>
        </form>
      </div>

      {/* Security Badge */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex justify-center items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-green-600" />
            <span>🔒 Secure Payment</span>
          </div>
          <div className="hidden w-px h-4 bg-gray-300 sm:block"></div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>✓ Admin Verification</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivateAccount;
