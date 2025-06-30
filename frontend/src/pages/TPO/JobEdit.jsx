import {
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Sidebar from "../../components/common/Sidebar";
import axios from "axios";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

// Axios instance
const api = axios.create({
  baseURL: "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const JobEdit = () => {
  const { job_id } = useParams(); // Get job_id from URL params
  console.log(job_id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    job_id:"",
    role: "",
    company_id: "",
    job_location: "",
    job_description: "",
    service_agreement: "",
    links_for_registrations: "",
    package: "",
    min_gpa: "",
    max_backlogs: "",
    date_of_interview: "",
    last_date_to_apply: "",
    gender_eligibility: "all",
    file: null, // For additional_files
  });
  const [previewFile, setPreviewFile] = useState("");

  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // Fetch job data on mount
  useEffect(() => {
    const fetchJobData = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/job/get-job/${job_id}`);
        const job = response.data.job;
        console.log(job);

        // Format dates for input[type="date"]
        const formatDate = (date) =>
          date ? new Date(date).toISOString().split("T")[0] : "";

        setFormData({
        job_id: job.job_id,
          role: job.role || "",
          company_id: job.company_id || "",
          job_location: job.job_location || "",
          job_description: job.job_description || "",
          service_agreement: job.service_agreement || "",
          links_for_registrations: job.links_for_registrations || "",
          package: job.package || "",
          min_gpa: job.min_gpa || "",
          max_backlogs: job.max_backlogs || "",
          date_of_interview: formatDate(job.date_of_interview),
          last_date_to_apply: formatDate(job.last_date_to_apply),
          gender_eligibility: job.gender_eligibility || "all",
          file: null,
        });

        if (job.additional_files) {
          setPreviewFile(job.additional_files);
        }
      } catch (error) {
        console.error("Failed to fetch job data:", error);
        toast.error("Failed to load job data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchJobData();
  }, [job_id]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file input changes
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({ ...prev, file }));
    setPreviewFile(file ? file.name : "");
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key !== "file") {
          formDataToSend.append(key, formData[key]);
        }
      });
      if (formData.file) {
        formDataToSend.append("file", formData.file);
      }

      const response = await api.put(`/job/${job_id}`, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(response.data.message || "Job updated successfully");
      navigate("/tpo/dashboard"); // Redirect to reports page after saving
    } catch (error) {
      console.error("Failed to update job:", error);
      toast.error(error.response?.data?.error || "Failed to update job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto"
        >
          <Typography variant="h5" className="text-gray-800 font-bold mb-6">
            Edit Job
          </Typography>

          {loading && !formData.role ? (
            <Typography className="text-gray-600 text-center">
              Loading job data...
            </Typography>
          ) : (
            <motion.form
              variants={itemVariants}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Job Role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Company ID"
                    name="company_id"
                    value={formData.company_id}
                    onChange={handleChange}
                    type="number"
                    required
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Job Location"
                    name="job_location"
                    value={formData.job_location}
                    onChange={handleChange}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Job Description"
                    name="job_description"
                    value={formData.job_description}
                    onChange={handleChange}
                    multiline
                    rows={3}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Service Agreement"
                    name="service_agreement"
                    value={formData.service_agreement}
                    onChange={handleChange}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Registration Links"
                    name="links_for_registrations"
                    value={formData.links_for_registrations}
                    onChange={handleChange}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Package (LPA)"
                    name="package"
                    value={formData.package}
                    onChange={handleChange}
                    type="number"
                    step="0.1"
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Minimum GPA"
                    name="min_gpa"
                    value={formData.min_gpa}
                    onChange={handleChange}
                    type="number"
                    step="0.1"
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Maximum Backlogs"
                    name="max_backlogs"
                    value={formData.max_backlogs}
                    onChange={handleChange}
                    type="number"
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date of Interview"
                    name="date_of_interview"
                    value={formData.date_of_interview}
                    onChange={handleChange}
                    type="date"
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Date to Apply"
                    name="last_date_to_apply"
                    value={formData.last_date_to_apply}
                    onChange={handleChange}
                    type="date"
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Gender Eligibility</InputLabel>
                    <Select
                      name="gender_eligibility"
                      value={formData.gender_eligibility}
                      onChange={handleChange}
                      label="Gender Eligibility"
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Additional Files"
                    name="file"
                    type="file"
                    onChange={handleFileChange}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                  {previewFile && (
                    <Typography className="mt-2 text-sm text-gray-600">
                      Current File: {previewFile}
                    </Typography>
                  )}
                </Grid>
              </Grid>

              <motion.div
                className="flex justify-end space-x-4 mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Button
                  variant="outlined"
                  onClick={() => navigate("/tpo/reports")}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={loading}
                  sx={{ py: 1, px: 4 }}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </motion.div>
            </motion.form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default JobEdit;