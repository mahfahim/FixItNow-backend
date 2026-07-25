import express from 'express';
import { Role } from '../../../generated/prisma/client';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { ReviewController } from './review.controller';
import { ReviewValidation } from './review.validation';

const router = express.Router();

router.post(
  '/',
  auth(Role.CUSTOMER),
  validateRequest(ReviewValidation.createReviewZodSchema),
  ReviewController.createReview
);

router.get('/', ReviewController.getAllReviews);

router.get('/my-reviews', auth(Role.CUSTOMER), ReviewController.getMyReviews);

router.get('/technician/:technicianId', ReviewController.getTechnicianReviews);

router.get('/booking/:bookingId', ReviewController.getReviewByBookingId);

export const ReviewRoutes = router;