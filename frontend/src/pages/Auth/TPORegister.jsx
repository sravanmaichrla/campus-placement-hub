// src/pages/Auth/TPORegister.jsx

import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { tpoRegister } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const TPORegister = () => {
  const [formData, setFormData] = useState({
    admin_name: "",
    email: "",
    password: "",
    role: "admin",
    department: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Required fields for TPO registration
  const requiredFields = ["admin_name", "email", "password", "role", "department"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Real-time validation
    if (requiredFields.includes(name) && !value.trim()) {
      setErrors((prev) => ({ ...prev, [name]: `${name.replace("_", " ")} is required` }));
    } else {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Additional validation
    if (name === "email" && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email address" }));
    }
    if (name === "password" && value && value.length < 8) {
      setErrors((prev) => ({ ...prev, password: "Password must be at least 8 characters long" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    requiredFields.forEach((field) => {
      if (!formData[field].trim()) {
        newErrors[field] = `${field.replace("_", " ")} is required`;
      }
    });

    if (formData.email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (formData.password && formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setLoading(true);
    try {
      await tpoRegister(formData);
      toast.success("TPO registered successfully! Please login.");
      navigate("/tpo/verify-otp",{ state: { email: formData.email } });
    } catch (error) {
      toast.error(error.response?.data?.message || "TPO Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
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
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-600">TPO Registration</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {Object.keys(formData).map((field) => (
              <motion.div key={field} variants={itemVariants} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                  {field.replace("_", " ")}
                  {requiredFields.includes(field) && <span className="text-red-500">*</span>}
                </label>
                {field === "role" ? (
                  <select
                    name={field}
                    value={formData[field]}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[field] ? "border-red-500" : "border-gray-300"
                    }`}
                    required
                    disabled={loading}
                  >
                    <option value="admin">Admin</option>
                    <option value="cdpc">CDPC</option>
                  </select>
                ) : (
                  <input
                    type={field === "password" ? "password" : "text"}
                    name={field}
                    value={formData[field]}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[field] ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder={`Enter ${field.replace("_", " ")}`}
                    required={requiredFields.includes(field)}
                    disabled={loading}
                  />
                )}
                {errors[field] && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    {errors[field]}
                  </motion.p>
                )}
              </motion.div>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Registering..." : "Register"}
          </motion.button>
        </form>
        <motion.p
          variants={itemVariants}
          className="mt-4 text-center text-sm text-gray-600"
        >
          Already have an account?{" "}
          <a href="/tpo/login" className="text-blue-600 hover:underline">
            Login here
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default TPORegister;