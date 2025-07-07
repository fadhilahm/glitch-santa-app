import { z } from "zod";

import { ERROR_MESSAGES } from "../constants/errorMessages";

export const PostLetterRequestSchema = z.object({
  username: z
    .string()
    .min(1, ERROR_MESSAGES.USERNAME_REQUIRED)
    .max(50, ERROR_MESSAGES.USERNAME_TOO_LONG),
  address: z
    .string()
    .min(1, ERROR_MESSAGES.ADDRESS_REQUIRED)
    .max(300, ERROR_MESSAGES.ADDRESS_TOO_LONG),
  message: z
    .string()
    .min(1, ERROR_MESSAGES.MESSAGE_REQUIRED)
    .max(1000, ERROR_MESSAGES.MESSAGE_TOO_LONG),
});

export type PostLetterRequest = z.infer<typeof PostLetterRequestSchema>;
