import React, { useEffect, useState } from "react";
import { TrendingUp, Users, DollarSign, Gift } from "lucide-react";

const SplashScreen = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Progress animation - Complete in 6 seconds
    const duration = 6000; // 6 seconds total
    const interval = 50; // Update every 50ms
    const increment = (100 / duration) * interval; // Calculate increment per interval

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + increment;

        if (newProgress >= 100) {
          clearInterval(progressInterval);
          return 100;
        }

        return newProgress;
      });
    }, interval);

    // Stage animations
    const stageTimers = [
      setTimeout(() => setStage(1), 300),
      setTimeout(() => setStage(2), 1000),
      setTimeout(() => setStage(3), 1800),
      setTimeout(() => setStage(4), 2600),
    ];

    // Finish when progress reaches 100% (after 6 seconds)
    const finishTimer = setTimeout(() => {
      onFinish();
    }, duration + 200); // Small delay to ensure smooth transition

    return () => {
      clearInterval(progressInterval);
      stageTimers.forEach((timer) => clearTimeout(timer));
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div className="flex overflow-hidden fixed inset-0 z-50 justify-center items-center bg-gradient-to-br via-purple-600 to-pink-500 from-primary-600">
      {/* Animated Background Circles */}
      <div className="overflow-hidden absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl animate-pulse bg-white/10"></div>
        <div
          className="absolute right-0 bottom-0 w-96 h-96 rounded-full blur-3xl animate-pulse bg-white/10"
          style={{ animationDelay: "1s" }}
        ></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full blur-2xl animate-ping transform -translate-x-1/2 -translate-y-1/2 bg-white/5"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-4 text-center">
        {/* Logo Animation */}
        <div
          className={`mb-8 transform transition-all duration-700 ${
            stage >= 1 ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        >
          <div className="inline-flex justify-center items-center mb-6 w-24 h-24 bg-white rounded-full shadow-2xl animate-bounce">
            <TrendingUp className="w-12 h-12 text-primary-600" />
          </div>
        </div>

        {/* Brand Name */}
        <div
          className={`mb-8 transform transition-all duration-700 delay-300 ${
            stage >= 2 ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <h1 className="mb-2 text-5xl font-extrabold tracking-tight text-white md:text-6xl">
            Refer & Earn
          </h1>
          <p className="text-xl font-light md:text-2xl text-white/90">
            Your Growth Platform
          </p>
        </div>

        {/* Feature Icons */}
        <div
          className={`flex justify-center space-x-6 mb-8 transform transition-all duration-700 delay-500 ${
            stage >= 3 ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="flex flex-col items-center space-y-2">
            <div className="p-3 rounded-full backdrop-blur-sm bg-white/20">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-white/80">Refer Friends</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="p-3 rounded-full backdrop-blur-sm bg-white/20">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-white/80">Earn Money</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="p-3 rounded-full backdrop-blur-sm bg-white/20">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-white/80">Get Rewards</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          className={`max-w-md mx-auto transform transition-all duration-700 delay-700 ${
            stage >= 4 ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="w-full bg-white/20 rounded-full h-2.5 backdrop-blur-sm overflow-hidden shadow-lg">
            <div
              className="relative h-full bg-gradient-to-r from-white via-blue-100 to-white rounded-full shadow-lg transition-all duration-200 ease-linear"
              style={{ width: `${Math.min(progress, 100)}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent via-white/40 animate-shimmer"></div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-3">
            <p className="text-sm text-white/80">Loading your experience...</p>
            <p className="text-sm font-semibold text-white">
              {Math.round(progress)}%
            </p>
          </div>
        </div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/30 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default SplashScreen;
