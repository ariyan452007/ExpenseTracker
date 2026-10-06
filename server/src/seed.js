const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("./models/User");
const Category = require("./models/Category");
const Transaction = require("./models/Transaction");

const categoriesData = [
  { name: "Food & Dining", type: "expense", color: "#f87171" },
  { name: "Transport", type: "expense", color: "#60a5fa" },
  { name: "Shopping", type: "expense", color: "#a78bfa" },
  { name: "Bills & Utilities", type: "expense", color: "#facc15" },
  { name: "Entertainment", type: "expense", color: "#fb923c" },
  { name: "Groceries", type: "expense", color: "#4ade80" },
  { name: "Health", type: "expense", color: "#f472b6" },
  { name: "Cash", type: "expense", color: "#94a3b8" },
  { name: "Transfers", type: "expense", color: "#2dd4bf" },
  { name: "Salary", type: "income", color: "#34d399" },
  { name: "Refunds", type: "income", color: "#818cf8" },
  { name: "Uncategorized", type: "expense", color: "#d1d5db" },
];

const spendingConfig = [
  { category: "Food & Dining", merchants: ["Swiggy", "Zomato", "Starbucks", "Cafe Coffee Day"], min: 150, max: 600 },
  { category: "Transport", merchants: ["Uber", "Ola", "Rapido", "IRCTC"], min: 80, max: 900 },
  { category: "Shopping", merchants: ["Amazon", "Flipkart", "Myntra"], min: 500, max: 3000 },
  { category: "Bills & Utilities", merchants: ["Jio", "Airtel", "Electricity Board"], min: 299, max: 1900 },
  { category: "Entertainment", merchants: ["Netflix", "Spotify", "BookMyShow"], min: 119, max: 700 },
  { category: "Groceries", merchants: ["BigBasket", "DMart"], min: 600, max: 2000 },
  { category: "Health", merchants: ["Apollo Pharmacy"], min: 100, max: 800 },
  { category: "Cash", merchants: ["ATM Withdrawal"], min: 500, max: 3000 },
];

const getRandomAmount = (min, max) => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
};

const getRandomDate = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Delete existing
    await Transaction.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});

    // Create User
    const user = await User.create({
      name: "Demo User",
      email: "demo@example.com",
      password: "Demo@1234",
    });

    // Create Categories
    const categoriesToInsert = categoriesData.map((c) => ({
      ...c,
      isDefault: true,
      user: null,
    }));
    const categories = await Category.insertMany(categoriesToInsert);

    const categoryMap = {};
    categories.forEach((c) => {
      categoryMap[c.name] = c._id;
    });

    // Create Transactions
    const transactions = [];
    let dedupeIndex = 1;

    // 97 random spending transactions
    for (let i = 0; i < 97; i++) {
      const config = spendingConfig[Math.floor(Math.random() * spendingConfig.length)];
      const merchant = config.merchants[Math.floor(Math.random() * config.merchants.length)];
      const amount = getRandomAmount(config.min, config.max);
      const date = getRandomDate(90);

      transactions.push({
        user: user._id,
        date,
        amount,
        type: "debit",
        merchant,
        category: categoryMap[config.category],
        categorySource: "rule",
        source: "seed",
        dedupeKey: `seed-${dedupeIndex++}`,
      });
    }

    // 3 salary transactions (1 per month for last 3 months)
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      transactions.push({
        user: user._id,
        date,
        amount: 25000,
        type: "credit",
        merchant: "Employer",
        description: "Monthly Salary",
        category: categoryMap["Salary"],
        categorySource: "rule",
        source: "seed",
        dedupeKey: `seed-${dedupeIndex++}`,
      });
    }

    await Transaction.insertMany(transactions);

    console.log(`Users created: 1`);
    console.log(`Categories created: ${categories.length}`);
    console.log(`Transactions created: ${transactions.length}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seedDatabase();
