import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import { Edit } from '@mui/icons-material';
import Sidebar from '../../components/common/Sidebar';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Axios instance with base URL and token interceptor
const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const Offer = () => {
  const { isLoggedIn, user } = useAuth();
//   console.log(user, isLoggedIn);
  const isStudent = isLoggedIn && user?.role === 'student';
  const navigate = useNavigate();
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedPlacementId, setSelectedPlacementId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [placementStatus, setPlacementStatus] = useState('');

  useEffect(() => {
    const fetchPlacementDetails = async () => {
      if (!isLoggedIn || !user) {
        setError('You must be logged in to view placement details.');
        return;
      }

      if (!isStudent) {
        setError('You must be logged in as a student to view placement details.');
        return;
      }

      if (!user.id) {
        setError('User ID is missing. Please log in again.');
        return;
      }

      setLoading(true);
      try {
        const { data } = await api.get(`placements/get/${user.id}`);
        setPlacements(Array.isArray(data.data) ? data.data : [data.data]);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load placement details');
        toast.error(err.response?.data?.message || 'Failed to load placement details');
      } finally {
        setLoading(false);
      }
    };

    fetchPlacementDetails();
  }, [isLoggedIn, isStudent, user]);

  const handleViewOfferLetter = (offerLetter) => {
    if (offerLetter) {
      window.open(offerLetter, '_blank');
    } else {
      toast.error('Offer letter not available.');
    }
  };

  const handleOpenModal = (placementId, existingFeedback = '', existingStatus = '') => {
    setSelectedPlacementId(placementId);
    setFeedback(existingFeedback);
    setPlacementStatus(existingStatus);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedFile(null);
    setSelectedPlacementId(null);
    setFeedback('');
    setPlacementStatus('');
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadOfferLetter = async () => {
    if (!selectedFile && !feedback && !placementStatus) {
      toast.error('Please provide at least one field to update (offer letter, feedback, or placement status).');
      return;
    }

    const formData = new FormData();
    if (selectedFile) {
      formData.append('offer_letter_url', selectedFile);
    }
    formData.append('student_id', user.id);
    formData.append('placement_id', selectedPlacementId);
    formData.append('status', placementStatus);

    try {
      const { data } = await api.post(`/placements/upload-offer-letter`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update the placements state with the new data
      setPlacements((prev) =>
        prev.map((placement) =>
          placement.id === selectedPlacementId
            ? {
                ...placement,
                offer_letter: data.offer_letter_url || placement.offer_letter_url,
                status: data.status || placement.status,
              }
            : placement
        )
      );
      toast.success('Details updated successfully!');
      handleCloseModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update details');
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen bg-gray-100 p-2 sm:p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-4 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center">
              Offers Table
            </h1>
            <button
              onClick={() => navigate('/student/job-card')}
              className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition"
            >
              Back to My Jobs
            </button>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600"></div>
              <p className="mt-2 text-gray-600">Loading placement details...</p>
            </div>
          )}

          {error && (
            <p className="text-center text-red-500 bg-red-100 p-3 rounded-lg mb-6">{error}</p>
          )}

          {!loading && placements.length === 0 && !error && (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <p className="text-gray-600">No placement details found.</p>
            </div>
          )}

          {placements.length > 0 && (
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-red-700 text-white">
                    <th className="p-3 md:p-4">S.No</th>
                    <th className="p-3 md:p-4">Company Name</th>
                    <th className="p-3 md:p-4">Role</th>
                    <th className="p-3 md:p-4">Package</th>
                    <th className="p-3 md:p-4">Willing to Join</th>
                    <th className="p-3 md:p-4">Offer Status</th>
                    <th className="p-3 md:p-4">Offer Letter</th>
                    <th className="p-3 md:p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {placements.map((placement, index) => (
                    <tr key={placement.id || index} className="border-b hover:bg-gray-100 transition">
                      <td className="p-3 md:p-4">{index + 1}</td>
                      <td className="p-3 md:p-4">{placement.company_name}</td>
                      <td className="p-3 md:p-4">{placement.job_role}</td>
                      <td className="p-3 md:p-4">{placement.salary_offered} LPA</td>
                      {/* <td className="p-3 md:p-4">{placement.feedback || 'Not Submitted'}</td> */}
                      <td className="p-3 md:p-4">{placement.status || 'Not Set'}</td>
                      <td className="p-3 md:p-4 text-green-400">
                        {placement.offer_letter_url ? 'Submitted' : 'Not Submitted'}
                      </td>
                      <td className="p-3 md:p-4">
                        <button
                          onClick={() =>
                            placement.offer_letter
                              ? handleViewOfferLetter(placement.offer_letter)
                              : handleOpenModal(
                                  placement.id,
                                  placement.feedback || '',
                                  placement.status || ''
                                )
                          }
                          className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition"
                        >
                          {placement.offer_letter ? 'View' : <Edit />}
                        </button>
                      </td>
                      <td className="p-3 md:p-4">
                        <button
                        
                        onClick={() => {
                            if (placement.offer_letter_url) {
                            const fullUrl = `http://localhost:5000/uploads/${placement.offer_letter_url.replace('\\','/')}`;
                              console.log('Opening offer letter URL:', fullUrl);
                              window.open(fullUrl, '_blank');
                            } else {
                              handleOpenModal(placement.id, placement.feedback || '', placement.placement_status || '');
                            }
                          }}
                          className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition"
                        >
                          {placement.offer_letter_url ? 'View' : <Edit />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal for uploading offer letter, feedback, and placement status */}
          <Modal open={openModal} onClose={handleCloseModal}>
            <Box sx={modalStyle}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Update Placement Details</Typography>
                <IconButton onClick={handleCloseModal}>
                  <CloseIcon />
                </IconButton>
              </Box>
              <TextField
                type="file"
                onChange={handleFileChange}
                fullWidth
                inputProps={{ accept: 'application/pdf' }}
                label="Offer Letter (PDF)"
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
              {/* <TextField
                label="Feedback"
                multiline
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
              /> */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Are you willing to join</InputLabel>
                <Select
                  value={placementStatus}
                  onChange={(e) => setPlacementStatus(e.target.value)}
                  label="Placement Status"
                >
                  <MenuItem value="">Select Status</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                color="primary"
                onClick={handleUploadOfferLetter}
                fullWidth
              >
                Submit
              </Button>
            </Box>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default Offer;