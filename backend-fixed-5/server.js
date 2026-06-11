/**
 * server.js — Samvardhan Bloom Backend v3.0
 * Fixed for Hostinger deployment
 */

require("dotenv").config();

const express       = require("express");
const helmet        = require("helmet");
const cors          = require("cors");
const rateLimit     = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const morgan        = require("morgan");
const cookieParser  = require("cookie-parser");

const connectDB    = require("./config/db");
const seedAdmin    = require("./config/seedAdmin");
const logger       = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");
const ApiResponse  = require("./utils/ApiResponse");

const authRoutes    = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

// FIX #1: trust proxy — MUST be first, before any middleware
app.set("trust proxy", 1);

// Security headers
app.use(helmet());

// CORS — reads from env, defaults to common origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:3000")
  .split(",").map((o) => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: "Too many login attempts. Please wait 15 minutes." },
});

app.use("/api", apiLimiter);
app.use("/api/auth/login", authLimiter);

// Body parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// NoSQL injection sanitization
app.use(mongoSanitize());

// HTTP logging
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined", { stream: { write: (msg) => logger.http(msg.trim()) } }));
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    status: "ok",
    service: "Samvardhan Bloom Backend v3",
    razorpay: !!process.env.RAZORPAY_KEY_ID,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Routes
app.use("/api/auth",           authRoutes);
app.use("/api/bookings",       bookingRoutes.publicRouter);
app.use("/api/chat",           chatbotRoutes);
app.use("/api/payments",       paymentRoutes.publicRouter);
app.use("/api/admin/payments", paymentRoutes.adminRouter);
app.use("/api/admin/bookings", bookingRoutes.adminRouter);

// 404
app.use("*", (req, res) => {
  ApiResponse.error(res, 404, `Route ${req.method} ${req.originalUrl} not found.`);
});

// Global error handler
app.use(errorHandler);

// FIX #2: bind to 0.0.0.0 so Hostinger's nginx can reach it
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

const startServer = async () => {
  await connectDB();
  await seedAdmin();

  const server = app.listen(PORT, HOST, () => {
    logger.info(`Server running on ${HOST}:${PORT} [${process.env.NODE_ENV}]`);
    logger.info(`Health: http://${HOST}:${PORT}/api/health`);
    logger.info(`Razorpay: ${process.env.RAZORPAY_KEY_ID ? "configured" : "not configured"}`);
  });

  const gracefulShutdown = (signal) => {
    logger.info(`${signal} received — shutting down`);
    server.close(() => { logger.info("Server closed."); process.exit(0); });
    setTimeout(() => { logger.error("Force kill."); process.exit(1); }, 10_000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT",  () => gracefulShutdown("SIGINT"));
  process.on("unhandledRejection", (err) => {
    logger.error("Unhandled Rejection:", err);
    gracefulShutdown("unhandledRejection");
  });
};

startServer();
