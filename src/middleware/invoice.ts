import {
  RequestInvoice,
  InvoiceStatus,
  RequestItems,
} from "@services/invoice/interface";
import { RequestHandler } from "express";
import {
  body as createValidator,
  ValidationChain,
  validationResult,
} from "express-validator";
import { PaymentTerms } from "prisma/prisma-client";

export const validations: Record<
  | keyof RequestInvoice
  | `client.${keyof Pick<RequestInvoice["client"], "name" | "email">}`
  | `items.${keyof RequestItems[number]}`,
  ValidationChain
> = {
  date: createValidator("date").notEmpty().isNumeric(),
  description: createValidator("description")
    .notEmpty()
    .isString()
    .withMessage("description field should be a string"),
  payment: createValidator("payment")
    .optional()
    .custom((input) => {
      if (
        typeof input === "string" &&
        Object.values(PaymentTerms).includes(input as PaymentTerms)
      ) {
        return true;
      }

      throw new Error(
        `Payment can only have one of these values: [ ${Object.values(
          PaymentTerms
        ).join(", ")} ]`
      );
    }),
  status: createValidator("status")
    .optional()
    .custom((input) => {
      if (
        typeof input === "string" &&
        Object.values(InvoiceStatus).includes(input as InvoiceStatus)
      ) {
        return true;
      }

      throw new Error(
        `Status can only be one of these values: [ ${Object.values(
          InvoiceStatus
        ).join(", ")} ]`
      );
    }),
  address: createValidator("address").custom(
    (value: Partial<RequestInvoice["address"]> | undefined) => {
      if (!value) throw new Error("address is required");

      if (typeof value.street !== "string")
        throw new Error("invalid value for address.street");
      if (typeof value.city !== "string")
        throw new Error("invalid value for address.city");
      if (typeof value.country !== "string")
        throw new Error("invalid value for address.country");
      if (typeof value.post_code !== "string")
        throw new Error("invalid value for address.post_code");

      return true;
    }
  ),
  client: createValidator("client").custom(
    (value: Partial<RequestInvoice["client"]> | undefined) => {
      if (!value) throw new Error("client is required");
      const { address } = value;

      if (!address) throw new Error("client.address is required");

      if (typeof address.street !== "string")
        throw new Error("invalid value for client.address.street");
      if (typeof address.city !== "string")
        throw new Error("invalid value for client.address.city");
      if (typeof address.country !== "string")
        throw new Error("invalid value for client.address.country");
      if (typeof address.post_code !== "string")
        throw new Error("invalid value for client.address.post_code");

      return true;
    }
  ),
  "client.name": createValidator("client.name").custom(
    createClientValidator("client.name")
  ),
  "client.email": createValidator("client.email")
    .custom(createClientValidator("client.email"))
    .isEmail()
    .withMessage("client.email should be an email"),
  items: createValidator("items")
    .optional()
    .custom((input) => {
      if (!(input instanceof Array)) {
        throw new Error("items should be an array");
      }

      return true;
    }),
  "items.name": createValidator("items.*.name")
    .isString()
    .withMessage("item name should be a string"),
  "items.price": createValidator("items.*.price")
    .isNumeric()
    .withMessage("item price should be a number"),
  "items.quantity": createValidator("items.*.quantity")
    .isInt()
    .withMessage("item quantity should be a number"),
};

function createClientValidator(field: string) {
  return (input: any) => {
    if (typeof input === "string" && input.trim()) {
      return true;
    }

    throw new Error(`${field} should be a non empty string`);
  };
}

export const invoiceValidators = Object.values(validations);

export const invoiceValidatorMiddleware: RequestHandler = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  return res.json({
    errors: result.array(),
  });
};
