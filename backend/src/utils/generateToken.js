const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

module.exports = generateToken;
