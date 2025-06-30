import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import Sidebar from "../../components/common/Sidebar";
import axios from "axios";
import { toast } from "react-toastify";

// Axios instance
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

const PlacedStudents = () => {
  // State for companies dropdown
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");

  // State for dynamic student_id and job_id options
  const [students, setStudents] = useState([]);
  const [jobs, setJobs] = useState([]);

  // State for adding a new placed student
  const [addFormData, setAddFormData] = useState({
    student_id: "",
    company_id: "",
    job_id: "",
    date_of_interview: "",
    offer_letter_url: "",
    joining_date: "",
    salary_offered: "",
  });

  // State for editing an existing placed student
  const [editFormData, setEditFormData] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await api.get("/placed/companies");
        setCompanies(response.data);
      } catch (err) {
        toast.error("Failed to fetch companies");
      }
    };
    fetchCompanies();
  }, []);

  // Fetch students and jobs when company changes
  useEffect(() => {
    if (selectedCompany) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const studentsResponse = await api.get(
            `/placed/companies/${selectedCompany}/students`
          );
          const jobsResponse = await api.get(
            `/placed/companies/${selectedCompany}/jobs`
          );
          setStudents(studentsResponse.data.students || []);
          setJobs(jobsResponse.data.jobs || []);
          setAddFormData((prev) => ({
            ...prev,
            company_id: selectedCompany,
            student_id: "",
            job_id: "",
          }));
        } catch (err) {
          toast.error("Failed to fetch students or jobs");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [selectedCompany]);

  // Handle company selection
  const handleCompanyChange = (e) => {
    setSelectedCompany(e.target.value);
  };

  // Handle input changes for add form
  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setAddFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle input changes for edit form
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit new placed student
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/placed/placed_students", addFormData);
      toast.success(response.data.message);
      setAddFormData({
        student_id: "",
        company_id: selectedCompany,
        job_id: "",
        date_of_interview: "",
        offer_letter_url: "",
        joining_date: "",
        salary_offered: "",
      });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add placed student");
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal with pre-filled data
  const handleEditOpen = async (placement_id) => {
    setLoading(true);
    try {
      const response = await api.get(`/placed/placed_students/${placement_id}`);
      setEditFormData(response.data);
      setEditModalOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to fetch placement data");
    } finally {
      setLoading(false);
    }
  };

  // Submit updated placed student
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.put(
        `placed/placed_students/${editFormData.placement_id}`,
        editFormData
      );
      toast.success(response.data.message);
      setEditModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update placed student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", mt: 4, mb: 4 }}>
      <Sidebar />
      <Typography variant="h4" gutterBottom>
        Manage Placed Students
      </Typography>

      {/* Add Placed Student Form */}
      <Card sx={{ mb: 4, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Add New Placed Student
          </Typography>
          <form onSubmit={handleAddSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth required>
                  <InputLabel>Company</InputLabel>
                  <Select
                    value={selectedCompany}
                    onChange={handleCompanyChange}
                    label="Company"
                  >
                    <MenuItem value="">
                      <em>Select a company</em>
                    </MenuItem>
                    {companies.map((company) => (
                      <MenuItem key={company.company_id} value={company.company_id}>
                        {company.company_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth required disabled={!selectedCompany}>
                  <InputLabel>Student</InputLabel>
                  <Select
                    name="student_id"
                    value={addFormData.student_id}
                    onChange={handleAddChange}
                    label="Student"
                  >
                    <MenuItem value="">
                      <em>Select a student</em>
                    </MenuItem>
                    {students.map((student) => (
                      <MenuItem key={student.student_id} value={student.student_id}>
                        {student.first_name} {student.last_name} ({student.reg_no})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth required disabled={!selectedCompany}>
                  <InputLabel>Job</InputLabel>
                  <Select
                    name="job_id"
                    value={addFormData.job_id}
                    onChange={handleAddChange}
                    label="Job"
                  >
                    <MenuItem value="">
                      <em>Select a job</em>
                    </MenuItem>
                    {jobs.map((job) => (
                      <MenuItem key={job.job_id} value={job.job_id}>
                        {job.job_role} ({job.company_name})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Date of Interview"
                  name="date_of_interview"
                  value={addFormData.date_of_interview}
                  onChange={handleAddChange}
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Offer Letter URL"
                  name="offer_letter_url"
                  value={addFormData.offer_letter_url}
                  onChange={handleAddChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Joining Date"
                  name="joining_date"
                  value={addFormData.joining_date}
                  onChange={handleAddChange}
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Salary Offered"
                  name="salary_offered"
                  value={addFormData.salary_offered}
                  onChange={handleAddChange}
                  type="number"
                  step="0.01"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading || !selectedCompany}
                  sx={{ mt: 2 }}
                >
                  {loading ? "Adding..." : "Add Placed Student"}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Example button to trigger edit */}
      <Button
        variant="outlined"
        onClick={() => handleEditOpen(1)}
        sx={{ mb: 2 }}
      >
        Edit Placement ID 1 (Test)
      </Button>

      {/* Edit Placed Student Modal */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Edit Placed Student
          </Typography>
          {editFormData && (
            <form onSubmit={handleEditSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Student ID"
                    name="student_id"
                    value={editFormData.student_id}
                    onChange={handleEditChange}
                    required
                    type="number"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Company ID"
                    name="company_id"
                    value={editFormData.company_id}
                    onChange={handleEditChange}
                    required
                    type="number"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Job ID"
                    name="job_id"
                    value={editFormData.job_id}
                    onChange={handleEditChange}
                    required
                    type="number"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date of Interview"
                    name="date_of_interview"
                    value={editFormData.date_of_interview || ""}
                    onChange={handleEditChange}
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Offer Letter URL"
                    name="offer_letter_url"
                    value={editFormData.offer_letter_url || ""}
                    onChange={handleEditChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Joining Date"
                    name="joining_date"
                    value={editFormData.joining_date || ""}
                    onChange={handleEditChange}
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Salary Offered"
                    name="salary_offered"
                    value={editFormData.salary_offered || ""}
                    onChange={handleEditChange}
                    type="number"
                    step="0.01"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    sx={{ mr: 2 }}
                  >
                    {loading ? "Updating..." : "Update"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setEditModalOpen(false)}
                  >
                    Cancel
                  </Button>
                </Grid>
              </Grid>
            </form>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default PlacedStudents;