import { Link, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

import Sidebar from '../../components/common/Sidebar';
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from '../../context/AuthContext';

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

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, per_page: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isLoggedIn, user } = useAuth();
  const isStudent = isLoggedIn && user?.role === 'student';
  // console.log(isLoggedIn,isStudent);
  const navigate = useNavigate();

  const fetchJobs = async (page = 1, per_page = 10) => {
    setLoading(true);
    try {
      // Use the filtered endpoint that only returns eligible jobs
      const { data } = await api.get(`/job/student-jobs?page=${page}&per_page=${per_page}`);
      setJobs(data.jobs);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchJobs();
    }
  }, [isLoggedIn, navigate]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchJobs(newPage, pagination.per_page);
      window.scrollTo(0, 0);
    }
  };



  const getPaginationNumbers = () => {
    const total = pagination.pages;
    const currentPage = pagination.page;
    const pages = [];
    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 1);
      let end = Math.min(total, start + 2);
      if (currentPage >= total - 1) {
        start = Math.max(1, total - 4);
        end = total;
      } else if (currentPage <= 2) {
        start = 1;
        end = Math.min(5, total);
      }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <div>
      <Sidebar />
      <div className="min-h-screen bg-gray-100 p-2 sm:p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-4 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center">
              Eligible Jobs
            </h1>
            {isStudent && (
              <button
                onClick={() => navigate('/student/applications')}
                className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition"
              >
                My Jobs
              </button>
            )}
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600"></div>
              <p className="mt-2 text-gray-600">Loading eligible jobs...</p>
            </div>
          )}

          {error && (
            <p className="text-center text-red-500 bg-red-100 p-3 rounded-lg mb-6">
              {error}
            </p>
          )}

          {!loading && jobs.length === 0 && !error && (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <p className="text-gray-600">No eligible jobs found at the moment.</p>
            </div>
          )}

          {jobs.length > 0 && (
            <div className="hidden md:block bg-white shadow-lg rounded-lg overflow-hidden mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-teal-600 text-white">
                    <th className="p-3 md:p-4">Sl.No</th>
                    <th className="p-3 md:p-4">Role</th>
                    <th className="p-3 md:p-4">Company</th>
                    <th className="p-3 md:p-4">Location</th>
                    <th className="p-3 md:p-4">Package (LPA)</th>
                    <th className="p-3 md:p-4">Posted Date</th>
                    <th className="p-3 md:p-4">Interview Date</th>
                    <th className="p-3 md:p-4">Last Date to Apply</th>
                    {isStudent && <th className="p-3 md:p-4">Apply</th>}
                    {/* <th className="p-3 md:p-4">View</th> */}
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job, index) => (
                    <tr key={job.job_id} className="border-b hover:bg-gray-100 transition">
                      <td className="p-3 md:p-4">
                        {(pagination.page - 1) * pagination.per_page + index + 1}
                      </td>
                      <td className="p-3 md:p-4 font-semibold">{job.role}</td>
                      <td className="p-3 md:p-4">{job.company_name}</td>
                      <td className="p-3 md:p-4">{job.job_location}</td>
                      <td className="p-3 md:p-4">{job.package}</td>
                      <td className="p-3 md:p-4">{job.posted_date}</td>
                      <td className="p-3 md:p-4">{job.date_of_interview}</td>
                      <td className="p-3 md:p-4">{job.last_date_to_apply}</td>
                      <td className="p-3 md:p-4">
                        <Link to={`/student/job-card`} state={{ job }}>
                          <button className="bg-teal-600 text-white px-3 py-1 rounded-md hover:bg-teal-700 transition">
                            View
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {jobs.length > 0 && (
            <div className="md:hidden space-y-4 mb-6">
              {jobs.map((job, index) => (
                <div key={job.job_id} className="bg-white p-4 rounded-lg shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="font-semibold text-lg">{job.role}</h2>
                    <span className="text-sm text-gray-500">
                      #{(pagination.page - 1) * pagination.per_page + index + 1}
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <p><span className="font-medium">Company:</span> {job.company_name}</p>
                    <p><span className="font-medium">Location:</span> {job.job_location}</p>
                    <p><span className="font-medium">Package:</span> {job.package} LPA</p>
                    <p><span className="font-medium">Posted Date:</span> {job.posted_date}</p>
                    <p><span className="font-medium">Interview Date:</span> {job.date_of_interview}</p>
                    <p><span className="font-medium">Last Date:</span> {job.last_date_to_apply}</p>
                  </div>
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <Link
                      to={`/student/job-card`}
                      state={{ job }}  // ✅ Pass job data
                      className="inline-block mt-2"
                    >
                      <button className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition">
                        View
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={pagination.page === 1}
                className="hidden sm:block bg-gray-300 text-gray-700 px-2 py-1 rounded-md disabled:opacity-50 hover:bg-gray-400 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="bg-gray-300 text-gray-700 px-3 py-1 rounded-md disabled:opacity-50 hover:bg-gray-400 transition"
              >
                <span className="flex items-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline ml-1">Previous</span>
                </span>
              </button>
              <div className="flex flex-wrap gap-1">
                {getPaginationNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md ${pageNum === pagination.page
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400 transition'
                      }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="bg-gray-300 text-gray-700 px-3 py-1 rounded-md disabled:opacity-50 hover:bg-gray-400 transition"
              >
                <span className="flex items-center">
                  <span className="hidden sm:inline mr-1">Next</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
              <button
                onClick={() => handlePageChange(pagination.pages)}
                disabled={pagination.page === pagination.pages}
                className="hidden sm:block bg-gray-300 text-gray-700 px-2 py-1 rounded-md disabled:opacity-50 hover:bg-gray-400 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {jobs.length > 0 && (
            <div className="mt-4 text-center text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages} (Total: {pagination.total} jobs)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;