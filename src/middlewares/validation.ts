import { z } from "zod";
import { NextFunction, Request, Response } from "express";

import { HTTP_CODES } from "../shared/constants/httpCodes";

export const createZodValidationMiddleware = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(HTTP_CODES.ERROR.BAD_REQUEST)
        .json({ error: result.error.message });
    }
    req.body = result.data;
    next();
  };
};
