import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import bodyParser from "body-parser";

import indexRouter from "./src/routes/index";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("combined"));

app.use(express.static("public"));

app.use("/", indexRouter);

const listener = app.listen(process.env.PORT || 3000, function () {
  const address = listener.address();
  if (address && typeof address === "object") {
    console.log("Your app is listening on port " + address.port);
  }
});

export default app;
