import { Router, Request, Response } from "express";
import path from "path";

import { errorHandler } from "../middlewares/errorHandler";

const router = Router();

router.get("/", (_request: Request, response: Response) => {
  response.sendFile(path.join(__dirname, "/views/index.html"));
});

router.use(errorHandler);

export default router;
