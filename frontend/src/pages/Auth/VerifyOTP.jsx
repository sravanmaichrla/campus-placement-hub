// src/components/auth/VerifyOTP.jsx

import { tpoVerifyOTP, verifyOTP } from "../../services/api"; // Import the API functions
import { useLocation, useNavigate } from "react-router-dom";

import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";

const VerifyOTP = ({role}) => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Get email from previous registration step (passed via location state)
  const email = location.state?.email || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP");
      setLoading(false);
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      // Use the appropriate API function based on role
      const apiCall = role === "student" ? verifyOTP : tpoVerifyOTP;
      console.log({ email, otp });
      const response = await apiCall({ email, otp });

      const { access_token, user, message } = response.data;
      setSuccess(message);
      toast.success(message);

      // Log in the user using AuthContext
      login(user, access_token);

      // Navigate based on role
      setTimeout(() => {
        if (role === "student") {
          navigate("/student/dashboard");
        } else if (role === "admin" || role === "cdpc") {
          navigate("/auth/tpo/dashboard");
        }
      }, 1000); // Delay for user to see success message
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to verify OTP. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Animation variants to match Register.jsx
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md"
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-600">
          Verify Your OTP
        </h2>
        <motion.p
          variants={itemVariants}
          className="text-gray-600 mb-6 text-center"
        >
          An OTP has been sent to {email}. Please enter it below.
        </motion.p>

        {error && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center"
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-green-100 text-green-700 p-3 rounded mb-4 text-center"
          >
            {success}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div variants={itemVariants} className="mb-4">
            <label
              htmlFor="otp"
              className="block text-sm font-medium text-gray-700"
            >
              OTP <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className={`mt-1 block w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              disabled={loading}
              required
            />
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-xs mt-1"
              >
                {error}
              </motion.p>
            )}
          </motion.div>

          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </motion.button>
        </form>

        <motion.p
          variants={itemVariants}
          className="mt-4 text-center text-sm text-gray-600"
        >
          Didn't receive an OTP?{" "}
          <button
            onClick={() =>
              navigate(role === "student" ? "/register" : "/tpo/register", {
                state: { email },
              })
            }
            className="text-blue-600 hover:underline"
            disabled={loading}
          >
            Resend OTP
          </button>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default VerifyOTP;