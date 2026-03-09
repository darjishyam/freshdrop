const express = require("express");
const router = express.Router();
const {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} = require("../controllers/categoryController");

// Public route to get all categories
router.get("/", getCategories);

// Admin routes for managing categories
// In a full implementation, these should be protected by auth middleware
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;
