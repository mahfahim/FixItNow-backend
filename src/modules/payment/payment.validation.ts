import { z } from "zod";
import { PaymentProvider } from "../../../generated/prisma/client";

const createPaymentSchema = z.object({
  body: z.object({
    bookingId: z.string({
      message: "Booking ID is required and must be a string",
    }),
    provider: z.nativeEnum(PaymentProvider, {
      message: "Payment provider must be either STRIPE or SSLCOMMERZ",
    }),
  }),
});

const confirmPaymentSchema = z.object({
  body: z.object({
    transactionId: z.string({
      message: "Transaction ID is required",
    }),
    status: z.enum(["COMPLETED", "FAILED"], {
      message: "Status must be either COMPLETED or FAILED",
    }),
  }),
});

const refundPaymentSchema = z.object({
  body: z.object({
    paymentId: z.string({
      message: "Payment ID is required",
    }),
    reason: z.string({ message: "Refund reason must be a string" }).optional(),
    amount: z
      .number({ message: "Refund amount must be a number" })
      .positive({ message: "Refund amount must be greater than zero" })
      .optional(),
  }),
});

export const PaymentValidation = {
  createPaymentSchema,
  confirmPaymentSchema,
  refundPaymentSchema,
};