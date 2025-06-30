import { Box, CircularProgress } from "@mui/material"; // Import CircularProgress for loading spinner

import Sidebar from "../../components/common/Sidebar";
import axios from "axios";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const api = axios.create({
  baseURL: "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const initialState = {
  role: "",
  job_location: "",
  job_description: "",
  package: 0.0,
  date_of_interview: "",
  last_date_to_apply: "",
  gender_eligibility: "all",
  max_backlogs: 0,
  min_gpa: 0.0,
  company_name: "",
  company_type: "",
  website: "",
  description: "",
  contact_person: "",
  address: "",
  service_agreement: "",
  links_for_registrations: "",
  files: null,
};

const requiredFields = [
  "role",
  "job_location",
  "job_description",
  "package",
  "date_of_interview",
  "last_date_to_apply",
  "gender_eligibility",
  "max_backlogs",
  "min_gpa",
  "company_name",
  "company_type",
  "website",
  "description",
];

const validateField = (name, value) => {
  if (requiredFields.includes(name) && !value.toString().trim()) {
    return `${name.replace("_", " ")} is required`;
  }

  const numberFields = ["package", "max_backlogs", "min_gpa"];
  if (numberFields.includes(name)) {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return `${name.replace("_", " ")} must be a number`;
    }
    if (name === "package" && numValue <= 0) return "Package must be a positive number";
    if (name === "max_backlogs" && numValue < 0) return "Max backlogs must be a non-negative number";
    if (name === "min_gpa" && (numValue < 0 || numValue > 10)) return "Min GPA must be between 0 and 10";
  }

  const urlFields = ["website", "links_for_registrations"];
  if (urlFields.includes(name) && value && !/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/.test(value)) {
    return "Please enter a valid URL";
  }

  return "";
};

