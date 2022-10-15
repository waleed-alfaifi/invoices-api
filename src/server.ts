import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";

import express, { Request, Response } from "express";
import StatusCodes from "http-status-codes";
import "express-async-errors";

import apiRouter from "./routes/api";
import logger from "jet-logger";
import { CustomError } from "@shared/errors";
import passport from "passport";
import { authStrategy } from "@middleware/auth";

// Constants
const app = express();

/***********************************************************************************
 *                                  Middleware
 **********************************************************************************/

const whiteList = ["https://invoice-app-angular.netlify.app"];
if (process.env.NODE_ENV === "development") {
  whiteList.push("http://localhost:4200");
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin(requestOrigin, callback) {
      if (requestOrigin && !whiteList.includes(requestOrigin)) {
        return callback(new Error("Not allowed by cors"));
      }

      return callback(null, true);
    },
  })
);

// Show routes called in console during development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Security (helmet recommended in express docs)
if (process.env.NODE_ENV === "production") {
  app.use(helmet());
}

app.use(passport.initialize());
passport.use("jwt", authStrategy());

/***********************************************************************************
 *                         API routes and error handling
 **********************************************************************************/

// Add api router
app.use("/api", apiRouter);

// Error handling
app.use((err: Error | CustomError, _: Request, res: Response) => {
  logger.err(err, true);
  const status =
    err instanceof CustomError ? err.HttpStatus : StatusCodes.BAD_REQUEST;
  return res.status(status).json({
    error: err.message,
  });
});

// Export here and start in a diff file (for testing).
export default app;
