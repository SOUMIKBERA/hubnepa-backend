const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Routes
const authRoutes = require("./modules/auth/auth.routes");

app.use("/api/v1/auth", authRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("Hubnepa API Running...");
});

// Error handler
const errorHandler = require("./middlewares/error.middleware");
app.use(errorHandler);

module.exports = app;