const express = require("express");
const cors = require("cors");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
