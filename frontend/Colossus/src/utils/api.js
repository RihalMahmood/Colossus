//Centralized API client with JWT handling and error interception
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

//Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("colossus_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

//Handle 401 — clear storage and redirect
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("colossus_token");
      localStorage.removeItem("colossus_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
