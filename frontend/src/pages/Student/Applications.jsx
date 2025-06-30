import {
  Avatar,
  Box,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import { AcademicCapIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import Sidebar from "../../components/common/Sidebar";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Axios instance with base URL and token interceptor
const api = axios.create({
  baseURL: "http://localhost:5000", // Adjust to your backend URL
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const Applications = () => {
  const navigate = useNavigate();
  const [getdata, setData] = useState({ student: {}, applications: [] }); // Store all applied jobs
  const [filteredJobs, setFilteredJobs] = useState([]); // Store filtered jobs based on tab
  const [loading, setLoading] = useState(true); // Loading state for API call
  const [error, setError] = useState(null); // Error state for API call
  const [tabValue, setTabValue] = useState("Upcoming"); // Default tab
  const [page, setPage] = useState(0); // Pagination page (0-based index)
  const [rowsPerPage, setRowsPerPage] = useState(5); // Rows per page

  // Fetch applied jobs on component mount
  useEffect(() => {
    const fetchAppliedJobs = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/job/student/applied-jobs`);
        setData({
          student: data.student || {},
          applications: data.applications || [],
        });
        // Filter jobs based on the default tab
        setFilteredJobs(
          data.applications.filter((job) => job.job_status === "Upcoming")
        );
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch applied jobs");
      } finally {
        setLoading(false);
      }
    };

    fetchAppliedJobs();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setFilteredJobs(
      getdata.applications.filter((job) => job.job_status === newValue)
    );
    setPage(0);
  };

  // Navigate to job card with job data
  const handleRowClick = (job) => {
    navigate(`/student/job-card`, { state:  {job}  });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Sidebar />
        <Typography>Loading applied jobs...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Sidebar />
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const paginatedJobs = filteredJobs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", mt: 4, mb: 4 }}>
      <Sidebar />
      <Typography variant="h4" gutterBottom>
        {getdata.student.full_name}'s Applications
      </Typography>

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        sx={{color:'#000',
          mb: 2,
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: "bold",
          },
          "& .Mui-selected": {
            color: "#fff",
            backgroundColor: "#007bff",
            borderRadius: 8,
          },
          "& .MuiTabs-indicator": {
            display: "none",
          },
        }}
      >
        <Tab label="Upcoming" value="Upcoming" />
        <Tab label="Ongoing" value="Ongoing" />
        <Tab label="Completed" value="Completed" />
        <Tab label="Offers" value="Offers" />
      </Tabs>

      <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: "bold" }}>Company</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Job Role</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Interview Date</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Published On</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Applied Date</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Package</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Location</TableCell>
              {/* <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell> */}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography>No jobs found for this category.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedJobs.map((job) => (
                <TableRow
                  key={job.application_id}
                  hover
                  onClick={() => handleRowClick(job)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Avatar
                      src={AcademicCapIcon}
                        alt={job.company.company_name}
                        sx={{ width: 40, height: 40, mr: 2 }}
                      />
                      <Typography>{job.company.company_name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{job.job_role}</TableCell>
                  <TableCell>{job.interview_date}</TableCell>
                  <TableCell>{job.published_on}</TableCell>
                  <TableCell>
                    <Typography color="text.secondary">
                      {job.applied_date}
                    </Typography>
                  </TableCell>
                  <TableCell>{job.job_package ? `${job.job_package} LPA` : "N/A"}</TableCell>
                  <TableCell>{job.job_location}</TableCell>
                  {/* <TableCell>
                  <Link
                      to={`/student/job-card`}
                      state={{ job }}  // ✅ Pass job data
                    >
                      <button className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition">
                        View
                      </button>
                    </Link>
                  </TableCell> */}
                  
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredJobs.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};

export default Applications;