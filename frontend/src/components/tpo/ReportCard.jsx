import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FaChartBar, FaDownload, FaList } from "react-icons/fa";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useEffect, useState } from "react";

import { CSVLink } from "react-csv";
import { motion } from "framer-motion";

// Utility function to determine if a field is numeric
const isNumeric = (value) => !isNaN(parseFloat(value)) && isFinite(value);

// Utility function to prepare graph data
const prepareGraphData = (data) => {
  if (!Array.isArray(data) || data.length === 0) return [];

  // Determine x-axis key (e.g., company_name, student_name, etc.)
  const xAxisKey = data[0].company_name ? "company_name" :
                  data[0].student_name ? "student_name" :
                  data[0].branch ? "branch" :
                  data[0].job_role ? "job_role" : "name";

  // Find all numeric fields for multiple bars
  const numericKeys = Object.keys(data[0]).filter(
    (key) => isNumeric(data[0][key]) && key !== "id" && key !== "total"
  );

  // Format data for recharts
  return data.map((item) => {
    const entry = { [xAxisKey]: item[xAxisKey] || "Unknown" };
    numericKeys.forEach((key) => {
      entry[key] = parseFloat(item[key]) || 0;
    });
    return entry;
  });
};

// Utility function to prepare CSV data
const prepareCSVData = (data, title) => {
  if (!Array.isArray(data)) return [{ title: JSON.stringify(data) }];

  return data.map((item, index) => ({
    id: index + 1,
    ...item,
  }));
};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 text-white p-3 rounded shadow-lg">
        <p className="font-semibold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.fill }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ReportCard = ({ title, data }) => {
  const [viewMode, setViewMode] = useState("list");
  const [yAxisMetric, setYAxisMetric] = useState(null);

  const graphData = prepareGraphData(data);
  const csvData = prepareCSVData(data, title);
  const csvHeaders = data && Array.isArray(data) && data.length > 0 ? ["id", ...Object.keys(data[0])] : ["id", title];

  // Get numeric fields for dropdown (if multiple exist)
  const numericFields = graphData.length > 0 ? Object.keys(graphData[0]).filter(
    (key) => key !== Object.keys(graphData[0])[0] && isNumeric(graphData[0][key])
  ) : [];
  const xAxisKey = graphData.length > 0 ? Object.keys(graphData[0])[0] : "name";

  // Set default y-axis metric if not already set
  useEffect(() => {
    if (numericFields.length > 0 && !yAxisMetric) {
      setYAxisMetric(numericFields[0]);
    }
  }, [numericFields, yAxisMetric]);

  return (
    <motion.div
      className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100"
      style={{
        background: "linear-gradient(145deg, #ffffff, #f0f4f8)",
        boxShadow: "5px 5px 15px #d1d9e6, -5px -5px 15px #ffffff",
      }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">
          {title.charAt(0).toUpperCase() + title.slice(1).replace(/([A-Z])/g, " $1").trim()}
        </h3>
        <div className="flex space-x-3">
          <button
            onClick={() => setViewMode(viewMode === "list" ? "graph" : "list")}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            title={viewMode === "list" ? "Switch to Graph" : "Switch to List"}
          >
            {viewMode === "list" ? <FaChartBar className="text-blue-600" /> : <FaList className="text-blue-600" />}
          </button>
          <CSVLink
            data={csvData}
            headers={csvHeaders}
            filename={`${title}_report_${new Date().toISOString().replace(/:/g, "-")}.csv`}
            className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
            title="Download as CSV"
          >
            <FaDownload />
          </CSVLink>
        </div>
      </div>

      {/* Content */}
      {viewMode === "list" ? (
        <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <ul className="space-y-3">
            {Array.isArray(data) && data.length > 0 ? (
              data.map((item, index) => (
                <li key={index} className="text-gray-700 text-sm bg-gray-50 p-3 rounded-md">
                  {Object.entries(item)
                    .map(([k, v]) => (
                      <span key={k} className="block">
                        <span className="font-medium text-gray-800">
                          {k.replace(/_/g, " ").charAt(0).toUpperCase() + k.replace(/_/g, " ").slice(1)}:
                        </span>{" "}
                        {v !== null && v !== undefined ? v.toString() : "N/A"}
                      </span>
                    ))}
                </li>
              ))
            ) : (
              <li className="text-gray-600 text-sm">{JSON.stringify(data)}</li>
            )}
          </ul>
        </div>
      ) : (
        <div className="h-72">
          {graphData.length > 0 && numericFields.length > 0 ? (
            <>
              {/* Metric Selector */}
              {numericFields.length > 1 && (
                <FormControl fullWidth sx={{ mb: 2, maxWidth: 200 }}>
                  <InputLabel>Y-Axis Metric</InputLabel>
                  <Select
                    value={yAxisMetric || ""}
                    onChange={(e) => setYAxisMetric(e.target.value)}
                    label="Y-Axis Metric"
                  >
                    {numericFields.map((field) => (
                      <MenuItem key={field} value={field}>
                        {field.replace(/_/g, " ").charAt(0).toUpperCase() + field.replace(/_/g, " ").slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graphData} margin={{ top: 20, right: 20, left: 10, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis
                    dataKey={xAxisKey}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    tick={{ fill: "#666" }}
                  />
                  <YAxis tick={{ fill: "#666" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 10 }} />
                  {numericFields.map((key, index) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      fill={`hsl(${index * 60}, 70%, 50%)`} // Dynamic colors
                      name={key.replace(/_/g, " ").charAt(0).toUpperCase() + key.replace(/_/g, " ").slice(1)}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </>
          ) : (
            <p className="text-gray-500 text-center mt-12">No numeric data available for graphing.</p>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ReportCard;