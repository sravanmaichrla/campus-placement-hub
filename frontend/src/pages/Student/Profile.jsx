// src/pages/Student/StudentProfile.jsx

import { AcademicCapIcon, CameraIcon, DocumentTextIcon, UserIcon } from "@heroicons/react/24/outline";
import { getProfile, updateProfile } from "../../services/api";
import { useEffect, useState } from "react";

import Sidebar from "../../components/common/Sidebar";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const proUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQuVnzLad_Rij-rWhIh-cW-udMzlLzfkH2Sfw&s";
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    contact_no: "",
    dob: "",
    gender: "",
    batch: "",
    specialization: "",
    degree: "",
    skills: "",
    current_gpa: "",
    backlogs: "",
    picture: null,
    resume_url: null,
    certificate_urls: null,
  });
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewResume, setPreviewResume] = useState(null);
  const [previewCertificates, setPreviewCertificates] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProfile();
        setProfile(response.data);
        // console.log(profile);
        setFormData({
          first_name: response.data.first_name || "",
          last_name: response.data.last_name || "",
          contact_no: response.data.contact_no || "",
          dob: response.data.dob ? response.data.dob.split("T")[0] : "",
          gender: response.data.gender || "",
          batch: response.data.batch || "",
          specialization: response.data.specialization || "",
          degree: response.data.degree || "",
          skills: response.data.skills || "",
          current_gpa: response.data.current_gpa || "",
          backlogs: response.data.backlogs || "",
          picture: proUrl,
          resume_url: null,
          certificate_urls: null,
        });  
        // const fullUrl = `http://localhost:5000/uploads/${response.data.picture}`;
        console.log(response.data.certificate_urls);
        setPreviewImage(response.data.picture || fullUrl);
        setPreviewResume(response.data.resume_url || "");
        setPreviewCertificates(response.data.certificate_urls || "");
        
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load profile");
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, [field]: file });
      if (field === "picture") {
        setPreviewImage(URL.createObjectURL(file));
        console.log(previewImage);
      } else if (field === "resume_url") {
        setPreviewResume(file.name);
      } else if (field === "certificate_urls") {
        console.log(file.name);
        setPreviewCertificates(file.name);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key]) {
        data.append(key, formData[key]);
      }
    });

    try {
      const response = await updateProfile(data);
      setProfile(response.data.user);
      setEditMode(false);
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading...</div>;
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <Sidebar/>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8"
      >
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-teal-600 mb-4 sm:mb-0">Student Profile</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setEditMode(!editMode)}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
          >
            {editMode ? (
              <>
                <XMarkIcon className="w-5 h-5" /> Cancel
              </>
            ) : (
              <>
                <UserIcon className="w-5 h-5" /> Edit Profile
              </>
            )}
          </motion.button>
        </div>

        {/* Profile Overview */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center sm:items-start mb-8">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-4 sm:mb-0 sm:mr-6">
            {editMode ? (
              <div className="relative group">
                <img
                  src={profile.picture ? `http://localhost:5000/uploads/${profile.picture}`:proUrl} 
                  // alt="Profile"
                  className="w-48 h-48 rounded-full object-cover border-2 border-teal-600"
                />
                <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                  <CameraIcon className="w-8 h-8 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "picture")}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
              </div>
            ) : (
              <img
                src={profile.picture ? `http://localhost:5000/uploads/${profile.picture}`:proUrl}
                alt="Profile"
                className="w-full h-full rounded-full object-cover border-2 border-teal-600 align-middle content-center"
              />
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
              {profile.first_name} {profile.last_name}
            </h2>
            <p className="text-gray-600">Reg No: {profile.reg_no}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <p><strong>Batch:</strong> {profile.batch - 4} - {profile.batch}</p>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Contact Number:</strong> {profile.contact_no}</p>
                <p><strong>Gender:</strong> {profile.gender}</p>
              </div>
              <div>
                <p><strong>Degree:</strong> {profile.degree}</p>
                <p><strong>Specialization:</strong> {profile.specialization}</p>
                <p><strong>Department:</strong> {profile.specialization}</p>
                <p><strong>Campus:</strong> Visakhapatnam</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Edit Form or Display Details */}
        {editMode ? (
          <motion.form
            variants={itemVariants}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(formData).map((field) =>
                field !== "picture" &&
                field !== "resume_url" &&
                field !== "certificate_urls" &&
                field !== "email" &&
                field !== "reg_no" ? (
                  <div key={field} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                      {field.replace("_", " ")}
                    </label>
                    {field === "gender" ? (
                      <select
                        name={field}
                        value={formData[field]}
                        onChange={handleChange}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                        rows="3"
                        placeholder="Enter skills (comma-separated)"
                      />
                    ) : (
                      <input
                        type={
                          field === "dob"
                            ? "date"
                            : field === "backlogs" || field === "current_gpa"
                            ? "number"
                            : field === "contact_no"
                            ? "tel"
                            : "text"
                        }
                        name={field}
                        value={formData[field]}
                        onChange={handleChange}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder={`Enter ${field.replace("_", " ")}`}
                        step={field === "current_gpa" ? "0.1" : undefined}
                        min={field === "backlogs" || field === "current_gpa" ? "0" : undefined}
                        max={field === "current_gpa" ? "10" : undefined}
                      />
                    )}
                  </div>
                ) : null
              )}
              {/* File Uploads */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Resume</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileChange(e, "resume_url")}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  {previewResume && (
                    <p className="mt-2 text-sm text-gray-600">{previewResume}</p>
                  )}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Certificates</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileChange(e, "certificate_urls")}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  {previewCertificates && (
                    <p className="mt-2 text-sm text-gray-600">{previewCertificates}</p>
                  )}
                </div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={loading}
              className={`w-full sm:w-auto py-2 px-6 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Saving..." : "Save Changes"}
            </motion.button>
          </motion.form>
        ) : (
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-teal-600 flex items-center gap-2">
                <UserIcon className="w-5 h-5" /> Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <p><strong>DOB:</strong> {profile.dob ? new Date(profile.dob).toLocaleDateString() : "N/A"}</p>
                <p><strong>Skills:</strong> {profile.skills || "N/A"}</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-teal-600 flex items-center gap-2">
                <AcademicCapIcon className="w-5 h-5" /> Academic Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <p><strong>Current GPA:</strong> {profile.current_gpa || "N/A"}</p>
                <p><strong>Backlogs:</strong> {profile.backlogs || "0"}</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-teal-600 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5" /> Documents
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <p>
                  <strong>Resume:</strong>{" "}
                  {profile.resume_url ? (
                    <a href={`http://localhost:5000/uploads/${profile.resume_url}`} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                      View Resume
                    </a>
                  ) : (
                    "Not uploaded"
                  )}
                </p>
                <p>
                  <strong>Certificates:</strong>{" "}
                  {profile.certificate_urls ? (
                    <a href={`http://localhost:5000/uploads/${profile.certificate_urls}`} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                      View Certificates
                    </a>
                  ) : (
                    "Not uploaded"
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Profile;