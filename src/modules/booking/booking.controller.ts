import { Request, Response } from 'express';
import httpStatus from 'http-status';
import {catchAsync} from '../../utils/catchAsync';
import {sendResponse} from '../../utils/sendResponse';
import { BookingService } from './booking.service';

const createBooking = catchAsync(async (req: Request, res: Response) => {
  
  const userId = (req as any).user?.userId || (req as any).user?.id;

  if (!userId) {
    throw new Error('User ID missing from request context.');
  }

  const result = await BookingService.createBooking(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Booking request created successfully',
    data: result,
  });
});

const getUserBookings = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId || (req as any).user?.id;
  const role = (req as any).user?.role;

  const filters = req.query;
  const result = await BookingService.getUserBookings(userId, role, filters as any);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bookings retrieved successfully',
    data: result,
  });
});

const getBookingById = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId || (req as any).user?.id;
  const role = (req as any).user?.role;

  const result = await BookingService.getBookingById(userId, role, req.params.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking details fetched successfully',
    data: result,
  });
});

const updateBookingStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId || (req as any).user?.id;
  const role = (req as any).user?.role;

  const result = await BookingService.updateBookingStatus(
    userId,
    role,
    req.params.id as string,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking status updated successfully',
    data: result,
  });
});

export const BookingController = {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
};