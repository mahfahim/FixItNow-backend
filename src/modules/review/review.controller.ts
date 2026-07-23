import { Request, Response } from 'express';
import httpStatus from 'http-status';
import {catchAsync} from '../../utils/catchAsync';
import {sendResponse} from '../../utils/sendResponse';
import { ReviewService } from './review.service';

const createReview = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userId = user.userId || user.id;

  const result = await ReviewService.createReview(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Review created successfully',
    data: result,
  });
});

const getTechnicianReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.getTechnicianReviews(req.params.technicianId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Technician reviews fetched successfully',
    data: result,
  });
});

const getMyReviews = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userId = user.userId || user.id;

  const result = await ReviewService.getMyReviews(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User reviews fetched successfully',
    data: result,
  });
});

const getReviewByBookingId = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.getReviewByBookingId(req.params.bookingId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking review fetched successfully',
    data: result,
  });
});

export const ReviewController = {
  createReview,
  getTechnicianReviews,
  getMyReviews,
  getReviewByBookingId,
};