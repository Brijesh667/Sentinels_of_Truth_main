const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
import axios from "axios";
const axiosClient = axios.create({
  baseURL:BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosClient;
