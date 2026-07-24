// src/modules/category/category.validation.ts
import { z } from 'zod';

const createCategoryValidationSchema = z.object({
  body: z.object({
    name: z
      .string({
        message: 'Category name must be a string',
      })
      .min(1, { message: 'Category name is required' })
      .max(100, { message: 'Category name cannot exceed 100 characters' }),
    icon: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

const updateCategoryValidationSchema = z.object({
  body: z.object({
    name: z
      .string({
        message: 'Category name must be a string',
      })
      .max(100, { message: 'Category name cannot exceed 100 characters' })
      .optional(),
    icon: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const CategoryValidation = {
  createCategoryValidationSchema,
  updateCategoryValidationSchema,
};