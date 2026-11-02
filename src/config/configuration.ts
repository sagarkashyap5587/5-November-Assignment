
import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables from .env
dotenv.config();

const configurationSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(3000),

  MONGO_URI: z.string().min(1, "MONGO_URI is required"),

  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  RABBITMQ_URL: z.string().min(1, "RABBITMQ_URL is required"),

  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),

  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),

  JWT_ACCESS_EXPIRES_IN: z.string().min(1).default("15m"),

  JWT_REFRESH_EXPIRES_IN: z.string().min(1).default("7d"),

  BCRYPT_SALT_ROUNDS: z.coerce
    .number()
    .int()
    .min(10)
    .max(15)
    .default(12),

  CORS_ORIGIN: z.string().url(),

  SMTP_HOST: z.string().min(1),

  SMTP_PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(1025),

  SMTP_USER: z.string().default(""),

  SMTP_PASS: z.string().default(""),

  SMTP_FROM: z.string().min(1),

  LOG_LEVEL: z
    .enum(["error", "warn", "info", "http", "verbose", "debug", "silly"])
    .default("debug")
});

const result = configurationSchema.safeParse(process.env);

if (!result.success) {
  console.error("\n❌ Environment configuration validation failed:\n");

  for (const issue of result.error.issues) {
    console.error(
      `- ${issue.path.join(".")}: ${issue.message}`
    );
  }

  console.error("\nPlease check your .env file.\n");

  process.exit(1);
}

export const ConfigurationFactory = result.data;

export type AppConfiguration = z.infer<
  typeof configurationSchema
>;

console.log("✅ Environment configuration loaded successfully");