const PostJob = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (["package", "min_gpa"].includes(name)) {
      newValue = value ? parseFloat(value) : "";
    }

    setFormData({ ...formData, [name]: newValue });
    const error = validateField(name, newValue);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && !["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
      setErrors((prev) => ({ ...prev, file: "File must be a PDF, JPEG, or PNG" }));
      setFormData({ ...formData, file: null });
      return;
    }
    setFormData({ ...formData, file });
    setErrors((prev) => ({ ...prev, file: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      if (key === "files") return;
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
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

    const formDataToSend = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (key === "date_of_interview" || key === "last_date_to_apply") {
        value = value ? new Date(value).toISOString().split("T")[0] : "";
      }

      if (["package", "max_backlogs", "min_gpa"].includes(key)) {
        value = Number(value) || 0;
      }

      if (key === "files" && value) {
        formDataToSend.append("files", value);
      } else if (key !== "files") {
        formDataToSend.append(key, value);
      }
    });

    try {
      await api.post("/job/create", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Job posted successfully!");
      setFormData(initialState);
      // Add a delay to allow the toast to be visible before navigating
      setTimeout(() => {
        navigate("/tpo/dashboard");
      }, 2000); // 2-second delay
    } catch (error) {
      console.error("API Error:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to post job");
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
    <div className="min-h-screen bg-gray-100 pt-20">
      <Sidebar />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto p-6 max-w-4xl"
      >
        <motion.h1
          variants={itemVariants}
          className="text-3xl font-bold mb-6 text-center text-blue-600"
        >
          Post a Job
        </motion.h1>
        <motion.div
          variants={itemVariants}
          className="bg-white p-8 rounded-lg shadow-lg relative"
        >
          {/* Loading Overlay */}
          {loading && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: "rgba(255, 255, 255, 0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
            >
              <CircularProgress size={60} />
            </Box>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Job Details Section */}
              <motion.div variants={itemVariants} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.role ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter job role"
                  required
                  disabled={loading}
                />
                {errors.role && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    {errors.role}
                  </motion.p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                  Job Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="job_location"
                  value={formData.job_location}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.job_location ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter job location"
                  required
                  disabled={loading}
                />
                {errors.job_location && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    {errors.job_location}
                  </motion.p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="mb-4 col-span-2">
                <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="job_description"
                  value={formData.job_description}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.job_description ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter job description"
                  rows="3"
                  required
                  disabled={loading}
                />
                {errors.job_description && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    {errors.job_description}
                  </motion.p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                  Package (LPA) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="package"
                  value={formData.package}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.package ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter package in LPA"
                  required
                  min="0"
                  step="0.1"
                  disabled={loading}
                />
                {errors.package && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    {errors.package}
                  </motion.p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                  Date of Interview <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date_of_interview"
                  value={formData.date_of_interview}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.date_of_interview ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                  disabled={loading}
                />
                {errors.date_of_interview && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    {errors.date_of_interview}
                  </motion.p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                  Last Date to Apply <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="last_date_to_apply"
                  value={formData.last_date_to_apply}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.last_date_to_apply ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                  disabled={loading}
                />
                {errors.last_date_to_apply && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    {errors.last_date_to_apply}
                  </motion.p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                  Gender Eligibility <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender_eligibility"
                  value={formData.gender_eligibility}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.gender_eligibility ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                  disabled={loading}
                >
                  <option value="all">All</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {errors.gender_eligibility && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    {errors.gender_eligibility}
                  </motion.p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                  Max Backlogs <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="max_backlogs"
                  value={formData.max_backlogs}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.max_backlogs ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter max backlogs"
                  required
                  min="0"
                  disabled={loading}
                />
                {errors.max_backlogs && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    {errors.max_backlogs}
                  </motion.p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                  Min GPA <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="min_gpa"
                  value={formData.min_gpa}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.min_gpa ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter minimum GPA"
                  required
                  min="0"
                  max="10"
                  step="0.1"
                  disabled={loading}
                />
                {errors.min_gpa && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    {errors.min_gpa}
                  </motion.p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                  Service Agreement
                </label>
                <input
                  type="text"
                  name="service_agreement"
                  value={formData.service_agreement}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.service_agreement ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter service agreement details"
                  disabled={loading}
                />
                {errors.service_agreement && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    {errors.service_agreement}
                  </motion.p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                  Links for Registrations
                </label>
                <input
                  type="text"
                  name="links_for_registrations"
                  value={formData.links_for_registrations}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.links_for_registrations ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter registration link (optional)"
                  disabled={loading}
                />
                {errors.links_for_registrations && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    {errors.links_for_registrations}
                  </motion.p>
                )}
              </motion.div>

              {/* Company Details Section */}
              <motion.div variants={itemVariants} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.company_name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter company name"
                  required
                  disabled={loading}
                />
                {errors.company_name && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    {errors.company_name}
                  </motion.p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                  Company Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="company_type"
                  value={formData.company_type}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.company_type ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter company type"
                  required
                  disabled={loading}
                />
                {errors.company_type && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    {errors.company_type}
                  </motion.p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                  Website <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.website ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter company website"
                  required
                  disabled={loading}
                />
                {errors.website && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    {errors.website}
                  </motion.p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="mb-4 col-span-2">
                <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.description ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter company description"
                  rows="3"
                  required
                  disabled={loading}
                />
                {errors.description && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    {errors.description}
                  </motion.p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.contact_person ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter contact person name"
                  disabled={loading}
                />
                {errors.contact_person && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    {errors.contact_person}
                  </motion.p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.address ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter company address"
                  disabled={loading}
                />
                {errors.address && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    {errors.address}
                  </motion.p>
                )}
              </motion.div>

              {/* File Upload (Optional) */}
              <motion.div variants={itemVariants} className="mb-4 col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Files (PDF, JPEG, PNG) (Optional)
                </label>
                <input
                  type="file"
                  name="file"
                  onChange={handleFileChange}
                  className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.file ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={loading}
                />
                {errors.file && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    {errors.file}
                  </motion.p>
                )}
              </motion.div>
            </div>
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
              {loading ? "Processing..." : "Post Job"}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PostJob;