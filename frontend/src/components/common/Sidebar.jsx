// src/components/common/Sidebar.jsx

import {
  AcademicCapIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { EventNoteSharp, Schedule } from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";

import { CgProfile } from "react-icons/cg";
import { ImProfile } from "react-icons/im";
import { useAuth } from "../../context/AuthContext";
import { useState } from 'react';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  // console.log(user);
  const studentLinks = [
    { name: "Dashboard", path: "/student/dashboard", icon: UserIcon },
    { name: "Jobs", path: "/student/jobs", icon: BriefcaseIcon },
    { name: "Applied Jobs", path: "/student/applications", icon: DocumentTextIcon },
    { name: "Profile", path: "/student/profile", icon:CgProfile },
    { name: "Job Calendar", path: "/student/job-calendar", icon: CalendarDaysIcon },
    { name: "Offers", path: "/student/offer", icon:AcademicCapIcon },
  ];

  const tpoLinks = [
    { name: "Dashboard", path: "/tpo/dashboard", icon: UserIcon },
    { name: "Post Job", path: "/tpo/post-job", icon: BriefcaseIcon },
    { name: "Placements", path: "/tpo/placements", icon: DocumentTextIcon },
    { name: "Reports", path: "/tpo/reports", icon: ChartBarIcon },
  ];

  const links = user?.role === "student" 
    ? studentLinks 
    : user?.role === "admin" || user?.role === "cdpc" 
    ? tpoLinks 
    : [];

  // Animation variants
  const sidebarVariants = {
    expanded: { 
      width: 256,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    collapsed: { 
      width: 80,
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    hover: { 
      scale: 1.05,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.aside
      variants={sidebarVariants}
      initial="expanded"
      animate={isCollapsed ? "collapsed" : "expanded"}
      className="bg-card shadow-lg h-screen fixed left-0 top-0 p-4 flex flex-col"
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="self-end p-2 rounded-full hover:bg-gray-200 mb-4"
      >
        {isCollapsed ? (
          <ChevronRightIcon className="w-5 h-5" />
        ) : (
          <ChevronLeftIcon className="w-5 h-5" />
        )}
      </button>

      {/* Navigation Links */}
      <nav className="flex-1">
        <ul className="space-y-2">
          <AnimatePresence>
            {links.map((link, index) => (
              <motion.li
                key={link.name}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={link.path}
                  className={`flex items-center p-2 rounded transition-colors duration-200 ${
                    location.pathname === link.path
                      ? "bg-primary text-white"
                      : "hover:bg-primary hover:text-white"
                  }`}
                >
                  <motion.div
                    variants={itemVariants}
                    whileHover="hover"
                  >
                    <link.icon className="w-5 h-5 min-w-[20px]" />
                  </motion.div>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="ml-3 truncate"
                    >
                      {link.name}
                    </motion.span>
                  )}
                </Link>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </nav>

      {/* User Info (optional) */}
      {user && !isCollapsed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-auto p-2 border-t"
        >
          <div className="flex items-center space-x-2">
            <UserIcon className="w-5 h-5" />
            <span className="text-sm truncate">{user.email}</span>
          </div>
        </motion.div>
      )}
    </motion.aside>
  );
};

export default Sidebar;