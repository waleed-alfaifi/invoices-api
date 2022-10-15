import { InvoiceService } from "@services/invoice";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import {
  invoiceValidatorMiddleware,
  invoiceValidators,
} from "@middleware/invoice";
import { RequestInvoice, UpdateInvoice } from "@services/invoice/interface";

const invoiceRouter = Router();
const invoiceService = InvoiceService();

/**
 * Get all invoices
 *
 * @url /invoices
 * @method GET
 */
invoiceRouter.get("/", async (req, res) => {
  if (req.user) {
    const invoices = await invoiceService.getAllInvoices(req.user);
    return res.json(invoices);
  }
});

/**
 * Submit an invoice
 *
 * @url /invoices
 * @method POST
 */

invoiceRouter.post(
  "/",
  ...invoiceValidators,
  invoiceValidatorMiddleware,
  async (req, res) => {
    const invoice = req.body as RequestInvoice;
    if (req.user) {
      const createdInvoice = await invoiceService.addInvoice(invoice, req.user);
      return res.status(StatusCodes.CREATED).json(createdInvoice);
    }
  }
);

/**
 * Get a single invoice
 *
 * @url /invoices/:invoiceId
 * @method GET
 */
invoiceRouter.get("/:invoiceId", async (req, res) => {
  const invoice = await invoiceService.getInvoice(req.params.invoiceId);

  if (invoice) {
    return res.json(invoice);
  }

  return res.status(StatusCodes.NOT_FOUND).json({
    error: "invoice not found",
  });
});

/**
 * Update an invoice
 *
 * TODO: Add validation middleware to this route
 * @url /invoices/:invoiceId
 * @method PUT
 */
invoiceRouter.put("/:invoiceId", async (req, res) => {
  const invoice = req.body as { id: string } & UpdateInvoice;
  invoice.id = req.params.invoiceId;
  const updated = await invoiceService.updateInvoice(invoice);
  res.status(StatusCodes.OK).json(updated);
});

/**
 * Delete an invoice
 * TODO: Add validation middleware to this route
 * @url /invoices/:invoiceId
 * @method DELETE
 */
invoiceRouter.delete("/:invoiceId", async (req, res) => {
  const isDeleted = await invoiceService.deleteInvoice(req.params.invoiceId);
  res.json({
    status: isDeleted,
  });
});

export default invoiceRouter;
