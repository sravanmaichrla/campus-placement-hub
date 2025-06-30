// src/services/api.js

import axios from "axios";

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

export const register = (data) => api.post("/auth/register", data);
export const verifyOTP = (data) => api.post("/auth/verify-otp", data);
export const login = (data) => api.post("/auth/login", data);
export const getProfile = () => api.get("/auth/profile");
export const updateProfile = (data) => api.patch("/auth/profile", data, { headers: { "Content-Type": "multipart/form-data" } });
export const changePassword = (data) => api.patch("/auth/change-password", data);
export const resetPassword = (data) => api.post("/auth/reset-password", data);
export const verifyPasswordOTP = (data) => api.post("/auth/password-otp-verify", data);
export const refreshToken = () => api.post("/auth/refresh");
export const logout = () => api.post("/auth/logout",{});

export const tpoRegister = (data) => api.post("/auth/tpo/register", data);
export const tpoVerifyOTP = (data) => api.post("/auth/tpo/verify-otp", data);
export const tpoLogin = (data) => api.post("/auth/tpo/login", data);
export const tpoGetProfile = () => api.get("/auth/tpo/profile");
export const tpoUpdateProfile = (data) => api.patch("/auth/tpo/profile", data, { headers: { "Content-Type": "multipart/form-data" } });
export const tpoChangePassword = (data) => api.patch("/auth/tpo/change-password", data);
export const tpoResetPassword = (data) => api.post("/auth/tpo/reset-password", data);
export const tpoVerifyPasswordOTP = (data) => api.post("/auth/tpo/password-otp-verify", data);
export const tpoRefreshToken = () => api.post("/auth/tpo/refresh");
export const tpoLogout = () => api.post("/auth/tpo/logout");

export const createJob = (data) => api.post("/job/", data);
export const updateJob = (jobId, data) => api.put(`/job/${jobId}`, data, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteJob = (jobId) => api.delete(`/job/${jobId}`);
export const getJob = (jobId) => api.get(`/job/${jobId}`);
export const getAllJobs = (page = 1, per_page = 5) => api.get("/job/", { params: { page, per_page } });
export const registerJob = (jobId) => api.post(`/job/${jobId}/register`);
export const getAllJobstpo = async (page = 1, per_page = 10) => {
  const response = await api.get(`/job/tpo/jobs?page=${page}&per_page=${per_page}`, {
    params: { page, per_page: per_page },
  });
  return response;
};
export const createPlacedStudent = (data) => api.post("/placements/add-placed-students", data);
export const updatePlacedStudent = (placementId, data) => api.put(`/placements/edit-placed-students/${placementId}`, data);
export const deletePlacedStudent = (placementId) => api.delete(`/placements/delete-placed-students/${placementId}`);
export const getAllPlacedStudents = (page, perPage) => api.get(`/placements/all-placed-students?page=${page}&per_page=${perPage}`);

export const getPlacedStudentsReport = (year) => api.get(`/reports/placed-students?year=${year}`);
export const getEligibleStudentsReport = (jobId) => api.get(`/reports/eligible-students/${jobId}`);
export const getTotalCompaniesReport = () => api.get("/reports/total-companies");
export const getTotalJobsReport = (year) => api.get(`/reports/total-jobs?year=${year}`);
export const getHighestPackagesReport = (year) => api.get(`/reports/highest-packages?year=${year}`);
export const getStudentsPlacedPerCompanyReport = (year) => api.get(`/reports/students-placed-per-company?year=${year}`);
export const getAppliedStudentsReport = (jobId) => api.get(`/reports/applied-students/${jobId}`);
export const getPlacedStudentsBreakdownReport = (year, branch, gender, companyId) =>
  api.get(`/reports/placed-students-breakdown?year=${year}&branch=${branch}&gender=${gender}&company_id=${companyId}`);