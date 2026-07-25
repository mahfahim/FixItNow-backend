import express from 'express';
import { Role } from '../../../generated/prisma/client';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { BookingController } from './booking.controller';
import { BookingValidation } from './booking.validation';

const router = express.Router();

router.post(
  '/',
  auth(Role.CUSTOMER),
  validateRequest(BookingValidation.createBookingZodSchema),
  BookingController.createBooking
);

router.get(
  '/',
  auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN),
  BookingController.getUserBookings
);

router.get(
  '/:id',
  auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN),
  BookingController.getBookingById
);

router.patch(
  '/:id/status',
  auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN),
  validateRequest(BookingValidation.updateBookingStatusZodSchema),
  BookingController.updateBookingStatus
);

export const BookingRoutes = router;