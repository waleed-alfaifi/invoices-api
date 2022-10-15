import type { RequestHandler } from "express";
import { body, ValidationChain, validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";

export interface IRegisterRequest {
  username: string;
  password: string;
}

const registerValidationsObject: Record<
  keyof IRegisterRequest,
  ValidationChain
> = {
  username: body("username")
    .exists()
    .withMessage("username should be defined")
    .isString()
    .withMessage("username should be a string")
    .isLength({ min: 5 })
    .withMessage("minimum username length is 5 characters"),
  password: body("password")
    .exists()
    .withMessage("password should be defined")
    .isString()
    .withMessage("password should be a string")
    .isLength({ min: 8 })
    .withMessage("minimum password length is 8 characters"),
};

export const registerValidations = Object.values(registerValidationsObject);

export const registerValidator: RequestHandler = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  return res.status(StatusCodes.BAD_REQUEST).json({
    errors: result.array(),
  });
};
