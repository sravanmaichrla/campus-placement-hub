// src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useState } from "react";
import { logout as logoutAPI, tpoLogout } from "../services/api"; // Import the logout API functions

import axios from "axios";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();



export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("access_token"));
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();


  // useEffect(() => {
  //   const token = localStorage.getItem("access_token");
  //   if (token) {
  //     axios
  //       .get("http://localhost:5000/api/user", {
  //         headers: { Authorization: `Bearer ${token}` },
  //       })
  //       .then((res) => {
  //         setUser(res.data);
  //         setIsLoggedIn(true);
  //       })
  //       .catch((err) => {
  //         console.error("Auth check failed:", err);
  //         localStorage.removeItem("access_token");
  //         setIsLoggedIn(false);
  //         setUser(null);
  //       });
  //   }
  // }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser){ 
      setUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
    }
  }, []);

  const login = async (userData, accessToken) => {

    // console.log(userData);
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setIsLoggedIn(true);
    // console.log(userData);
    if (userData.role === "student") {
      navigate("/student/dashboard");
    } else if (userData.role === "admin" || userData.role === "cdpc") {
      navigate("/tpo/dashboard");
    }
  };

  const logout = async () => {
    try {
      // Call the appropriate logout endpoint based on user role
      const apiCall = user?.role === "student" ? logoutAPI : tpoLogout;
      await apiCall();
    } catch (err) {
      console.error("Logout API call failed:", err.response?.data?.message || err.message);
    } finally {
      // Clear local state and storage regardless of API call success
      setUser(null);
      setToken(null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout ,isLoggedIn,setIsLoggedIn}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);