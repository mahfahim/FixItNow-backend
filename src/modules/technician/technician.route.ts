// src/modules/technician/technician.route.ts

import express from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { Role } from '../../../generated/prisma/enums';
import { TechnicianController } from './technician.controller';
import { TechnicianValidation } from './technician.validation';

const router = express.Router();

// =========================================================
// 1. SPECIFIC / STATIC ROUTES (MUST BE DEFINED FIRST)
// =========================================================

// GET /api/technicians/bookings
router.get(
  '/bookings',
  auth(Role.TECHNICIAN),
  TechnicianController.getTechnicianBookings
);

// PATCH /api/technicians/bookings/:id
router.patch(
  '/bookings/:id',
  auth(Role.TECHNICIAN),
  validateRequest(TechnicianValidation.updateBookingStatusValidationSchema),
  TechnicianController.updateBookingStatus
);

// PATCH /api/technicians/profile
router.patch(
  '/profile',
  auth(Role.TECHNICIAN),
  validateRequest(TechnicianValidation.updateProfileValidationSchema),
  TechnicianController.updateProfile
);

// PATCH /api/technicians/availability
router.patch(
  '/availability',
  auth(Role.TECHNICIAN),
  validateRequest(TechnicianValidation.setAvailabilityValidationSchema),
  TechnicianController.setAvailability
);

// =========================================================
// 2. PUBLIC & DYNAMIC ROUTES (MUST BE DEFINED LAST)
// =========================================================

// GET /api/technicians
router.get('/', TechnicianController.getAllTechnicians);

// GET /api/technicians/:id  <-- MUST BE AT THE VERY BOTTOM!
router.get('/:id', TechnicianController.getTechnicianById);

export const TechnicianRoutes = router;