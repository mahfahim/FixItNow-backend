import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import {
  ICreateServicePayload,
  IServiceFilterOptions,
  IUpdateServicePayload,
} from './service.interface';

const createService = async (
  authUser: { id: string; role: string; [key: string]: any },
  payload: ICreateServicePayload
) => {
  // auth.ts এ req.user.id হিসেবে আছে, তাই authUser.id ব্যবহার করা হয়েছে
  const currentUserId = authUser.id || authUser.userId;

  if (!currentUserId) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'User ID not found in authentication context'
    );
  }

  let targetTechnicianId = payload.technicianId;
  const userRole = authUser.role?.toUpperCase();

  if (userRole === 'TECHNICIAN') {
    const technicianProfile = await prisma.technicianProfile.findUnique({
      where: { userId: currentUserId }, // 🟢 authUser.id দিয়ে সঠিকভাবে খোঁজা হচ্ছে
    });

    if (!technicianProfile) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'Technician profile not found'
      );
    }
    targetTechnicianId = technicianProfile.id;
  } else if (userRole === 'ADMIN') {
    if (!targetTechnicianId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'technicianId is required when creating a service as Admin'
      );
    }

    const technicianProfile = await prisma.technicianProfile.findFirst({
      where: {
        OR: [
          { id: targetTechnicianId },
          { userId: targetTechnicianId },
        ],
      },
    });

    if (!technicianProfile) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'Technician profile not found'
      );
    }

    targetTechnicianId = technicianProfile.id;
  }

  if (!targetTechnicianId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'technicianId could not be resolved'
    );
  }

  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId },
  });

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
  }

  const { technicianId, ...serviceData } = payload;

  const service = await prisma.service.create({
    data: {
      ...serviceData,
      price: new Prisma.Decimal(serviceData.price), // 🟢 Decimal Explicit Safe Handling
      images: serviceData.images || [],             // 🟢 Default Array Safety
      serviceArea: serviceData.serviceArea || [],   // 🟢 Default Array Safety
      technicianId: targetTechnicianId,             // 🟢 Validated Technician Profile ID
    },
    include: {
      category: true,
      technician: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  return service;
};


const getAllServices = async (filters: IServiceFilterOptions) => {
  const { search, categoryId, minPrice, maxPrice, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const whereConditions: any = {
    isDeleted: false,
    isAvailable: true,
  };

  if (categoryId) {
    whereConditions.categoryId = categoryId;
  }

  if (
    (minPrice !== undefined && minPrice !== '') ||
    (maxPrice !== undefined && maxPrice !== '')
  ) {
    whereConditions.price = {};
    if (minPrice !== undefined && minPrice !== '') {
      whereConditions.price.gte = Number(minPrice);
    }
    if (maxPrice !== undefined && maxPrice !== '') {
      whereConditions.price.lte = Number(maxPrice);
    }
  }

  if (search) {
    whereConditions.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where: whereConditions,
      skip,
      take: limitNum,
      orderBy: { [sortBy]: sortOrder },
      include: {
        category: true,
        technician: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    }),
    prisma.service.count({ where: whereConditions }),
  ]);

  return {
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPage: Math.ceil(total / limitNum),
    },
    data: services,
  };
};

const getServiceById = async (id: string) => {
  const service = await prisma.service.findUnique({
    where: { id },
    include: {
      category: true,
      technician: {
        include: {
          user: { select: { name: true, email: true } },
          reviewsReceived: true,
        },
      },
    },
  });

  if (!service || service.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'Service not found');
  }

  return service;
};
const updateService = async (
  authUser: { id?: string; userId?: string; role: string; [key: string]: any },
  serviceId: string,
  payload: IUpdateServicePayload
) => {
  // 🟢 authUser.id বা authUser.userId দুটোই সেফলি হ্যান্ডেল করা হয়েছে
  const currentUserId = authUser.id || authUser.userId;

  const existingService = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!existingService || existingService.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'Service not found');
  }

  const userRole = authUser.role?.toUpperCase();

  if (userRole === 'TECHNICIAN') {
    const technicianProfile = await prisma.technicianProfile.findUnique({
      where: { userId: currentUserId }, // 🟢 Fixed: userId: undefined হওয়া বন্ধ করা হলো
    });

    if (
      !technicianProfile ||
      existingService.technicianId !== technicianProfile.id
    ) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Forbidden: You can only update your own services'
      );
    }
  }

  if (payload.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: payload.categoryId },
    });
    if (!category) {
      throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
    }
  }

  // 🟢 Price আপডেট করার ক্ষেত্রে প্রিসমার Decimal Safe Format নিশ্চিত করা
  const updateData: any = { ...payload };
  if (payload.price !== undefined) {
    updateData.price = new Prisma.Decimal(payload.price);
  }

  const updatedService = await prisma.service.update({
    where: { id: serviceId },
    data: updateData,
    include: {
      category: true,
      technician: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  return updatedService;
};

const deleteService = async (
  authUser: { id?: string; userId?: string; role: string; [key: string]: any },
  serviceId: string
) => {
  // 🟢 authUser.id বা authUser.userId দুটোই সেফলি হ্যান্ডেল করা হয়েছে
  const currentUserId = authUser.id || authUser.userId;

  const existingService = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!existingService || existingService.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'Service not found');
  }

  const userRole = authUser.role?.toUpperCase();

  if (userRole === 'TECHNICIAN') {
    const technicianProfile = await prisma.technicianProfile.findUnique({
      where: { userId: currentUserId }, // 🟢 Fixed: userId: undefined হওয়া বন্ধ করা হলো
    });

    if (
      !technicianProfile ||
      existingService.technicianId !== technicianProfile.id
    ) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Forbidden: You can only delete your own services'
      );
    }
  }

  const deletedService = await prisma.service.update({
    where: { id: serviceId },
    data: { isDeleted: true },
  });

  return deletedService;
};

export const ServiceService = {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
};