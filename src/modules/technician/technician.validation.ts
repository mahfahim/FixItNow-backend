// src/modules/technician/technician.validation.ts

import { z } from 'zod';
import { Weekday, BookingStatus } from '../../../generated/prisma/enums';

const updateProfileValidationSchema = z.object({
  body: z.object({
    bio: z.string({ message: 'Bio must be a string' }).optional(),
    yearsOfExperience: z
      .number({ message: 'Years of experience must be a number' })
      .min(0, { message: 'Years of experience cannot be negative' })
      .optional(),
    hourlyRate: z
      .number({ message: 'Hourly rate must be a number' })
      .min(0, { message: 'Hourly rate cannot be negative' })
      .optional(),
    profileImage: z.string({ message: 'Profile image must be a string' }).optional(),
    phone: z.string({ message: 'Phone number must be a string' }).optional(),
    address: z.string({ message: 'Address must be a string' }).optional(),
    city: z.string({ message: 'City must be a string' }).optional(),
    district: z.string({ message: 'District must be a string' }).optional(),
  }),
});

const setAvailabilityValidationSchema = z.object({
  body: z.array(
    z.object({
      weekday: z.enum(Object.values(Weekday) as [string, ...string[]], {
        message: 'Invalid weekday value provided',
      }),
      startTime: z.string({ message: 'Start time is required' }),
      endTime: z.string({ message: 'End time is required' }),
      isAvailable: z.boolean({ message: 'isAvailable must be a boolean' }).optional(),
    })
  ),
});

const updateBookingStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(Object.values(BookingStatus) as [string, ...string[]], {
      message: 'Invalid booking status provided',
    }),
    note: z.string({ message: 'Note must be a string' }).optional(),
    cancellationReason: z
      .string({ message: 'Cancellation reason must be a string' })
      .optional(),
  }),
});

export const TechnicianValidation = {
  updateProfileValidationSchema,
  setAvailabilityValidationSchema,
  updateBookingStatusValidationSchema,
};