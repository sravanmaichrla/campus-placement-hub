import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import {
  getAppliedStudentsReport,
  getEligibleStudentsReport,
  getHighestPackagesReport,
  getPlacedStudentsBreakdownReport,
  getPlacedStudentsReport,
  getStudentsPlacedPerCompanyReport,
  getTotalCompaniesReport,
  getTotalJobsReport,
} from "../../services/api";
import { useEffect, useState } from "react";

import ReportCard from "../../components/tpo/ReportCard";
import Sidebar from "../../components/common/Sidebar";
import { motion } from "framer-motion";

const Reports = () => {
  const [reports, setReports] = useState({});
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const [placed, totalCompanies, totalJobs, highestPackages, studentsPerCompany,breakdown] = await Promise.all([
          getPlacedStudentsReport(year),
          // getEligibleStudentsReport(1),
          getTotalCompaniesReport(),
          getTotalJobsReport(year),
          getHighestPackagesReport(year),
          getStudentsPlacedPerCompanyReport(year),
          // getAppliedStudentsReport(1),
          getPlacedStudentsBreakdownReport(year, "", "", ""),
        ]);
        setReports({
          "Placed Students": placed.data.data,
          // "Eligible Students": eligible.data.data,
          "Total Companies": totalCompanies.data.data,
          "Total Jobs": totalJobs.data.data,
          "Highest Packages": highestPackages.data.data,
          "Students Per Company": studentsPerCompany.data.data,
          // "Applied Students": applied.data.data,
          "Placement Breakdown": breakdown.data.data,
        });
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [year]);

  return (
    <div className="flex ml-40 min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-extrabold text-gray-800 mb-8 text-center"
      
        >
          Placement Reports
        </motion.h1>

        {/* Year Filter */}
        <div className="flex justify-center mb-8">
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Year</InputLabel>
            <Select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              label="Filter by Year"
              sx={{
                bgcolor: "white",
                borderRadius: 2,
                "&:hover": { bgcolor: "#f9fafb" },
              }}
            >
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        {/* Reports Grid */}
        {loading ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-600"
          >
            Loading reports...
          </motion.p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(reports).map(([key, data], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <ReportCard title={key} data={data} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;