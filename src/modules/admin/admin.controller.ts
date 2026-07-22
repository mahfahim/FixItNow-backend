//src/modules/admin/admin.controller.ts
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import {catchAsync} from '../../utils/catchAsync';
import {sendResponse} from '../../utils/sendResponse';
import { AdminService } from './admin.service';

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const filters = req.query;
  const result = await AdminService.getAllUsers(filters as any);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Users retrieved successfully',
    data: result,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.updateUserStatus(
    req.params.id as string,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User status updated successfully',
    data: result,
  });
});

const getAllBookingsAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAllBookingsAdmin();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All platform bookings fetched successfully',
    data: result,
  });
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAllCategories();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Categories retrieved successfully',
    data: result,
  });
});

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.createCategory(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Category created successfully',
    data: result,
  });
});

export const AdminController = {
  getAllUsers,
  updateUserStatus,
  getAllBookingsAdmin,
  getAllCategories,
  createCategory,
};