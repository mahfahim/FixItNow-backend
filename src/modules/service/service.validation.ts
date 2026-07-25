import { z } from 'zod';

const createServiceValidationSchema = z.object({
  body: z.object({
    categoryId: z.string({
      message: 'Category ID is required',
    }),
    technicianId: z.string().optional(),
    title: z
      .string({
        message: 'Title is required',
      })
      .min(1, { message: 'Title cannot be empty' }),
    description: z.string({
      message: 'Description is required',
    }),
    price: z
      .number({
        message: 'Price is required',
      })
      .positive({ message: 'Price must be a positive number' }),
    duration: z
      .number({
        message: 'Duration is required',
      })
      .int({ message: 'Duration must be an integer' })
      .positive({ message: 'Duration must be positive (in minutes)' }),
    images: z.array(z.string({ message: 'Image URL must be a string' })).optional(),
    serviceArea: z
      .array(z.string({ message: 'Service area must be a string' }))
      .optional(),
  }),
});

const updateServiceValidationSchema = z.object({
  body: z.object({
    categoryId: z.string().optional(),
    technicianId: z.string().optional(),
    title: z.string().min(1, { message: 'Title cannot be empty' }).optional(),
    description: z.string().optional(),
    price: z
      .number({ message: 'Price must be a number' })
      .positive({ message: 'Price must be a positive number' })
      .optional(),
    duration: z
      .number({ message: 'Duration must be a number' })
      .int({ message: 'Duration must be an integer' })
      .positive({ message: 'Duration must be positive' })
      .optional(),
    images: z.array(z.string({ message: 'Image URL must be a string' })).optional(),
    serviceArea: z
      .array(z.string({ message: 'Service area must be a string' }))
      .optional(),
    isAvailable: z.boolean().optional(),
  }),
});

export const ServiceValidation = {
  createServiceValidationSchema,
  updateServiceValidationSchema,
};