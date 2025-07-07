import { Request, Response, NextFunction } from "express";

import { ErrorWithCode } from "../shared/types/errors";
import { HTTP_CODES } from "../shared/constants/httpCodes";
import { ERROR_MESSAGES } from "../shared/constants/errorMessages";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ErrorWithCode) {
    res.status(err.code).json({ error: err.message });
  } else {
    res
      .status(HTTP_CODES.ERROR.INTERNAL_SERVER_ERROR)
      .json({ error: err.message });
  }
};
