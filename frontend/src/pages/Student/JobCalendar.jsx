import { Box, Typography } from "@mui/material";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns"; // date-fns utilities
import { useEffect, useState } from "react";

import { Scale } from "@mui/icons-material";
import Sidebar from "../../components/common/Sidebar";
import axios from "axios";
import enUS from "date-fns/locale/en-US"; // English locale for date-fns
import { transform } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Setup the date-fns localizer for react-big-calendar
const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

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

const JobCalendar = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAppliedJobs = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("job/student/applied-jobs");
        const appliedJobs = data.applications || [];

        // Map applied jobs to calendar events
        const calendarEvents = appliedJobs
          .filter((job) => job.interview_date && job.interview_date !== "TBD") // Filter out jobs without a valid interview date
          .map((job) => {
            // Parse the interview_date (e.g., "Apr. 08, 2025") into a Date object
            const interviewDate = parse(job.interview_date, "MMM. dd, yyyy", new Date());
            return {
              job_id: job.job_id,
              title: `${job.company.company_name} Drive Scheduled`,
              start: interviewDate,
              end: interviewDate, // Same day event (you can adjust if needed)
              allDay: true, // Treat as an all-day event
              resource: job, // Store the full job object for navigation
            };
          });
        setEvents(calendarEvents);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch applied jobs");
      } finally {
        setLoading(false);
      }
    };

    fetchAppliedJobs();
  }, []);

  // Handle event click to navigate to job details
  const handleEventClick = (job_id) => {
    console.log("Selected Job ID:", job_id);
    // navigate(`/student/job-card`,{state:{job_id}});
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", mt: 4 }}>
        <Sidebar />
        <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}>
          <Typography>Loading job calendar...</Typography>
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
        <Typography variant="h4" gutterBottom>
          Job Interview Calendar
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          View your upcoming job interviews on the calendar below.
        </Typography>

        <Box sx={{ height: "600px", bgcolor: "background.paper", p: 2, borderRadius: 2, boxShadow: 3 }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            onSelectEvent={(event) => handleEventClick(event)}
            eventPropGetter={(event) => ({
              style: {
                backgroundColor: "#007bef", // Blue background for events
                color: "white",
                borderRadius: "5px",
                height:"100%",
                textAlign:"center",
                alignContent:'center',
                border: "none",
                padding: "5px",
                cursor: "pointer",
              },
            })}
            views={["month", "week", "day"]} // Allow switching between views
            defaultView="month" // Default to month view
            popup // Show a popup for overlapping events
            onShowMore={(events, date) => console.log(events, date)} // Optional: Handle "Show More" for overlapping events
          />
        </Box>
      </Box>
    </Box>
  );
};

export default JobCalendar;