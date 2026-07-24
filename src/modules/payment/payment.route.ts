// src/modules/payment/payment.route.ts
import express from "express";
import { Role } from "../../../generated/prisma/client";
import { auth } from "../../middlewares/auth";
import { PaymentController } from "./payment.controller";

const router = express.Router();

router.post("/create", auth(Role.CUSTOMER), PaymentController.createPaymentIntent);

router.post("/confirm", PaymentController.confirmPayment);

router.get("/", auth(Role.CUSTOMER), PaymentController.getPaymentHistory);
router.get("/:id", auth(Role.CUSTOMER), PaymentController.getPaymentById);

export const PaymentRoutes = router;