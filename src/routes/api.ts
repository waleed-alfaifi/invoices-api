import { authenticated } from "@middleware/auth";
import { Router } from "express";
import authRouter from "./auth";
import invoiceRouter from "./invoice";

// Export the base-router
const baseRouter = Router();

baseRouter.use("/invoices", authenticated, invoiceRouter);
baseRouter.use("/auth", authRouter);

// Export default.
export default baseRouter;
