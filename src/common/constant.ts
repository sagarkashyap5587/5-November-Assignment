
export const APP_CONSTANTS = {
  API_PREFIX: "/api/v1",
  HEALTH_ROUTE: "/health",
  DEFAULT_PORT: 3000
} as const;

export const AUTH_CONSTANTS = {
  ACCESS_TOKEN_EXPIRY: "15m",
  REFRESH_TOKEN_EXPIRY: "7d",
  ACCESS_TOKEN_HEADER: "x-access-token",
  REFRESH_TOKEN_HEADER: "x-refresh-token",
  AUTHORIZATION_HEADER: "authorization",
  BEARER_PREFIX: "Bearer"
} as const;

export const DEVICE_CONSTANTS = {
  DEVICE_ID: "device_id",
  DEVICE_TYPE: "device_type",
  TIMEZONE: "timezone",
  LANG: "lang",
  SUPPORTED_DEVICE_TYPES: [1, 2, 3] as const,
  SUPPORTED_LANGUAGES: ["en", "hi"] as const
} as const;

export const PAGINATION_CONSTANTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_ORDER: "desc"
} as const;

export const MONEY_CONSTANTS = {
  PAISE_PER_RUPEE: 100
} as const;

export const RATE_LIMIT_CONSTANTS = {
  MAX_LOGIN_ATTEMPTS: 5,
  WINDOW_SECONDS: 60
} as const;

export const REDIS_CONSTANTS = {
  SESSION_PREFIX: "session:",
  REFRESH_TOKEN_PREFIX: "refresh:",
  GROUP_BALANCE_PREFIX: "balances:",
  EXPORT_PROGRESS_PREFIX: "export:"
} as const;

export const QUEUE_CONSTANTS = {
  EXCHANGE_NAME: "splitease.events",
  DEAD_LETTER_EXCHANGE: "splitease.dead-letter",
  EXPENSE_CREATED: "expense.created",
  EXPENSE_UPDATED: "expense.updated",
  EXPENSE_DELETED: "expense.deleted",
  SETTLEMENT_CREATED: "settlement.created",
  MEMBER_ADDED: "member.added"
} as const;
