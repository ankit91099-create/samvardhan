const Admin = require("../models/Admin");
const logger = require("../utils/logger");

const seedAdmin = async () => {
  try {
    const count = await Admin.countDocuments();

    if (count > 0) {
      logger.info("Admin accounts already exist — skipping seed.");
      return;
    }

    const email = process.env.ADMIN_SEED_EMAIL;
    const password = process.env.ADMIN_SEED_PASSWORD;

    if (!email || !password) {
      logger.warn("ADMIN_SEED_EMAIL or ADMIN_SEED_PASSWORD not set in .env — skipping admin seed.");
      return;
    }

    await Admin.create({
      name: "Super Admin",
      email,
      password, // hashed by pre-save hook
      role: "superadmin",
    });

    logger.info(`✅ Default admin created: ${email}`);
    logger.warn("⚠️  Change the default admin password immediately after first login!");

  } catch (err) {
    logger.error("Failed to seed admin:", err);
  }
};

module.exports = seedAdmin;
