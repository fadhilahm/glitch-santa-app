import { Router, Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";

import { errorHandler } from "../middlewares/errorHandler";
import { createZodValidationMiddleware } from "../middlewares/validation";
import { PostLetterRequestSchema } from "../shared/types/request";
import AuthorizationService from "../services/authorization";

const router = Router();
const authService = new AuthorizationService();

// Helper function to render HTML template with variable substitution
const renderTemplate = (templatePath: string, variables: Record<string, string> = {}) => {
  let template = fs.readFileSync(templatePath, 'utf8');
  Object.entries(variables).forEach(([key, value]) => {
    template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  return template;
};

router.get("/", (_request: Request, response: Response) => {
  response.sendFile(path.join(__dirname, "../views/index.html"));
});

router.post(
  "/",
  createZodValidationMiddleware(PostLetterRequestSchema),
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const lettersService = request.app.locals.lettersService;
      const { username, address, message } = request.body;
      
      const validationResult = await authService.validateUser(username);
      
      if (!validationResult.isValid) {
        const errorTemplate = renderTemplate(
          path.join(__dirname, "../views/error.html"),
          { ERROR_MESSAGE: validationResult.error?.message || "Unknown error" }
        );
        return response.status(validationResult.error?.code || 400).send(errorTemplate);
      }

      // Create the letter if validation passed
      const letter = await lettersService.create({
        username,
        address,
        message,
      });

      // Render success page
      const successTemplate = renderTemplate(
        path.join(__dirname, "../views/success.html"),
        { USERNAME: validationResult.user?.username || username }
      );
      response.send(successTemplate);
    } catch (error) {
      next(error);
    }
  }
);

router.use(errorHandler);

export default router;
