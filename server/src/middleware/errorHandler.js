const notFound = (req, res, next) => {
  res.status(404).json({ message: "Route not found" });
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Server Error";

  if (err.code === 11000) {
    statusCode = 409;
    message = "Email already registered";
  }

  res.status(statusCode).json({ message });
};

module.exports = { notFound, errorHandler };
