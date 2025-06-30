// src/pages/Auth/Register.jsx

import { motion } from "framer-motion";
import { register } from "../../services/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    reg_no: "",
    degree: "",
    specialization: "",
    password: "",
    dob: "",
    gender: "",
    contact_no: "",
    backlogs: "",
    batch: "",
    skills: "",
    current_gpa: "",
    resume_url: "",
    certificate_urls: "",
    picture: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Required fields from backend
  const requiredFields = [
    "email",
    "first_name",
    "last_name",
    "reg_no",
    "degree",
    "specialization",
    "password",
    "dob",
    "gender",
    "current_gpa",
    "contact_no",
    "backlogs",
  ];

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
    if (name === "email" && !/^\d{2}33(1A|5A)(0[1-58]|08|12)[A-Z0-9]{2}@mvgrce\.edu\.in$/.test(value)) {
      setErrors((prev) => ({ ...prev, email: "Please use a valid MVGRCE campus email" }));
    }
    if (name === "contact_no" && value && !/^\d{10}$/.test(value)) {
      setErrors((prev) => ({ ...prev, contact_no: "Contact number must be 10 digits" }));
    }
    if (name === "current_gpa" && value && (isNaN(value) || value < 0 || value > 10)) {
      setErrors((prev) => ({ ...prev, current_gpa: "GPA must be between 0 and 10" }));
    }
    if (name === "backlogs" && value && (isNaN(value) || value < 0)) {
      setErrors((prev) => ({ ...prev, backlogs: "Backlogs must be a non-negative number" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    requiredFields.forEach((field) => {
      if (!formData[field].trim()) {
        newErrors[field] = `${field.replace("_", " ")} is required`;
      }
    });
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
      await register(formData);
      toast.success("OTP sent to your email!");
      navigate("/verify-otp", { state: { email: formData.email } });
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
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
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl"
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-600">Student Registration</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(formData).map((field) => (
              <motion.div key={field} variants={itemVariants} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                  {field.replace("_", " ")}
                  {requiredFields.includes(field) && <span className="text-red-500">*</span>}
                </label>
                {field === "gender" ? (
                  <select
                    name={field}
                    value={formData[field]}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : field === "skills" ? (
                  <textarea
                    name={field}
                    value={formData[field]}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter skills (comma-separated)"
                    rows="3"
                  />
                ) : (
                  <input
                    type={
                      field === "password"
                        ? "password"
                        : field === "dob"
                        ? "date"
                        : field === "backlogs" || field === "current_gpa"
                        ? "number"
                        : "text"
                    }
                    name={field}
                    value={formData[field]}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[field] ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder={`Enter ${field.replace("_", " ")}`}
                    required={requiredFields.includes(field)}
                    disabled={loading}
                    step={field === "current_gpa" ? "0.1" : undefined}
                    min={field === "backlogs" || field === "current_gpa" ? "0" : undefined}
                    max={field === "current_gpa" ? "10" : undefined}
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
          <a href="/login" className="text-blue-600 hover:underline">
            Login here
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Register;