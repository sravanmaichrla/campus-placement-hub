import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import Sidebar from "../../components/common/Sidebar";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

// Axios instance with base URL and token interceptor
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

const Dashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    eligibleJobs: 0,
    appliedJobs: 0,
    offersObtained: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch applied jobs (already used in Applications.jsx)
        const appliedJobsResponse = await api.get("/job/student/applied-jobs");
        const appliedJobs = appliedJobsResponse.data.applications || [];
        const offersObtained = appliedJobs.filter(
          (job) => job.job_status === "Offers"
        ).length;
        // console.log(appliedJobsResponse.data);
        // Placeholder for eligible jobs (adjust endpoint as needed)
        let eligibleJobs = 0;
        try {
          const eligibleJobsResponse = await api.get("/job/student/eligible-jobs");
          console.log(eligibleJobsResponse.data);
          eligibleJobs = eligibleJobsResponse.data.eligible_jobs_count;
        } catch (err) {
          console.warn("Eligible jobs endpoint not available, defaulting to 0");
        }

        setDashboardData({
          eligibleJobs,
          appliedJobs: appliedJobs.length,
          offersObtained,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch dashboard data");
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Sidebar />
        <CircularProgress />
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

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", mt: 4, mb: 4 }}>
      <Sidebar />
      <Typography variant="h4" gutterBottom>
        Student Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Eligible Jobs Card */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ boxShadow: 3, bgcolor: "#e3f2fd" }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                Eligible Jobs
              </Typography>
              <Typography variant="h3" color="primary" fontWeight="bold">
                {dashboardData.eligibleJobs}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Jobs you are eligible to apply for
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Jobs Applied Card */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ boxShadow: 3, bgcolor: "#fff3e0" }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                Jobs Applied
              </Typography>
              <Typography variant="h3" color="warning.main" fontWeight="bold">
                {dashboardData.appliedJobs}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total applications submitted
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Offers Obtained Card */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ boxShadow: 3, bgcolor: "#e8f5e9" }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                Offers Obtained
              </Typography>
              <Typography variant="h3" color="success.main" fontWeight="bold">
                {dashboardData.offersObtained}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Job offers received
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;