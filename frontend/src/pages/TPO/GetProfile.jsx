import { Alert, Button, Card, Col, Container, ListGroup, Row, Spinner } from 'react-bootstrap';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";

import Sidebar from '../../components/common/Sidebar';
import axios from 'axios';

// Axios instance with base URL and token interceptor
const api = axios.create({
  baseURL: "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Custom CSS for styling the profile card
const styles = `
  .profile-container {
    display: flex;
    min-height: 100vh;
    background-color: #f4f6f9;
  }

  .profile-content {
    flex: 1;
    padding: 40px;
    margin-left: 250px; /* Adjust based on your Sidebar width */
  }

  .profile-card {
    border: none;
    border-radius: 15px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    background: linear-gradient(145deg, #ffffff, #f8f9fa);
    transition: transform 0.3s ease;
  }

  .profile-card:hover {
    transform: translateY(-5px);
  }

  .profile-picture-container {
    position: relative;
    padding:10px;
    margin-bottom: 20px;
  }

  .profile-picture {
    height:100%;
    width:100%;
    box-shadow: 0 4px 10px rgba(0, 123, 255, 0.2);
    transition: transform 0.3s ease;
  }

  .profile-picture:hover {
    transform: scale(1.05);
  }

  .profile-placeholder {
    border: 4px solid #6c757d;
    box-shadow: 0 4px 10px rgba(108, 117, 125, 0.2);
  }

  .profile-name {
    font-size: 1.8rem;
    font-weight: 600;
    color: #343a40;
    margin:0;
    margin-bottom: 5px;
  }

  .profile-email {
    font-size: 1rem;
    color: #6c757d;
    margin-bottom: 10px;
  }

  .profile-contact {
    font-size: 1rem;
    color: #495057;
  }

  .section-title {
    font-size: 1.3rem;
    font-weight: 600;
    color: #007bff;
    border-bottom: 2px solid #007bff;
    padding-bottom: 5px;
    margin-bottom: 15px;
  }

  .list-group-item {
    border: none;
    padding: 10px 0;
    font-size: 1rem;
    color: #495057;
  }

  .list-group-item p {
    color: #343a40;
    font-weight: 500;
  }

  .skills-text {
    font-size: 1rem;
    color: #495057;
  }

  .btn-link {
    color: #007bff;
    font-weight: 500;
    transition: color 0.3s ease;
  }

  .btn-link:hover {
    color: #0056b3;
    text-decoration: underline;
  }
   .bold{
    font-weight: bold;
   } 
  .no-data-text {
    font-size: 1rem;
    color: #6c757d;
    font-style: italic;
  }

  @media (max-width: 768px) {
    .profile-content {
      margin-left: 0;
      padding: 20px;
    }

    .profile-card {
      margin-bottom: 20px;
    }
  }
`;

const GetProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const { student_id } = useParams();
  console.log(student_id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Make the API call to get the profile details
        const response = await api.get(`/auth/profile/${student_id}`);
        console.log(response);
        setProfileData(response.data.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch profile details');
        setLoading(false);
      }
    };

    fetchProfile();
  }, [student_id]); // Re-run when student_id changes

  // Render loading state
  if (loading) {
    return (
      <div className="profile-container">
        <Sidebar />
        <Container className="profile-content text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </Container>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="profile-container">
        <Sidebar />
        <Container className="profile-content">
          <Alert variant="danger">{error}</Alert>
        </Container>
      </div>
    );
  }

  // Render the profile details
  return (
    <div className="profile-container">
      <Sidebar />
      <Container className="profile-content">
        <h1 className="mb-4">Student Profile</h1>
        {profileData ? (
          <Row>
            {/* Left Column: Personal Details and Picture */}
            <Col md={4}>
              <Card className="profile-card mb-4">
                <Card.Body className="text-center">
                  <div className="profile-picture-container">
                    {profileData.picture ? (
                      <img
                        src={`http://localhost:5000/uploads/${profileData.picture}`}
                        alt="Profile"
                        className="rounded-circle mb-3 profile-picture"
                        style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        className="rounded-circle bg-secondary mb-3 d-flex align-items-center justify-content-center profile-placeholder"
                        style={{ width: '150px', height: '150px' }}
                      >
                        <span className="text-white" style={{ fontSize: '2rem' }}>
                          {profileData.first_name[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <h4 className="profile-name">
                    {profileData.first_name} {profileData.last_name}
                  </h4>
                  <p className="profile-email">{profileData.email}</p>
                  <p className="profile-contact">
                        Contact: {profileData.contact_no || 'Not provided'}
                  </p>
                </Card.Body>
              </Card>
            </Col>

            {/* Right Column: Profile Details */}
            <Col md={8}>
              {/* Personal Details */}
              <Card className="profile-card mb-4 p-5">
                <Card.Body>
                  <h5 className="section-title">Personal Details</h5>
                  <ListGroup variant="flush">
                    <ListGroup.Item>
                      <p className='bold'>Date of Birth:</p> {profileData.dob || 'Not provided'}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <p>Gender:</p> {profileData.gender || 'Not provided'}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <p>Registration No:</p> {profileData.reg_no}
                    </ListGroup.Item>
                  </ListGroup>
                </Card.Body>
              </Card>

              {/* Academic Details */}
              <Card className="profile-card mb-4 p-5">
                <Card.Body>
                  <h5 className="section-title">Academic Details</h5>
                  <ListGroup variant="flush">
                    <ListGroup.Item>
                      <p>Batch:</p> {profileData.batch}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <p>Degree:</p> {profileData.degree}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <p>Specialization:</p> {profileData.specialization}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <p>Current GPA:</p> {profileData.current_gpa || 'Not provided'}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <p>Backlogs:</p> {profileData.backlogs || 0}
                    </ListGroup.Item>
                  </ListGroup>
                </Card.Body>
              </Card>

              {/* Skills */}
              <Card className="profile-card mb-4 p-5">
                <Card.Body>
                  <h5 className="section-title">Skills</h5>
                  {profileData.skills && profileData.skills.length > 0 ? (
                    <p className="skills-text">{profileData.skills.join(', ')}</p>
                  ) : (
                    <p className="no-data-text">No skills listed</p>
                  )}
                </Card.Body>
              </Card>

              {/* Resume and Certificates */}
              <Card className="profile-card mb-4 p-5">
                <Card.Body>
                  <h5 className="section-title">Documents</h5>
                  <ListGroup variant="flush">
                    <ListGroup.Item>
                      <p>Resume:</p>{' '}
                      {profileData.resume_url ? (
                        <Button
                          variant="link"
                          href={`http://localhost:5000/uploads/${profileData.resume_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-link"
                        >
                          View Resume
                        </Button>
                      ) : (
                        <span className="no-data-text">Not uploaded</span>
                      )}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <p>Certificates:</p>{' '}
                      {profileData.certificate_urls && profileData.certificate_urls.length > 0 ? (
                              <Button
                                variant="link"
                                href={`http://localhost:5000/uploads/${profileData.certificate_urls}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-link"
                              >
                                View Certificate 
                              </Button>
                      ) : (
                        <span className="no-data-text">No certificates uploaded</span>
                      )}
                    </ListGroup.Item>
                  </ListGroup>
                </Card.Body>
              </Card>

              {/* Placement Details */}
              <Card className="profile-card mb-4 p-5">
                <Card.Body>
                  <h5 className="section-title">Placement Details</h5>
                  {profileData.placement ? (
                    <ListGroup variant="flush">
                      <ListGroup.Item>
                        <p>Company:</p> {profileData.placement.company_name}
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <p>Job Role:</p> {profileData.placement.job_role}
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <p>Salary Offered:</p>{' '}
                        {profileData.placement.salary_offered
                          ? `${profileData.placement.salary_offered} LPA`
                          : 'Not specified'}
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <p>Date of Interview:</p>{' '}
                        {profileData.placement.date_of_interview || 'Not specified'}
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <p>Joining Date:</p>{' '}
                        {profileData.placement.joining_date || 'Not specified'}
                      </ListGroup.Item>
                      {/* <ListGroup.Item>
                        <p>Placement Status:</p> {profileData.placement.placement_status === 'Yes' ? 'Placed' : 'Not Placed'}
                      </ListGroup.Item> */}
                      <ListGroup.Item>
                        <p>Offer Letter:</p>{' '}
                        {profileData.placement.offer_letter_url ? (
                          <Button
                            variant="link"
                            href={`http://localhost:5000/uploads/${profileData.offer_letter_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-link"
                          >
                            View Offer Letter
                          </Button>
                        ) : (
                          <span className="no-data-text">Not uploaded</span>
                        )}
                      </ListGroup.Item>
                    </ListGroup>
                  ) : (
                    <p className="no-data-text">Not placed yet</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        ) : (
          <Alert variant="info">No profile data available.</Alert>
        )}
      </Container>
    </div>
  );
};

// Inject the custom styles into the document
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default GetProfile;