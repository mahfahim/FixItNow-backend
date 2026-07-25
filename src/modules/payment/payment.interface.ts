import { PaymentProvider, PaymentStatus } from "../../../generated/prisma/client";

export type ICreatePaymentPayload = {
  bookingId: string;
  provider: PaymentProvider;
};


export type IConfirmPaymentPayload = {
  sessionId: string;
};

export type IRefundPaymentPayload = {
  paymentId: string;
  reason?: string;
  amount?: number;
};

export type IPaginationOptions = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type IPaymentFilterRequest = {
  searchTerm?: string;
  status?: PaymentStatus;
  provider?: PaymentProvider;
  bookingId?: string;
  startDate?: string;
  endDate?: string;
};

export type IInitiatePaymentInput = {
  transactionId: string;
  bookingId: string;
  amount: number;
  provider: PaymentProvider;
  customerName: string;
  customerEmail: string;
  serviceName?: string;
};

export type IGatewayResult = {
  paymentUrl: string;
  sessionId?: string;
  sessionkey?: string;
};