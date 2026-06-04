// src/app.js

import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import passport from "passport";
import httpStatus from "http-status";
import config from "./config/config.js";
import morgan from "./config/morgan.js";
import jwtStrategy from "./config/passport.js";
import routes from "./routes/index.js";
import { errorConverter, errorHandler } from "./middlewares/error.js";
import ApiError from "./utils/ApiError.js";
import setupSwagger from "./docs/swaggerConfig.js";
import { sanitize } from "./middlewares/sanitizeXss.js";
import logger from "./config/logger.js";

const app = express();

// HTTP logging
if (config.env !== "test") {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
  logger.info(`Morgan logging enabled. Environment: ${config.env}`);
}

// CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: true,
  }),
);

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  }),
);

// Parse JSON & URL Encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// XSS Sanitize & Gzip Compression
app.use(sanitize);
app.use(compression());

// Serve static files from 'public' directory
app.use(express.static("public"));

// Root health-check endpoints
app.get("/", (req, res) => {
  res.send({ status: "ok", message: "Capstone API Server is Running" });
});

app.get("/health", (req, res) => {
  res.send({ status: "ok", timestamp: new Date().toISOString() });
});

// Passport JWT
app.use(passport.initialize());
passport.use("jwt", jwtStrategy);

// Swagger API Docs
setupSwagger(app);

// API Routes
app.use("/", routes);
// app.options("(.*)", cors()); // Redundant and incompatible with Express 5 wildcard syntax

// 404 Not Found
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, "Not found"));
});

// Error Handling
app.use(errorConverter);
app.use(errorHandler);

export default app;
