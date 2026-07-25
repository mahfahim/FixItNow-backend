import { z } from 'zod';
import { BookingStatus } from '../../../generated/prisma/client';

const createBookingZodSchema = z.object({
  body: z.object({
    serviceId: z.string({
      message: 'Service ID is required',
    }),
    scheduledDate: z.string({
      message: 'Scheduled date is required',
    }),
    scheduledTime: z.string({
      message: 'Scheduled time is required',
    }),
    address: z.string({
      message: 'Address is required',
    }),
    addressId: z.string().optional(),
    notes: z.string().optional(),
  }),
});

const updateBookingStatusZodSchema = z.object({
  body: z.object({
    status: z.enum(
      Object.values(BookingStatus) as [BookingStatus, ...BookingStatus[]],
      {
        message: 'Invalid booking status',
      }
    ),
    cancellationReason: z.string().optional(),
    note: z.string().optional(),
  }),
});

export const BookingValidation = {
  createBookingZodSchema,
  updateBookingStatusZodSchema,
};