const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const mongoose = require("mongoose");
const crypto = require("crypto");

const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

const getTransactions = async (req, res, next) => {
  try {
    const { from, to, type, category, search, minAmount, maxAmount, sort, page, limit } = req.query;
    
    const query = { user: req.user._id };

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.date.$lte = toDate;
      }
    }

    if (type) query.type = type;
    if (category) query.category = category;

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [{ merchant: regex }, { description: regex }];
    }

    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = Number(minAmount);
      if (maxAmount) query.amount.$lte = Number(maxAmount);
    }

    let sortOption = { date: -1 };
    if (sort) {
      if (sort === "date") sortOption = { date: 1 };
      else if (sort === "-date") sortOption = { date: -1 };
      else if (sort === "amount") sortOption = { amount: 1 };
      else if (sort === "-amount") sortOption = { amount: -1 };
    }

    const pageNum = parseInt(page, 10) || 1;
    let limitNum = parseInt(limit, 10) || 20;
    if (limitNum > 100) limitNum = 100;

    const skip = (pageNum - 1) * limitNum;

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .populate("category", "name color type");

    res.status(200).json({
      transactions,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
};

const getTransaction = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("category", "name color type");

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({ transaction });
  } catch (error) {
    next(error);
  }
};

const createTransaction = async (req, res, next) => {
  try {
    const { date, amount, type, merchant, description, referenceNo, category } = req.body;

    if (!date || amount === undefined || !type || !merchant) {
      return res.status(400).json({ message: "date, amount, type, and merchant are required" });
    }

    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ message: "amount must be a number greater than 0" });
    }

    if (type !== "debit" && type !== "credit") {
      return res.status(400).json({ message: "type must be debit or credit" });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date" });
    }

    let categorySource = "none";
    if (category) {
      if (!mongoose.isValidObjectId(category)) {
        return res.status(400).json({ message: "Invalid category" });
      }
      const catObj = await Category.findById(category);
      if (!catObj || (catObj.user !== null && catObj.user.toString() !== req.user._id.toString())) {
        return res.status(400).json({ message: "Invalid category" });
      }
      categorySource = "user";
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      date: parsedDate,
      amount,
      type,
      merchant,
      description: description || "",
      referenceNo: referenceNo || "",
      category: category || null,
      categorySource,
      source: "manual",
      dedupeKey: `manual-${crypto.randomUUID()}`,
    });

    res.status(201).json({ transaction });
  } catch (error) {
    next(error);
  }
};

const updateTransaction = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const { date, amount, type, merchant, description, referenceNo, category } = req.body;

    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) return res.status(400).json({ message: "Invalid date" });
      transaction.date = parsedDate;
    }

    if (amount !== undefined) {
      if (typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ message: "amount must be a number greater than 0" });
      }
      transaction.amount = amount;
    }

    if (type !== undefined) {
      if (type !== "debit" && type !== "credit") {
        return res.status(400).json({ message: "type must be debit or credit" });
      }
      transaction.type = type;
    }

    if (merchant !== undefined) transaction.merchant = merchant;
    if (description !== undefined) transaction.description = description;
    if (referenceNo !== undefined) transaction.referenceNo = referenceNo;

    if (category !== undefined) {
      if (category === null) {
        transaction.category = null;
        transaction.categorySource = "none";
      } else {
        if (!mongoose.isValidObjectId(category)) {
          return res.status(400).json({ message: "Invalid category" });
        }
        const catObj = await Category.findById(category);
        if (!catObj || (catObj.user !== null && catObj.user.toString() !== req.user._id.toString())) {
          return res.status(400).json({ message: "Invalid category" });
        }
        transaction.category = category;
        transaction.categorySource = "user";
      }
    }

    await transaction.save();

    await transaction.populate("category", "name color type");

    res.status(200).json({ transaction });
  } catch (error) {
    next(error);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({ message: "Transaction deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
