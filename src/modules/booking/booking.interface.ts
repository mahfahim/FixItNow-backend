import { BookingStatus, PaymentStatus } from "../../../generated/prisma/client";

export type ICreateBookingPayload = {
  serviceId: string;
  scheduledDate: string; // ISO string e.g. "2026-08-01"
  scheduledTime: string; // e.g. "10:00"
  address: string;
  addressId?: string;
  notes?: string;
};

export type IUpdateBookingStatusPayload = {
  status: BookingStatus;
  cancellationReason?: string;
  note?: string;
};

export type IBookingFilterOptions = {
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
};