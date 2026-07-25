import { z } from 'zod';

const createReviewZodSchema = z.object({
  body: z.object({
    bookingId: z.string({
      message: 'Booking ID is required',
    }),
    rating: z
      .number({
        message: 'Rating is required',
      })
      .int({ message: 'Rating must be an integer' })
      .min(1, { message: 'Rating must be at least 1' })
      .max(5, { message: 'Rating must be at most 5' }),
    comment: z.string().optional(),
  }),
});

const updateReviewZodSchema = z.object({
  body: z.object({
    rating: z
      .number({
        message: 'Rating must be a number',
      })
      .int({ message: 'Rating must be an integer' })
      .min(1, { message: 'Rating must be at least 1' })
      .max(5, { message: 'Rating must be at most 5' })
      .optional(),
    comment: z.string().optional(),
  }),
});

export const ReviewValidation = {
  createReviewZodSchema,
  updateReviewZodSchema,
};