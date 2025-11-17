import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  MessageCircle,
  Mail,
  Phone,
  Send,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const Support = () => {
  const { userData } = useAuth();
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/sendSupportEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName: userData.name,
          userEmail: userData.email,
          userPhone: userData.phone || "",
          subject: formData.subject,
          message: formData.message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send message");
      }

      setSubmitted(true);
      setFormData({ subject: "", message: "" });
      toast.success(result.message);

      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error("Support form error:", error);
      toast.error(error.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto space-y-6 max-w-4xl">
      {/* Header */}
      <div className="text-white bg-gradient-to-r card from-primary-600 to-primary-700">
        <div className="flex items-center space-x-4">
          <div className="p-4 rounded-full bg-white/20">
            <MessageCircle className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">Support & Help</h2>
            <p className="text-primary-100">We're here to help you</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Contact Info Sidebar */}
        <div className="space-y-4 lg:col-span-1">
          {/* Email */}
          <div className="card">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-primary-50">
                <Mail className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Email Us</h3>
                <p className="mt-1 text-sm text-gray-600 break-all">
                  refernearnplatform@gmail.com
                </p>
                <a
                  href="mailto:refernearnplatform@gmail.com"
                  className="inline-block mt-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  Send Email →
                </a>
              </div>
            </div>
          </div>

          {/* Response Time */}
          <div className="bg-blue-50 border-blue-200 card">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <HelpCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Response Time</h3>
                <p className="mt-1 text-sm text-gray-600">
                  We typically respond within 24 hours
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Mon-Fri: 9 AM - 6 PM IST
                </p>
              </div>
            </div>
          </div>

          {/* Common Issues */}
          <div className="bg-yellow-50 border-yellow-200 card">
            <h3 className="flex items-center mb-3 font-semibold text-gray-900">
              <span className="mr-2">💡</span> Common Topics
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Account activation issues</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Payment verification</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Withdrawal requests</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Referral code problems</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="card">
            {submitted ? (
              <div className="py-12 text-center">
                <div className="inline-flex justify-center items-center mb-4 w-16 h-16 bg-green-100 rounded-full">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-gray-900">
                  Message Sent Successfully!
                </h3>
                <p className="mb-4 text-gray-600">
                  Thank you for contacting us. We've received your message and
                  will respond within 24 hours.
                </p>
                <p className="text-sm text-gray-500">
                  You'll receive our response at:{" "}
                  <strong>{userData?.email}</strong>
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 btn-primary"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <>
                <h3 className="mb-1 text-xl font-bold text-gray-900">
                  Send us a message
                </h3>
                <p className="mb-6 text-sm text-gray-600">
                  Fill out the form below and we'll get back to you as soon as
                  possible
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* User Info Display */}
                  <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 sm:grid-cols-2">
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-600">
                        Your Name
                      </label>
                      <p className="text-sm font-semibold text-gray-900">
                        {userData?.name}
                      </p>
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-600">
                        Your Email
                      </label>
                      <p className="text-sm font-semibold text-gray-900 break-all">
                        {userData?.email}
                      </p>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="e.g., Payment not verified, Withdrawal issue, etc."
                      required
                      maxLength="100"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      className="resize-none input-field"
                      rows="8"
                      placeholder="Please describe your issue or question in detail. Include any relevant information like transaction IDs, dates, etc."
                      required
                      maxLength="1000"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.message.length}/1000 characters
                    </p>
                  </div>

                  {/* Info Box */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Tip:</strong> Please provide as much detail as
                      possible to help us resolve your issue faster.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-3 w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex justify-center items-center">
                        <svg
                          className="mr-3 -ml-1 w-5 h-5 text-white animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Sending Message...
                      </span>
                    ) : (
                      <span className="flex justify-center items-center">
                        <Send className="mr-2 w-5 h-5" />
                        Send Message
                      </span>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
