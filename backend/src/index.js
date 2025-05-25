require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");

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

// Temporary migration trigger route (for Render deployment)
app.get("/run-migrations", (req, res) => {
  exec("npx prisma migrate deploy", (err, stdout, stderr) => {
    if (err) {
      console.error(`Migration error: ${stderr}`);
      return res.status(500).send("Migration failed");
    }
    console.log(`Migration output: ${stdout}`);
    res.send("Migration successful");
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
