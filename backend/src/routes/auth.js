const express = require("express");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("../../generated/prisma");
const generateToken = require("../utils/generateToken");
const validator = require("validator");

const router = express.Router();
const prisma = new PrismaClient();

// POST /register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  // Input validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  try {
    // Check for existing user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    // Generate token
    const token = generateToken(user.id);
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      message: "User Registered Successfull",

      token,
    });
  } catch (err) {
    console.error("Registration error:", err); // Log for debugging
    if (err.code === "P2002") {
      return res.status(400).json({ message: "Email already in use" });
    }
    res.status(500).json({ error: "Server error, please try again later" });
  }
});

// POST /login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user.id);
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      message: "User Login Successfull",

      token,
    });
  } catch (err) {
    console.error("Login error:", err); // Log for debugging
    res.status(500).json({ error: "Server error, please try again later" });
  }
});

module.exports = router;
