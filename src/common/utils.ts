
import { MONEY_CONSTANTS, PAGINATION_CONSTANTS } from "./constant.js";

// -------------------------------
// MONEY HELPERS
// -------------------------------

export const rupeesToPaise = (rupees: string | number): number => {
  const value = String(rupees).trim();

  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    throw new Error("Invalid rupee amount");
  }

  const [wholePart, decimalPart = ""] = value.split(".");

  const rupeesValue = Number(wholePart);
  const paiseValue = Number(decimalPart.padEnd(2, "0"));

  const totalPaise =
    rupeesValue * MONEY_CONSTANTS.PAISE_PER_RUPEE + paiseValue;

  if (!Number.isSafeInteger(totalPaise)) {
    throw new Error("Money amount exceeds safe integer range");
  }

  return totalPaise;
};

export const paiseToRupees = (paise: number): string => {
  if (!Number.isSafeInteger(paise) || paise < 0) {
    throw new Error("Invalid paise amount");
  }

  const rupees = Math.floor(
    paise / MONEY_CONSTANTS.PAISE_PER_RUPEE
  );

  const remainingPaise =
    paise % MONEY_CONSTANTS.PAISE_PER_RUPEE;

  return `${rupees}.${String(remainingPaise).padStart(2, "0")}`;
};

// -------------------------------
// EQUAL SPLIT CALCULATION
// -------------------------------

export const calculateEqualSplit = (
  amount: number,
  participants: string[]
): { userId: string; share: number }[] => {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error("Amount must be a positive integer in paise");
  }

//   if (participants.length === 0) {
//     throw new Error("At least one participant is required");
//   }

  if (new Set(participants).size !== participants.length) {
    throw new Error("Duplicate participants are not allowed");
  }

  if (participants.length > amount) {
    throw new Error(
      "Amount must be at least equal to the number of participants in paise"
    );
  }

  const baseShare = Math.floor(amount / participants.length);
  const remainder = amount % participants.length;

  return participants.map((userId, index) => ({
    userId,
    share: baseShare + (index < remainder ? 1 : 0)
  }));
};

// -------------------------------
// SPLIT TOTAL VALIDATION
// -------------------------------

export const validateSplitTotal = (
  amount: number,
  shares: number[]
): boolean => {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return false;
  }

  if (shares.length === 0) {
    return false;
  }

  if (
    shares.some(
      (share) => !Number.isSafeInteger(share) || share < 0
    )
  ) {
    return false;
  }

  return shares.reduce((total, share) => total + share, 0) === amount;
};

// -------------------------------
// PAGINATION HELPERS
// -------------------------------

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const getPagination = (
  page?: string | number,
  limit?: string | number
): PaginationOptions => {
  const parsedPage = Number(page ?? PAGINATION_CONSTANTS.DEFAULT_PAGE);
  const parsedLimit = Number(limit ?? PAGINATION_CONSTANTS.DEFAULT_LIMIT);

  if (
    !Number.isSafeInteger(parsedPage) ||
    parsedPage < 1
  ) {
    throw new Error("Page must be a positive integer");
  }

  if (
    !Number.isSafeInteger(parsedLimit) ||
    parsedLimit < 1
  ) {
    throw new Error("Limit must be a positive integer");
  }

  const normalizedLimit = Math.min(
    parsedLimit,
    PAGINATION_CONSTANTS.MAX_LIMIT
  );

  return {
    page: parsedPage,
    limit: normalizedLimit,
    skip: (parsedPage - 1) * normalizedLimit
  };
};

export const getPaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    !Number.isSafeInteger(total) ||
    total < 0
  ) {
    throw new Error("Invalid pagination metadata");
  }

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
};
