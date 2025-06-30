import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Link,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Sidebar from "../common/Sidebar";
import axios from "axios";
import { motion } from "framer-motion";
import { registerJob } from "../../services/api";
import { toast } from "react-toastify";

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

const JobCard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const job = location.state?.job || location.state?.job_id;
  console.log(job,"sgsh");// Safely accessing job data
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false); // Track application status
  const [error, setError] = useState('');
  const [getJob,setJob] = useState([]);
  // console.log(job);
  // console.log(job.id);
  // Redirect if job data is missing

  useEffect(() => {
    if (!job) {
      toast.error("Invalid job data. Redirecting...");
      navigate("/student/jobs");
    }
    const fetchJob = async (id) => {
      try {
        // If job_id is not provided, use job?.id (optional chaining)
        id = job?.id ||job?.job_id;
        if (!id) {
          toast.error("Job ID is missing");
        }
        const { data } = await api.get(`/job/get-job/${id}`);
        console.log(data.job);
        setJob(data.job);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to fetch job");
        console.log(error);
        toast.error("Invalid job data. Redirecting...");
        // setTimeout(() => navigate("/student/jobs"), 1500);
      }
    };

    fetchJob(job?.id);
    // Check if already applied (you might need to fetch this from the backend)
    // For now, assuming applied status is passed or fetched
  }, [job, navigate]);
  const link_e = getJob.links_for_registrations;
  if (!job) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Typography color="error">Loading...</Typography>
      </Box>
    );
  }
  // console.log(job);
  // console.log(getJob);
  const handleApply = async () => {
    setLoading(true);
    try {
      await registerJob(job.id);
      toast.success(`Applied to ${job.company_name}!`);
      setApplied(true);
      // setTimeout(() => navigate("/student/jobs"), 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || "Application failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Sidebar/>  
      <Card
        sx={{
          maxWidth: 900,
          mx: "auto",
          mt: 4,
          mb: 4,
          boxShadow: 3,
          borderRadius: 2,
        }}
      >
        <CardContent>
          {/* Company Details */}
          <Box sx={{ bgcolor: "#007bff", color: "white", p: 2, borderRadius: 1 }}>
            <Typography variant="h5" fontWeight="bold">
              Company Details
            </Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {job.company_name || job.company.company_name}
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="text.secondary">
                  Created By: <b className="text-black">{getJob.created_by}</b>
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="text.secondary">
                  Posted On: {job.posted_date || job.published_on }
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="text.secondary">
                  Last Date to Apply: <b className="text-red-500">{job.last_date_to_apply}</b> 
                </Typography>
              </Box>
              <Box>
                {/* <Typography variant="body1" fontWeight="bold">Company Name: {job.company_name}</Typography> */}
                <Typography variant="body1" fontWeight="bold">Company Type: {getJob.company_type}</Typography>
                <Typography variant="body1" fontWeight="bold">Job Location: {job.job_location}</Typography>
                <Typography variant="body1" fontWeight="bold">
                  Website: <Link href={getJob.website} target="_blank">{getJob.website}</Link>
                </Typography>
                {/* <Typography variant="body1">Type of Drive: Off Campus</Typography> */}
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Job Designations and Packages */}
          <Box sx={{ bgcolor: "#007bff", color: "white", p: 2, borderRadius: 1, mt: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              Job Designations and Packages
            </Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <Table sx={{ minWidth: 650 }} size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell>SNO</TableCell>
                  <TableCell>Designation</TableCell>
                  <TableCell>Package</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>1</TableCell>
                  <TableCell>{job.role || job.job_role}</TableCell>
                  <TableCell>{job.package || job.job_package} LPA</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>

          <Divider />

          {/* Interview Rounds */}
          <Box sx={{ bgcolor: "#007bff", color: "white", p: 2, borderRadius: 1, mt: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              Interview Rounds
            </Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <Table sx={{ minWidth: 650 }} size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell>SNO</TableCell>
                  <TableCell>Round Name</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>1</TableCell>
                  <TableCell>Online Assessment (100L)</TableCell>
                  <TableCell>{job.date_of_interview || job.interview_date}</TableCell>
                  <TableCell>None</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>2</TableCell>
                  <TableCell>Technical Interview</TableCell>
                  <TableCell>{job.date_of_interview || job.interview_date}</TableCell>
                  <TableCell>None</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>3</TableCell>
                  <TableCell>Offer (OFFERS)</TableCell>
                  <TableCell>{job.date_of_interview || job.interview_date}</TableCell>
                  <TableCell>None</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>

          <Divider />

          {/* Company Description */}
          <Box sx={{ bgcolor: "#007bff", color: "white", p: 2, borderRadius: 1, mt: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              Company Description
            </Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <Typography variant="body1" color="text.secondary">
              {getJob.company_description}
            </Typography>
          </Box>

          <Divider />

          {/* Job Description */}
          <Box sx={{ bgcolor: "#007bff", color: "white", p: 2, borderRadius: 1, mt: 2 ,display:"flex" , justifyContent:'space-between'}} >
            <Typography variant="h5" fontWeight="bold">
              Job Description
            </Typography>
            <Button
              variant="contained"
              sx={{ bgcolor: "#d81b60", "&:hover": { bgcolor: "#c2185b" } }}
              size="small"
              disabled={!getJob.files || getJob.files.length < 1} // Disable if no files
              onClick={() => {
                if (getJob.files && getJob.files.length > 0) {
                  const fullUrl = `http://localhost:5000/uploads/${getJob.files[0]}`;
                  // const fileUrl = getJob.files[0].split(/[/\\]/); // Assuming the first file is to be opened
                  console.log(fullUrl);
                  window.open(fullUrl, "_blank"); // Opens in a new tab
                }
              }}  
            >
              View File
            </Button>
          </Box>
          <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 , textAlign: "justify"}}>
                <strong>{getJob.role}</strong>
                <br />
                {/* Locations: {getJob.job_location} */}
                <br />
                {getJob.job_description}
                <br />
                {/* CTC Offered: INR {getJob.package} Lakhs per annum
                <br />
                Number of open positions: 100 */}
              </Typography>
            </Box>
        
          </Box>

          <Divider />

          {/* Eligibility Criteria */}
          <Box sx={{ bgcolor: "#007bff", color: "white", p: 2, borderRadius: 1, mt: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              Eligibility Criteria
            </Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <Typography variant="body1" color="text.secondary">
            
              <br />
              Minimum or Overall {getJob.min_gpa === 1 ? "50%" : (getJob.min_gpa !== 0 || getJob.min_gpa !== 1) ? "50%" : `${(getJob.min_gpa / 10) * 100}% `} in B.tech
            </Typography>
          </Box>

          <Divider />

          {/* Hiring Process
          <Box sx={{ bgcolor: "#007bff", color: "white", p: 2, borderRadius: 1, mt: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              Hiring Process
            </Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <Typography variant="body1" color="text.secondary">
              Online MCQ Test
              <br />
              Shortlisted students from the MCQ test will have Online Coding Test
              <br />
              Shortlisted students from the Online Coding Test will have Interview rounds
            </Typography>
          </Box>

          <Divider /> */}

          {/* Service Agreement */}
          <Box sx={{ bgcolor: "#007bff", color: "white", p: 2, borderRadius: 1, mt: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              Service Agreement
            </Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <Typography variant="body1" color="text.secondary">
              {getJob.service_agreement}
            </Typography>
          </Box>

          <Divider />

          {/* Mandatory Registration */}
          <Box sx={{ bgcolor: "#007bff", color: "white", p: 2, borderRadius: 1, mt: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              Mandatory Registration
            </Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <Typography variant="body1" color="text.secondary">
              <Link href={link_e} target="_blank">
                {getJob.links_for_registrations}
              </Link>
            </Typography>
          </Box>

          {/* Apply Button or Applied Status */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, p: 2 }}>
            {applied || job.applied_date ? (
              <Chip
                icon={<CheckCircleIcon />}
                label={`Applied on ${new Date().toLocaleString()}`}
                color="success"
                variant="outlined"
              />
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleApply}
                  disabled={loading}
                  sx={{ bgcolor: "#1976d2", "&:hover": { bgcolor: "#1565c0" } }}
                >
                  {loading ? "Applying..." : "Apply Now"}
                </Button>
              </motion.div>
            )}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default JobCard;