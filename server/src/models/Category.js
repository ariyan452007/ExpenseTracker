const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["expense", "income"], default: "expense" },
    color: { type: String, default: "#6366f1" },
    isDefault: { type: Boolean, default: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

categorySchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);
