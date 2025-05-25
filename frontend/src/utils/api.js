// frontend/src/utils/api.js
import axios from "axios";

const backend = axios.create({
  baseURL: "https://expense-tracker-t0cj.onrender.com/api", // Use your actual IP for device testing
});

export default backend;
