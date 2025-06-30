import { AnimatePresence, motion } from "framer-motion";
import {
    Box,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DownloadIcon from "@mui/icons-material/Download"; // Download icon
import SchoolIcon from "@mui/icons-material/School"; // Student hat icon
import Sidebar from "../../components/common/Sidebar";
import axios from "axios";
import { saveAs } from "file-saver";

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
  
  const JobAppliedStudents = () => {
    const { job_id } = useParams(); // Get job_id from URL
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [jobDetails, setJobDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPopup, setShowPopup] = useState(true); // Control the popup animation
  
    // Pagination states
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
  
    useEffect(() => {
      const fetchAppliedStudents = async () => {
        try {
          setLoading(true);
          const response = await api.get(`reports/applied-students/${job_id}`);
          setStudents(response.data.students || []);
          setJobDetails(response.data.job || null);
        } catch (err) {
          setError(err.response?.data?.message || "Failed to fetch applied students");
        } finally {
          setLoading(false);
        }
      };
  
      fetchAppliedStudents();
    }, [job_id]);
  
    // Handle download as Excel
    const handleDownloadExcel = async () => {
      try {
        const response = await api.get(`reports/applied-students/${job_id}?format=excel`, {
          responseType: "blob", // Important for handling binary data
        });
  
        // Extract filename from the Content-Disposition header, if available
        const contentDisposition = response.headers["content-disposition"];
        let filename = `applied_students_job_${jobDetails.company_name}.xlsx`; // Fallback filename
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }
  
        // Use file-saver to trigger the download
        const blob = new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        saveAs(blob, filename);
      } catch (err) {
        console.error("Failed to download Excel file:", err);
        alert("Failed to download Excel file. Please try again.");
      }
    };
  
    // Animation variants for table rows
    const rowVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
      hover: { scale: 1.02, backgroundColor: "#f5f5f5", transition: { duration: 0.2 } },
      tap: { scale: 0.98, transition: { duration: 0.1 } },
    };
  
    // Animation variants for the popup
    const popupVariants = {
      hidden: { opacity: 0, scale: 0.8, y: -50 },
      visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { duration: 0.5, type: "spring", stiffness: 100 },
      },
      exit: { opacity: 0, scale: 0.8, y: -50, transition: { duration: 0.3 } },
    };
  
    // Handle page change
    const handleChangePage = (event, newPage) => {
      setPage(newPage);
    };
  
    // Handle rows per page change
    const handleChangeRowsPerPage = (event) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    };
  
    // Calculate the students to display on the current page
    const paginatedStudents = students.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  
    // Handle row click to navigate to student details (optional)
    const handleRowClick = (studentId) => {
      navigate(`/tpo/student-profile/${studentId}`); // Optional: Navigate to student details page
    };
  
    if (loading) {
      return (
        <Box sx={{ display: "flex", mt: 4 }}>
          <Sidebar />
          <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}>
            <Typography>Loading applied students...</Typography>
          </Box>
        </Box>
      );
    }
  
    if (error) {
      return (
        <Box sx={{ display: "flex", mt: 4 }}>
          <Sidebar />
          <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}>
            <Typography color="error">{error}</Typography>
          </Box>
        </Box>
      );
    }
  
    return (
      <Box sx={{ display: "flex", mt: 4 }}>
        <Sidebar />
        <Box sx={{ flexGrow: 1, maxWidth: 1200, mx: "auto", mb: 4, ml: { xs: 0, md: 30 } }}>
          {/* Popup Animation for Total Applicants */}          
          <AnimatePresence sx={{
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
            zIndex: 1000,
            display: "flex",
            gap: 2,
          }}>
            {showPopup && (
              <motion.div
                variants={popupVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                sx={{
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
                    zIndex: 1000,
                    display: "flex",
                    gap: 2,
                }}
                onClick={() => setShowPopup(false)} // Dismiss on click
              >
                <SchoolIcon sx={{ fontSize: 40, color: "primary.main" }} />
                <Typography variant="h6" color="primary">
                  Total Applicants: {students.length}
                </Typography>
              </motion.div>
            )}
          </AnimatePresence>
  
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="h4" gutterBottom>
              Students Applied for Job at <strong>{(jobDetails?.company_name).toUpperCase() || "Company"}</strong>
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="body1" color="text.secondary">
                Total Applicants: {students.length}
              </Typography>
              {students.length > 0 && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadExcel}
                  sx={{ mb: 2 }}
                >
                  Download as Excel
                </Button>
              )}
            </Box>
          </motion.div>
  
          {students.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              No students have applied for this job yet.
            </motion.p>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                      <TableCell sx={{ fontWeight: "bold" }}>Student Name</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Roll Number</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Branch</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>CGPA</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Applied Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedStudents.map((student) => (
                      <motion.tr
                        key={student.application_id}
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                        whileTap="tap"
                        onClick={() => handleRowClick(student.student_id)}
                        style={{ cursor: "pointer" }}
                      >
                        <TableCell>{student.full_name}</TableCell>
                        <TableCell>{student.roll_number}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.branch || "N/A"}</TableCell>
                        <TableCell>{student.cgpa || "N/A"}</TableCell>
                        <TableCell>{student.applied_date || "N/A"}</TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
  
              {/* Pagination */}
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={students.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{ mt: 2 }}
              />
            </>
          )}
        </Box>
      </Box>
    );
  };
  
  export default JobAppliedStudents;