import { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";

import { ErrorWithCode } from "../shared/types/errors";
import { HTTP_CODES } from "../shared/constants/httpCodes";

// Helper function to render HTML template with variable substitution
const renderTemplate = (templatePath: string, variables: Record<string, string> = {}) => {
  let template = fs.readFileSync(templatePath, 'utf8');
  Object.entries(variables).forEach(([key, value]) => {
    template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  return template;
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Check if this is a form submission (likely from the web interface)
  const isFormSubmission = req.method === 'POST' && req.headers['content-type']?.includes('application/x-www-form-urlencoded');
  
  if (isFormSubmission) {
    // Render error page for form submissions
    try {
      const errorTemplate = renderTemplate(
        path.join(__dirname, "../views/error.html"),
        { ERROR_MESSAGE: err.message }
      );
      const statusCode = err instanceof ErrorWithCode ? err.code : HTTP_CODES.ERROR.INTERNAL_SERVER_ERROR;
      res.status(statusCode).send(errorTemplate);
    } catch (templateError) {
      // Fallback to JSON if template rendering fails
      res.status(HTTP_CODES.ERROR.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  } else {
    // Return JSON for API calls
    if (err instanceof ErrorWithCode) {
      res.status(err.code).json({ error: err.message });
    } else {
      res
        .status(HTTP_CODES.ERROR.INTERNAL_SERVER_ERROR)
        .json({ error: err.message });
    }
  }
};
