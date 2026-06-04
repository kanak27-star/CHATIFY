import axios from "axios";

// Use VITE_API_BASE_URL when provided; otherwise use relative '/api' so Vite dev proxy can forward requests
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send cookies with the request
});