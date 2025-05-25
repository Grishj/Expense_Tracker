// backend/src/routes/expenses.js
const express = require("express");
const auth = require("../middleware/authMiddleware");
const prisma = require("../utils/prismaClient");

const router = express.Router();
const prisma = new PrismaClient();

// CREATE an expense
router.post("/", auth, async (req, res) => {
  const { title, amount, date, categoryId } = req.body;
  try {
    const expense = await prisma.expense.create({
      data: {
        title,
        amount: parseFloat(amount),
        date: new Date(date),
        userId: req.user,
        categoryId,
      },
    });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ all expenses
router.get("/", auth, async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { userId: req.user },
      include: { category: true },
      orderBy: { date: "desc" },
    });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE an expense
router.put("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { title, amount, date, categoryId } = req.body;
  try {
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        title,
        amount: parseFloat(amount),
        date: new Date(date),
        categoryId,
      },
    });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE an expense
router.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.expense.delete({ where: { id } });
    res.json({ message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
