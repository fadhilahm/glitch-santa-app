import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import bodyParser from "body-parser";

import indexRouter from "./src/routes/index";
import LettersService from "./src/services/letters";
import SchedulerService from "./src/services/scheduler";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("combined"));

app.use(express.static("public"));

const lettersService = new LettersService();
const schedulerService = new SchedulerService(lettersService);

app.locals.lettersService = lettersService;
app.locals.schedulerService = schedulerService;

app.use("/", indexRouter);

const listener = app.listen(process.env.PORT || 3000, function () {
  const address = listener.address();
  if (address && typeof address === "object") {
    console.log("Your app is listening on port " + address.port);

    schedulerService.start();
    console.log(
      `📧 Letter processing scheduler started - checking every ${schedulerService.config.intervalSeconds} seconds`
    );
  }
});

process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down gracefully...");
  schedulerService.stop();
  listener.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down gracefully...");
  schedulerService.stop();
  listener.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

export default app;
