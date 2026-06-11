const mongoose = require("mongoose");
const logger = require("../utils/logger");

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

const connectDB = async (attempt = 1) => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 8 defaults are sensible; add overrides here if needed.
    });

    logger.info(`MongoDB connected ✅  Host: ${conn.connection.host}`);

    // Mongoose event listeners 
    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected. Attempting reconnect…");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected ✅");
    });

    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error:", err);
    });

  } catch (err) {
    logger.error(`MongoDB connection attempt ${attempt} failed: ${err.message}`);

    if (attempt < MAX_RETRIES) {
      logger.info(`Retrying in ${RETRY_DELAY_MS / 1000}s… (${attempt}/${MAX_RETRIES})`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return connectDB(attempt + 1);
    }

    logger.error("Max DB retries reached. Shutting down.");
    process.exit(1);
  }
};

module.exports = connectDB;
