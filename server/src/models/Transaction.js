const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ["debit", "credit"], required: true },
    merchant: { type: String, trim: true, default: "Unknown" },
    description: { type: String, trim: true, default: "" },
    referenceNo: { type: String, trim: true, default: "" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    categorySource: { type: String, enum: ["none", "rule", "user", "ai"], default: "none" },
    source: { type: String, enum: ["manual", "csv", "sms", "seed"], default: "manual" },
    dedupeKey: { type: String, required: true },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, dedupeKey: 1 }, { unique: true });

module.exports = mongoose.model("Transaction", transactionSchema);
