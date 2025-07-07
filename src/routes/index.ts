import { Router, Request, Response, NextFunction } from "express";
import path from "path";

import { errorHandler } from "../middlewares/errorHandler";
import { createZodValidationMiddleware } from "../middlewares/validation";
import { PostLetterRequestSchema } from "../shared/types/request";

const router = Router();

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
      const letter = await lettersService.create({
        username,
        address,
        message,
      });
      response.redirect('/');
    } catch (error) {
      next(error);
    }
  }
);

router.use(errorHandler);

export default router;
