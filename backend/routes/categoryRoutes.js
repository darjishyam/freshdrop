const express = require("express");
const router = express.Router();
const {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} = require("../controllers/categoryController");

const upload = require("../middleware/uploadMiddleware");

// Public route to get all categories
router.get("/", getCategories);

// Admin routes for managing categories
router.post("/", upload.single("image"), createCategory);
router.put("/:id", upload.single("image"), updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;
