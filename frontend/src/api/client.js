import axios from "axios";

// Backend base URL
const client = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Attach JWT token automatically if present
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;