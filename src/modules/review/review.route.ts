import express from 'express';
import { Role } from '../../../generated/prisma/client';
import {auth} from '../../middlewares/auth';
import { ReviewController } from './review.controller';

const router = express.Router();

router.post('/', auth(Role.CUSTOMER), ReviewController.createReview);
router.get('/my-reviews', auth(Role.CUSTOMER), ReviewController.getMyReviews);
router.get('/technician/:technicianId', ReviewController.getTechnicianReviews);
router.get('/booking/:bookingId', ReviewController.getReviewByBookingId);

export const ReviewRoutes = router;