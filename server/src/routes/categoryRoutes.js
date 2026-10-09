const express = require("express");
const router = express.Router();
const { getCategories } = require("../controllers/categoryController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/", getCategories);

module.exports = router;
