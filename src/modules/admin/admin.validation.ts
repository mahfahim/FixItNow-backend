import { z } from 'zod';
import { UserStatus } from '../../../generated/prisma/client';

const updateUserStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED], {
      message: 'Status must be either ACTIVE or BLOCKED',
    }),
  }),
});

const createCategoryValidationSchema = z.object({
  body: z.object({
    name: z.string({
      message: 'Category name is required',
    }).min(1, { message: 'Name cannot be empty' }),
    slug: z.string().optional(),
    icon: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const AdminValidation = {
  updateUserStatusValidationSchema,
  createCategoryValidationSchema,
};