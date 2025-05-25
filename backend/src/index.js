require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const expenseRoutes = require("./routes/expenses");
const categoryRoutes = require("./routes/categories");
const profileRoutes = require("./routes/profile");

const app = express();

// Configure CORS for React Native frontend
app.use(
  cors({
    origin: ["http://192.168.1.161:3000", "http://localhost:3000"], // Add frontend origins
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/profile", profileRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
