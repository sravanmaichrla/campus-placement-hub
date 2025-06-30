import "react-toastify/dist/ReactToastify.css";
import "react-big-calendar/lib/css/react-big-calendar.css";

// src/App.jsx
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import Applications from "./pages/Student/Applications";
import { AuthProvider } from "./context/AuthContext";
import Footer from "./components/common/Footer";
import GetProfile from "./pages/TPO/GetProfile";
import JobAppliedStudents from "./pages/TPO/JobAppliedStudents";
import JobCalendar from "./pages/Student/JobCalendar";
import JobCard from "./components/student/JobCard";
import JobEdit from "./pages/TPO/JobEdit";
import JobList from "./components/tpo/JobList";
import Jobs from "./pages/Student/Jobs";
// Auth Pages
import Login from "./pages/Auth/Login";
import ManageJobs from "./pages/TPO/ManageJobs";
import Navbar from "./components/common/Navbar";
import  Offer from "./pages/Student/Offer";
import Placements from "./pages/TPO/Placements";
import PostJob from "./pages/TPO/PostJob";
import Profile from "./pages/Student/Profile";
import Register from "./pages/Auth/Register";
import Reports from "./pages/TPO/Reports";
import Sidebar from "./components/common/Sidebar";
// Student Pages
import StudentDashboard from "./pages/Student/Dashboard";
// TPO Pages
import TPODashboard from "./pages/TPO/TPODashboard";
import TPOLogin from "./pages/Auth/TPOLogin";
import TPORegister from "./pages/Auth/TPORegister";
import { ToastContainer } from "react-toastify";
import VerifyOTP from "./pages/Auth/VerifyOTP";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-background flex flex-col">
          <Navbar />
          <div className="flex flex-1">
            <main className="flex-1 p-6">
              <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/tpo/register" element={<TPORegister />} />
                <Route path="/tpo/login" element={<TPOLogin />} />
                <Route path="/verify-otp" element={<VerifyOTP role="student" />} />
                <Route path="/tpo/verify-otp" element={<VerifyOTP role="admin" />} />

                {/* Student Routes */}
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/jobs" element={<Jobs />} />
                <Route path="/student/applications" element={<Applications />} />
                <Route path="/student/profile" element={<Profile />} />
                <Route path="/student/job-card" element={<JobCard />} />
                <Route path="/student/job-calendar" element={<JobCalendar />} />
                <Route path="/student/offer" element={<Offer />} />

                {/* TPO Routes */}
                <Route path="/tpo/dashboard" element={<TPODashboard />} />
                <Route path="/tpo/post-job" element={<PostJob />} />
                <Route path="/tpo/job/list" element={<JobList />} />
                <Route path="/tpo/manage-jobs" element={<ManageJobs />} />
                <Route path="/tpo/placements" element={<Placements />} />
                <Route path="/tpo/applied/:job_id" element={<JobAppliedStudents/>} />
                <Route path="/tpo/reports" element={<Reports />} />
                <Route path="/tpo/student-profile/:student_id" element={<GetProfile />} />
                <Route path="/tpo/job-edit/:job_id" element={<JobEdit />} />

                {/* Default Route */}
                <Route path="/" element={<Login />} />
              </Routes>
            </main>
          </div>
          <Footer />
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;