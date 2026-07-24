// src/modules/payment/payment.interface.ts
import { PaymentProvider } from "../../../generated/prisma/client";

export type ICreatePaymentPayload = {
    bookingId: string;
    provider: PaymentProvider; // STRIPE or SSLCOMMERZ
};

export type IConfirmPaymentPayload = {
    transactionId: string;
    status: "COMPLETED" | "FAILED";
};