// src/modules/technician/technician.route.ts
import express from 'express';
import { auth } from '../../middlewares/auth'; 
import { Role } from '../../../generated/prisma/enums';
import { TechnicianController } from './technician.controller';

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
  TechnicianController.updateBookingStatus
);

// PATCH /api/technicians/profile
router.patch(
  '/profile',
  auth(Role.TECHNICIAN),
  TechnicianController.updateProfile
);

// PATCH /api/technicians/availability
router.patch(
  '/availability',
  auth(Role.TECHNICIAN),
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