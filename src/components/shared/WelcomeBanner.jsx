import React, { useState, useEffect } from "react";
import { X, Sparkles, Gift, Users, TrendingUp } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const WelcomeBanner = () => {
  const { userData } = useAuth();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user is new (created within last 24 hours)
    if (userData && userData.createdAt) {
      const createdAt = userData.createdAt.toDate();
      const now = new Date();
      const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);

      // Show banner if user is less than 24 hours old and hasn't dismissed it
      const dismissed = localStorage.getItem(`welcomeBanner_${userData.id}`);
      if (hoursSinceCreation < 24 && !dismissed) {
        setShowBanner(true);
      }
    }
  }, [userData]);

  const handleDismiss = () => {
    localStorage.setItem(`welcomeBanner_${userData.id}`, "true");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white rounded-xl shadow-2xl overflow-hidden mb-6">
      <div className="relative p-6 md:p-8">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-1 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="flex items-start space-x-4">
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
            <Sparkles className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Welcome, {userData?.name}! 🎉
            </h2>
            <p className="text-purple-100 mb-4">
              You're now part of our refer & earn community! Here's how to get
              started:
            </p>

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Gift className="h-5 w-5 text-yellow-300" />
                  <span className="font-semibold">Step 1</span>
                </div>
                <p className="text-sm text-purple-100">
                  {userData?.isReferralActive
                    ? "✓ Account Activated!"
                    : "Activate your account with ₹20"}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-5 w-5 text-green-300" />
                  <span className="font-semibold">Step 2</span>
                </div>
                <p className="text-sm text-purple-100">
                  Share your referral code with friends
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-300" />
                  <span className="font-semibold">Step 3</span>
                </div>
                <p className="text-sm text-purple-100">
                  Earn ₹10 for every friend who activates!
                </p>
              </div>
            </div>

            {/* CTA */}
            {!userData?.isReferralActive && (
              <div className="mt-6">
                <a
                  href="/user/activate"
                  className="inline-block bg-white text-purple-600 hover:bg-purple-50 font-bold py-3 px-6 rounded-lg transition shadow-lg"
                >
                  Activate Now & Start Earning
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-purple-800/30 rounded-full blur-2xl"></div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
