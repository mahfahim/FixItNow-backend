// src/modules/auth/auth.validation.ts
import { z } from 'zod';

const registerValidationSchema = z.object({
  body: z.object({
    name: z
      .string({ message: 'Name is required' })
      .min(2, 'Name must be at least 2 characters')
      .max(255, 'Name cannot exceed 255 characters'),
    email: z
      .string({ message: 'Email is required' })
      .email('Invalid email address')
      .max(255, 'Email cannot exceed 255 characters'),
    password: z
      .string({ message: 'Password is required' })
      .min(6, 'Password must be at least 6 characters long'),
    role: z.enum(['CUSTOMER', 'TECHNICIAN', 'ADMIN'], {
      message: 'Role is required and must be CUSTOMER, TECHNICIAN, or ADMIN',
    }),
  }),
});

const loginValidationSchema = z.object({
  body: z.object({
    email: z
      .string({ message: 'Email is required' })
      .email('Invalid email address'),
    password: z
      .string({ message: 'Password is required' }),
  }),
});

const refreshTokenValidationSchema = z.object({
  cookies: z.object({
    refreshToken: z.string({
      message: 'Refresh token is required in cookies',
    }),
  }),
});


const updateMyProfileValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(255, 'Name cannot exceed 255 characters')
      .optional(),
    profileImage: z
      .string()
      .url('Invalid profile image URL')
      .optional()
      .or(z.literal('')), 
  }),
});

const addAddressValidationSchema = z.object({
  body: z.object({
    label: z.string().optional(),
    addressLine: z.string({
      message: 'Address line is required',
    }),
    city: z.string({
      message: 'City is required',
    }),
    district: z.string({
      message: 'District is required',
    }),
    postalCode: z.string().optional(),
    isDefault: z.boolean().optional(),
  }),
});

export const AuthValidation = {
  registerValidationSchema,
  loginValidationSchema,
  refreshTokenValidationSchema,
  updateMyProfileValidationSchema,
  addAddressValidationSchema,
};