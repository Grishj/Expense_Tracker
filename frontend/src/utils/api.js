// frontend/src/utils/api.js
import axios from "axios";

const backend = axios.create({
  baseURL: "http://192.168.1.161:3000/api", // Use your actual IP for device testing
});

export default backend;
