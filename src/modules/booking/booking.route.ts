import express from 'express';
import {auth} from '../../middlewares/auth';
import { Role } from "../../../generated/prisma/client";
import { BookingController } from './booking.controller';

const router = express.Router();

router.post('/', auth(Role.CUSTOMER), BookingController.createBooking);

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
  BookingController.updateBookingStatus
);

export const BookingRoutes = router;