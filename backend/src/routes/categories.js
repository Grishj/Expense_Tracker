// backend/src/routes/categories.js
const express = require("express");
const auth = require("../middleware/authMiddleware");
const prisma = require("../utils/prismaClient");

const router = express.Router();
const prisma = new PrismaClient();

// GET all categories
router.get("/", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    });
    res.json(categories);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET a single category by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(category);
  } catch (err) {
    console.error("Error fetching category:", err);
    res.status(500).json({ error: err.message });
  }
});

// CREATE a new category
router.post("/", auth, async (req, res) => {
  const { name, icon, color } = req.body;

  // Validation
  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Category name is required" });
  }

  try {
    // Check if category with this name already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: "insensitive",
        },
      },
    });

    if (existingCategory) {
      return res
        .status(409)
        .json({ error: "Category with this name already exists" });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        icon: icon || "category",
        color: color || "#6B7280",
      },
    });

    res.status(201).json(category);
  } catch (err) {
    console.error("Error creating category:", err);
    res.status(500).json({ error: err.message });
  }
});

// CREATE multiple categories at once (for initial setup)
router.post("/bulk", auth, async (req, res) => {
  const { categories } = req.body;

  if (!Array.isArray(categories) || categories.length === 0) {
    return res.status(400).json({ error: "Categories array is required" });
  }

  try {
    // Validate each category
    for (const cat of categories) {
      if (!cat.name || cat.name.trim() === "") {
        return res
          .status(400)
          .json({ error: "All categories must have a name" });
      }
    }

    // Create categories
    const createdCategories = await prisma.$transaction(
      categories.map((cat) =>
        prisma.category.create({
          data: {
            name: cat.name.trim(),
            icon: cat.icon || "category",
            color: cat.color || "#6B7280",
          },
        })
      )
    );

    res.status(201).json(createdCategories);
  } catch (err) {
    console.error("Error creating categories:", err);
    if (err.code === "P2002") {
      res.status(409).json({ error: "One or more categories already exist" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// UPDATE a category
router.put("/:id", auth, async (req, res) => {
  const { name, icon, color } = req.body;
  const { id } = req.params;

  // Validation
  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Category name is required" });
  }

  try {
    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Check if another category with this name already exists (excluding current one)
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: "insensitive",
        },
        NOT: { id },
      },
    });

    if (duplicateCategory) {
      return res
        .status(409)
        .json({ error: "Category with this name already exists" });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        icon: icon || existingCategory.icon,
        color: color || existingCategory.color,
      },
    });

    res.json(category);
  } catch (err) {
    console.error("Error updating category:", err);
    if (err.code === "P2025") {
      res.status(404).json({ error: "Category not found" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// DELETE a category
router.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;

  try {
    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    });

    if (!existingCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Check if category has associated expenses
    if (existingCategory._count.expenses > 0) {
      return res.status(409).json({
        error: `Cannot delete category. It has ${existingCategory._count.expenses} associated expenses.`,
        hasExpenses: true,
        expenseCount: existingCategory._count.expenses,
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    res.json({
      message: "Category deleted successfully",
      deletedCategory: existingCategory.name,
    });
  } catch (err) {
    console.error("Error deleting category:", err);
    if (err.code === "P2025") {
      res.status(404).json({ error: "Category not found" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// FORCE DELETE a category (removes category and reassigns expenses to "Other")
router.delete("/:id/force", auth, async (req, res) => {
  const { id } = req.params;

  try {
    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Find or create "Other" category
    let otherCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: "Other",
          mode: "insensitive",
        },
      },
    });

    if (!otherCategory) {
      otherCategory = await prisma.category.create({
        data: {
          name: "Other",
          icon: "category",
          color: "#6B7280",
        },
      });
    }

    // Use transaction to update expenses and delete category
    await prisma.$transaction([
      // Update all expenses to use "Other" category
      prisma.expense.updateMany({
        where: { categoryId: id },
        data: { categoryId: otherCategory.id },
      }),
      // Delete the category
      prisma.category.delete({
        where: { id },
      }),
    ]);

    res.json({
      message:
        "Category deleted successfully. Associated expenses moved to 'Other' category.",
      deletedCategory: existingCategory.name,
      movedToCategory: otherCategory.name,
    });
  } catch (err) {
    console.error("Error force deleting category:", err);
    res.status(500).json({ error: err.message });
  }
});

// Initialize default categories
router.post("/initialize", auth, async (req, res) => {
  try {
    // Check if any categories exist
    const existingCategories = await prisma.category.count();

    if (existingCategories > 0) {
      return res.status(409).json({
        error:
          "Categories already exist. Use bulk create for additional categories.",
        existingCount: existingCategories,
      });
    }

    const defaultCategories = [
      { name: "Food", icon: "restaurant", color: "#EF4444" },
      { name: "Transport", icon: "directions-car", color: "#3B82F6" },
      { name: "Shopping", icon: "shopping-bag", color: "#8B5CF6" },
      { name: "Entertainment", icon: "movie", color: "#F59E0B" },
      { name: "Utilities", icon: "house", color: "#10B981" },
      { name: "Health", icon: "medical-services", color: "#EC4899" },
      { name: "Education", icon: "school", color: "#6366F1" },
      { name: "Other", icon: "category", color: "#6B7280" },
    ];

    const createdCategories = await prisma.$transaction(
      defaultCategories.map((cat) =>
        prisma.category.create({
          data: cat,
        })
      )
    );

    res.status(201).json({
      message: "Default categories initialized successfully",
      categories: createdCategories,
    });
  } catch (err) {
    console.error("Error initializing categories:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
