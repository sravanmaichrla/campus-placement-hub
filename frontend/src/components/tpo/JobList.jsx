// src/components/tpo/JobList.jsx

import { Link } from "react-router-dom";
import { deleteJob } from "../../services/api";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

const JobList = ({ jobs }) => {
  const handleDelete = async (jobId) => {
    try {
      await deleteJob(jobId);
      toast.success("Job deleted successfully!");
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete job");
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-lg p-6">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b">
            <th className="py-3 text-text">Company</th>
            <th className="py-3 text-text">Role</th>
            <th className="py-3 text-text">Package</th>
            <th className="py-3 text-text">Location</th>
            <th className="py-3 text-text">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job, index) => (
            <motion.tr
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="border-b hover:bg-gray-50"
            >
              <td className="py-3">{job.company_name}</td>
              <td className="py-3">{job.role}</td>
              <td className="py-3">{job.package} LPA</td>
              <td className="py-3">{job.job_location}</td>
              <td className="py-3 space-x-2">
                <Link to={`/tpo/post-job?edit=${job.id}`} className="text-blue-500 hover:underline">Edit</Link>
                <button
                  onClick={() => handleDelete(job.id)}
                  className="text-red-500 hover:underline"
                >
                  Delete
                </button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default JobList;