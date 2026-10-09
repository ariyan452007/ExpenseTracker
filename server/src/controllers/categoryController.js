const Category = require("../models/Category");

const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({
      $or: [{ user: null }, { user: req.user._id }],
    }).sort({ name: 1 });
    res.status(200).json({ categories });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCategories };
