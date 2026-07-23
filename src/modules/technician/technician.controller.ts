//src/modules/technician/technician.controller.ts
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import {catchAsync} from '../../utils/catchAsync';
import {sendResponse} from '../../utils/sendResponse';
import { TechnicianService } from './technician.service';

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
  console.log('Decoded Auth User:', user);
  const userId = user?.userId || user?.id; 
  if (!userId) {
    throw new Error('User ID not found in token');
  }
  const result = await TechnicianService.setAvailability(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Availability slots updated successfully',
    data: result,
  });
});

const getAllTechnicians = catchAsync(async (req: Request, res: Response) => {
  const filters = req.query;
  const result = await TechnicianService.getAllTechnicians(filters as any);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Technicians fetched successfully',
    data: result,
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

  const result = await TechnicianService.updateBookingStatus(userId, id as string, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking status updated successfully',
    data: result,
  });
});


export const TechnicianController = {
  updateProfile,
  setAvailability,
  getAllTechnicians,
  getTechnicianById,
  getTechnicianBookings,
  updateBookingStatus,
};