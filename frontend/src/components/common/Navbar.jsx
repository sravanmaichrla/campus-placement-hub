// src/components/Navbar.jsx

import { Link, useNavigate } from "react-router-dom";

import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout(); // Use the logout function from AuthContext
      toast.success("Logged out successfully!");
    } catch (err) {
      toast.error("Failed to log out. Please try again.");
    }
  };

  // Animation variants to match Register.jsx
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.nav
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
      }}
      className="bg-blue-600 p-4 text-white shadow-lg"
    >
      <div className="container mx-auto flex justify-between items-center">
        <motion.div variants={itemVariants}>
          <Link to="/" className="text-xl font-bold">
            Placement Portal
          </Link>
        </motion.div>
        <motion.div variants={itemVariants} className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-sm">
                Welcome, {user.student_name || user.tpo_name || "User"}
              </span>
              {/* {user.role === "student" && (
                <Link
                  to="/student/dashboard"
                  className="text-sm hover:underline"
                >
                  Dashboard
                </Link>
              )}
              {user.role === "admin" || user.role === "cdpc" ? (
                <Link to="/tpo/dashboard" className="text-sm hover:underline">
                  Dashboard
                </Link>
              ) : null} */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-sm transition-colors"
              >
                Logout
              </motion.button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm hover:underline">
                Login
              </Link>
              <Link to="/register" className="text-sm hover:underline">
                Register
              </Link>
              <Link to="/tpo/register" className="text-sm hover:underline">
                TPO Register
              </Link>
              <Link to="/tpo/login" className="text-sm hover:underline">
                TPO Login
              </Link>
            </>
          )}
        </motion.div>
      </div>
    </motion.nav>
  );
};

export default Navbar;