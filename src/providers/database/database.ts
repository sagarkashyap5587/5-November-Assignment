import mongoose from "mongoose";
import { ConfigurationFactory } from "../../config/configuration.js";
import logger from "../../logger/logger.js";

class DatabaseConnection {
  async connect(): Promise<void> {
    try {
      if (mongoose.connection.readyState === 1) {
        logger.info("MongoDB is already connected");
        return;
      }

      const mongoUri = ConfigurationFactory.MONGO_URI;

      await mongoose.connect(mongoUri);

      logger.info("MongoDB connected successfully");
    } catch (error: unknown) {
      logger.error("MongoDB connection failed", {
        error:
          error instanceof Error ? error.message : "Unknown database error",
      });

      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (mongoose.connection.readyState === 0) {
        return;
      }

      await mongoose.disconnect();

      logger.info("MongoDB disconnected successfully");
    } catch (error: unknown) {
      logger.error("MongoDB disconnection failed", {
        error:
          error instanceof Error ? error.message : "Unknown database error",
      });

      throw error;
    }
  }

  getConnectionStatus(): boolean {
    return mongoose.connection.readyState === 1;
  }
}

export const databaseConnection = new DatabaseConnection();
