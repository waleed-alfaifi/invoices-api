import { RequestHandler } from "express";
import { body, ValidationChain, validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";

export interface ILoginRequest {
  username: string;
  password: string;
}

const loginValidation: Record<keyof ILoginRequest, ValidationChain> = {
  username: body("username").notEmpty(),
  password: body("password").notEmpty(),
};

export const loginValidators = Object.values(loginValidation);

export const loginMiddleware: RequestHandler = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  return res.status(StatusCodes.BAD_REQUEST).json({
    errors: result.array(),
  });
};
