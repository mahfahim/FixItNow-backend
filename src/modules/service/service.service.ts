import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { prisma } from '../../lib/prisma';
import {
  ICreateServicePayload,
  IServiceFilterOptions,
  IUpdateServicePayload,
} from './service.interface';

const createService = async (
  authUser: { userId: string; role: string },
  payload: ICreateServicePayload
) => {
  let targetTechnicianId = payload.technicianId;

  if (authUser.role === 'TECHNICIAN') {
    const technicianProfile = await prisma.technicianProfile.findUnique({
      where: { userId: authUser.userId },
    });

    if (!technicianProfile) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'Technician profile not found'
      );
    }
    targetTechnicianId = technicianProfile.id;
  } else if (authUser.role === 'ADMIN') {
    if (!targetTechnicianId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'technicianId is required when creating a service as Admin'
      );
    }

    // Admin targetTechnicianId হিসেবে TechnicianProfile.id অথবা User.id দুটোই পাঠাতে পারবে
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
      technicianId: targetTechnicianId as string,
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
  authUser: { userId: string; role: string },
  serviceId: string,
  payload: IUpdateServicePayload
) => {
  const existingService = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!existingService || existingService.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'Service not found');
  }

  if (authUser.role === 'TECHNICIAN') {
    const technicianProfile = await prisma.technicianProfile.findUnique({
      where: { userId: authUser.userId },
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

  const updatedService = await prisma.service.update({
    where: { id: serviceId },
    data: payload,
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
  authUser: { userId: string; role: string },
  serviceId: string
) => {
  const existingService = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!existingService || existingService.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'Service not found');
  }

  if (authUser.role === 'TECHNICIAN') {
    const technicianProfile = await prisma.technicianProfile.findUnique({
      where: { userId: authUser.userId },
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