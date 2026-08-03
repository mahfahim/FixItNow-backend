//src/modules/technician/technician.controller.ts

import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { TechnicianService } from './technician.service';

const getAvailability = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userId = user?.userId || user?.id;

  const result = await TechnicianService.getAvailability(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Availability slots retrieved successfully',
    data: result,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userId = user?.userId || user?.id;

  const result = await TechnicianService.updateProfile(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Technician profile updated successfully',
    data: result,
  });
});

const setAvailability = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userId = user?.userId || user?.id;

  const result = await TechnicianService.setAvailability(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Availability slots updated successfully',
    data: result,
  });
});

const getAllTechnicians = catchAsync(async (req: Request, res: Response) => {
  const filterKeys = ['search', 'city', 'district', 'minRating'];
  const paginationKeys = ['page', 'limit', 'sortBy', 'sortOrder'];

  const filters: Record<string, any> = {};
  const options: Record<string, any> = {};

  Object.keys(req.query).forEach((key) => {
    if (filterKeys.includes(key)) {
      filters[key] = req.query[key];
    }
    if (paginationKeys.includes(key)) {
      options[key] = req.query[key];
    }
  });

  const result = await TechnicianService.getAllTechnicians(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Technicians fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getTechnicianById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TechnicianService.getTechnicianById(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Technician fetched successfully',
    data: result,
  });
});

const getTechnicianBookings = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userId = user?.userId || user?.id;

  const result = await TechnicianService.getTechnicianBookings(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Technician bookings retrieved successfully',
    data: result,
  });
});

const updateBookingStatus = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userId = user?.userId || user?.id;
  const { id } = req.params;

  const result = await TechnicianService.updateBookingStatus(
    userId,
    id as string,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking status updated successfully',
    data: result,
  });
});

export const TechnicianController = {
  getAvailability,
  updateProfile,
  setAvailability,
  getAllTechnicians,
  getTechnicianById,
  getTechnicianBookings,
  updateBookingStatus,
};