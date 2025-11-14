import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase/config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  Gift,
  CheckCircle,
  XCircle,
  Loader,
  AlertCircle,
} from "lucide-react";
import {
  generateReferralCode,
  validateEmail,
  validatePhone,
} from "../../utils/helpers";

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    referralCode: searchParams.get("ref") || "",
  });
  const [loading, setLoading] = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValidation, setCodeValidation] = useState({
    isValid: null,
    message: "",
    referrerName: "",
    error: null,
  });

  // Validate referral code when it changes
  useEffect(() => {
    const trimmedCode = formData.referralCode.trim();
    if (trimmedCode && trimmedCode.length >= 3) {
      const timer = setTimeout(() => {
        validateReferralCode(trimmedCode);
      }, 500); // Debounce
      return () => clearTimeout(timer);
    } else {
      setCodeValidation({
        isValid: null,
        message: "",
        referrerName: "",
        error: null,
      });
    }
  }, [formData.referralCode]);

  const validateReferralCode = async (code) => {
    if (!code || code.trim().length < 3) {
      setCodeValidation({
        isValid: null,
        message: "",
        referrerName: "",
        error: null,
      });
      return;
    }

    setValidatingCode(true);
    const codeUpper = code.toUpperCase();
    console.log("🔍 Validating referral code:", codeUpper);

    try {
      // Step 1: Check if referral code document exists
      console.log("📄 Checking referralCodes collection...");
      const codeRef = doc(db, "referralCodes", codeUpper);
      const codeSnap = await getDoc(codeRef);

      if (!codeSnap.exists()) {
        console.log("❌ Referral code not found in collection");
        setCodeValidation({
          isValid: false,
          message: "Invalid referral code",
          referrerName: "",
          error: "Code not found",
        });
        setValidatingCode(false);
        return;
      }

      const codeData = codeSnap.data();
      console.log("✅ Referral code data:", codeData);

      // Step 2: Get referrer user data
      console.log("👤 Fetching referrer user data...");
      const referrerRef = doc(db, "users", codeData.userId);
      const referrerSnap = await getDoc(referrerRef);

      if (!referrerSnap.exists()) {
        console.log("❌ Referrer user not found");
        setCodeValidation({
          isValid: false,
          message: "Referrer account not found",
          referrerName: "",
          error: "User not found",
        });
        setValidatingCode(false);
        return;
      }

      const referrerData = referrerSnap.data();
      console.log("✅ Referrer data:", {
        name: referrerData.name,
        isActive: referrerData.isReferralActive,
      });

      // Step 3: Check if referrer is active
      if (!referrerData.isReferralActive) {
        console.log("⚠️ Referrer account not active");
        setCodeValidation({
          isValid: false,
          message: `${referrerData.name}'s account is not activated yet`,
          referrerName: referrerData.name,
          error: "Not active",
        });
        setValidatingCode(false);
        return;
      }

      // All checks passed!
      console.log("✅ Referral code is valid!");
      setCodeValidation({
        isValid: true,
        message: `You will be referred by ${referrerData.name}`,
        referrerName: referrerData.name,
        error: null,
      });
    } catch (error) {
      console.error("❌ Error validating referral code:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      let errorMessage = "Error validating code";
      if (error.code === "permission-denied") {
        errorMessage = "Permission denied. Please check Firestore rules.";
      } else if (error.code === "unavailable") {
        errorMessage = "Network error. Please check your connection.";
      }

      setCodeValidation({
        isValid: false,
        message: errorMessage,
        referrerName: "",
        error: error.message,
      });
    } finally {
      setValidatingCode(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.password
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!validateEmail(formData.email)) {
      toast.error("Please enter a valid email");
      return;
    }

    if (!validatePhone(formData.phone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // If referral code provided, must be valid
    const trimmedCode = formData.referralCode.trim();
    if (trimmedCode && codeValidation.isValid !== true) {
      toast.error("Please enter a valid referral code or leave it empty");
      return;
    }

    setLoading(true);
    console.log("📝 Starting registration...");

    try {
      let referrerId = null;
      let referredBy = null;

      // Get referrer details if code provided and valid
      if (trimmedCode && codeValidation.isValid === true) {
        const codeUpper = trimmedCode.toUpperCase();
        console.log("🔍 Using referral code:", codeUpper);

        const codeRef = doc(db, "referralCodes", codeUpper);
        const codeSnap = await getDoc(codeRef);

        if (codeSnap.exists()) {
          referrerId = codeSnap.data().userId;
          referredBy = codeUpper;
          console.log("✅ Referrer ID:", referrerId);
        }
      }

      // Create Firebase Auth user
      console.log("👤 Creating auth user...");
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;
      console.log("✅ Auth user created:", user.uid);

      // Generate unique referral code
      const myReferralCode = generateReferralCode(formData.name, user.uid);
      console.log("🎫 Generated referral code:", myReferralCode);

      // Create user document
      console.log("📄 Creating user document...");
      await setDoc(doc(db, "users", user.uid), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        referralCode: myReferralCode,
        referredBy: referredBy,
        referrerId: referrerId,
        isReferralActive: false,
        wallet: {
          balance: 0,
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
      console.log("✅ User document created");

      // Create referral code mapping
      console.log("🎫 Creating referral code mapping...");
      await setDoc(doc(db, "referralCodes", myReferralCode), {
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      console.log("✅ Referral code mapping created");

      toast.success("Account created successfully!");
      console.log("🎉 Registration complete!");

      navigate("/user/dashboard");
    } catch (error) {
      console.error("❌ Registration error:", error);

      if (error.code === "auth/email-already-in-use") {
        toast.error("Email already registered");
      } else if (error.code === "auth/weak-password") {
        toast.error("Password is too weak");
      } else if (error.code === "auth/invalid-email") {
        toast.error("Invalid email address");
      } else {
        toast.error(error.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary-600 p-3 rounded-full">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join our refer & earn platform
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="9876543210"
                  maxLength="10"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Referral Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referral Code (Optional)
              </label>
              <div className="relative">
                <Gift className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="referralCode"
                  value={formData.referralCode}
                  onChange={handleChange}
                  className={`input-field pl-10 pr-10 uppercase ${
                    codeValidation.isValid === true
                      ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                      : codeValidation.isValid === false
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  placeholder="Enter referral code"
                  maxLength="20"
                />
                {validatingCode && (
                  <Loader className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 animate-spin" />
                )}
                {!validatingCode && codeValidation.isValid === true && (
                  <CheckCircle className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />
                )}
                {!validatingCode && codeValidation.isValid === false && (
                  <XCircle className="absolute right-3 top-2.5 h-5 w-5 text-red-500" />
                )}
              </div>

              {/* Validation Message */}
              {codeValidation.message && (
                <div
                  className={`mt-2 p-2 rounded-lg text-sm ${
                    codeValidation.isValid
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {codeValidation.isValid ? (
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <span>{codeValidation.message}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
