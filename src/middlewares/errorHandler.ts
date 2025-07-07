import { Request, Response, NextFunction } from "express";

import { ErrorWithCode } from "../shared/types/errors";
import { HTTP_CODES } from "../shared/constants/httpCodes";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ErrorWithCode) {
    res.status(err.code).json({ error: err.message });
  } else {
    res
      .status(HTTP_CODES.ERROR.INTERNAL_SERVER_ERROR)
      .json({ error: err.message });
  }
};
