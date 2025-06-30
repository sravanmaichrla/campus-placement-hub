import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Modal,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { getAllJobs, getAllJobstpo } from "../../services/api"; // Assuming this fetches TPO jobs
import { useEffect, useState } from "react";

import Sidebar from "../../components/common/Sidebar";
import axios from "axios";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

// Axios instance for DELETE (assuming same setup as getAllJobs)
const api = axios.create({
  baseURL: "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const TPODashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await getAllJobstpo(1, 10);
        setJobs(response.data.jobs || []);
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
        setError("Failed to load jobs. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // Animation variants for table rows
  const rowVariants = {
    hidden: { opacity: 0, y: 20,backgroundColor: "#fff" },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } ,backgroundColor: "rgba(255, 255, 255, 1)"},
    hover: { scale: 1.02, backgroundColor: "#f5f5f5", transition: { duration: 0.2 } },
    tap: { scale: 0.98, transition: { duration: 0.1 } },
  };

  // Animation variants for modal
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 ,backgroundColor: "rgba(255, 255, 255, 1)"},
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } ,backgroundColor: "#fff"},
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  };

  // Handle delete button click
  const handleDeleteClick = (job) => {
    setJobToDelete(job);
    setDeleteModalOpen(true);
  };
  const handleRowClick = (jobId) => {
    navigate(`/tpo/applied/${jobId}`);
  };
  // Confirm deletion
  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return;
    setLoading(true);
    try {
      await api.delete(`/job/${jobToDelete.job_id}`); // Adjust endpoint as needed
      setJobs(jobs.filter((job) => job.job_id !== jobToDelete.job_id));
      toast.success("Job deleted successfully");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete job");
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
      setJobToDelete(null);
    }
  };

  const handleEditClick = (job) => {
    setJobToEdit({ ...job }); // C
    setEditModalOpen(true);
  };

  // const handleEditChange = (e) => {
  //   const { name, value } = e.target;
  //   setJobToEdit((prev) => ({ ...prev, [name]: value }));
  // };

  const handleFileChange = (e) => {
    setJobToEdit((prev) => ({ ...prev, file: e.target.files[0] }));
  };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setJobToEdit((prev) => ({ ...prev, [name]: value }));
  };
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      // Append all fields to FormData (for multipart/form-data support)
      formData.append("role", jobToEdit.role || "");
      formData.append("company_id", jobToEdit.company_id || "");
      formData.append("job_location", jobToEdit.job_location || "");
      formData.append("job_description", jobToEdit.job_description || "");
      formData.append("service_agreement", jobToEdit.service_agreement || "");
      formData.append("links_for_registrations", jobToEdit.links_for_registrations || "");
      formData.append("package", jobToEdit.package || "");
      formData.append("min_gpa", jobToEdit.min_gpa || "");
      formData.append("max_backlogs", jobToEdit.max_backlogs || "");
      formData.append("date_of_interview", jobToEdit.date_of_interview || "");
      formData.append("last_date_to_apply", jobToEdit.last_date_to_apply || "");
      formData.append("gender_eligibility", jobToEdit.gender_eligibility || "all");
      if (jobToEdit.file) formData.append("file", jobToEdit.file);

      const response = await api.put(`/job/${jobToEdit.job_id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setJobs(
        jobs.map((job) =>
          job.job_id === jobToEdit.job_id ? { ...job, ...jobToEdit, file: undefined } : job
        )
      );
      toast.success(response.data.message || "Job updated successfully");
      setEditModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update job");
    } finally {
      setLoading(false);
      setJobToEdit(null);
    }
  };

  return (
    <div className="ml-24 p-6">
      <Sidebar />
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl ml-40 font-bold mb-6 text-primary"
      >
        TPO Dashboard
      </motion.h1>

      <div className="mt-6 ml-40">
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl font-semibold mb-4 text-text"
        >
          Your Job Postings
        </motion.h2>

        {loading ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Loading jobs...
          </motion.p>
        ) : error ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-red-500"
          >
            {error}
          </motion.p>
        ) : jobs.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            No jobs created yet.
          </motion.p>
        ) : (
          <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Job Role</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Company</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Package</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Posted Date</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.map((job) => (
                  <motion.tr
                    key={job.job_id}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => handleRowClick(job.job_id)}
                    style={{ cursor: "pointer" }}
                  >
                    <TableCell>{job.job_role}</TableCell>
                    <TableCell>{job.company_name}</TableCell>
                    <TableCell>{job.job_location}</TableCell>
                    <TableCell>{job.package} LPA</TableCell>
                    <TableCell>{job.posted_date || "N/A"}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => handleDeleteClick(job)}
                        disabled={loading}
                      >
                        Delete
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={()=> navigate(`/tpo/job-edit/${job.job_id}`)}
                        disabled={loading}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <motion.div
        // className="flex justify-center items-center"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{
            position: "absolute",
            padding:"10px",
            alignItems:"center",
            justifyContent:"center",
            top: "40%",
            left: "40%",
            // transform: "translate(-50%, -50%)",
            alignContent:"center",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 8,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Confirm Deletion
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Are you sure you want to delete the job "{jobToDelete?.job_role}" at{" "}
            {jobToDelete?.company_name}?
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setDeleteModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteConfirm}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </Box>
        </motion.div>
      </Modal>

    </div>
  );
};

export default TPODashboard;