import express from "express";
import { Role } from "../../../generated/prisma/client";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { PaymentController } from "./payment.controller";
import { PaymentValidation } from "./payment.validation";

const router = express.Router();

// Webhook Route (Public & Raw Body Parser)
router.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  PaymentController.stripeWebhook
);

// Payment Operations
router.post(
  "/create",
  auth(Role.CUSTOMER),
  validateRequest(PaymentValidation.createPaymentSchema),
  PaymentController.createPaymentIntent
);


router.post(
  "/confirm",
  auth(Role.CUSTOMER),
  validateRequest(PaymentValidation.confirmPaymentSchema),
  PaymentController.confirmPayment
);

router.post(
  "/refund",
  auth(Role.ADMIN),
  validateRequest(PaymentValidation.refundPaymentSchema),
  PaymentController.refundPayment
);

// Query Operations
router.get(
  "/history",
  auth(Role.CUSTOMER),
  PaymentController.getPaymentHistory
);

router.get(
  "/",
  auth(Role.ADMIN),
  PaymentController.getAllPayments
);

router.get(
  "/:id",
  auth(Role.CUSTOMER, Role.ADMIN),
  PaymentController.getPaymentById
);

export const PaymentRoutes = router;