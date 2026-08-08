import { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import {
  IUserFilterOptions,
  IBookingFilterOptions,
  ICategoryFilterOptions,
  IReviewFilterOptions,
  IPaginationOptions,
  IUpdateUserStatusPayload,
  ICreateCategoryPayload,
} from './admin.interface';

const getAllUsers = async (
  filters: IUserFilterOptions & { search?: string } = {},
  options: IPaginationOptions = {}
) => {
  const searchTerm = filters.searchTerm ;
  const { role, status } = filters;
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;
  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder || 'desc';

  const andConditions: Prisma.UserWhereInput[] = [{ isDeleted: false }];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
      ],
    });
  }

  if (role) andConditions.push({ role });
  if (status) andConditions.push({ status });

  const whereConditions: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.user.findMany({
    where: whereConditions,
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
      technicianProfile: { select: { id: true, averageRating: true } },
    },
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });
  

  const total = await prisma.user.count({ where: whereConditions });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: result,
  };
};

const updateUserStatus = async (
  userId: string,
  payload: IUpdateUserStatusPayload
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status: payload.status },
    select: { id: true, name: true, email: true, status: true },
  });

  return updatedUser;
};
const getAllBookingsAdmin = async (
  filters: IBookingFilterOptions & { search?: string },
  options: IPaginationOptions
) => {
  
  const searchTerm = filters.searchTerm || filters.search;
  const { status, paymentStatus } = filters;

  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;
  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder || 'desc';

  const andConditions: Prisma.BookingWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        
        { id: { contains: searchTerm, mode: 'insensitive' } },
      
        { customer: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { customer: { email: { contains: searchTerm, mode: 'insensitive' } } },
        
        { service: { title: { contains: searchTerm, mode: 'insensitive' } } },
      
        { technician: { user: { name: { contains: searchTerm, mode: 'insensitive' } } } },
        { technician: { user: { email: { contains: searchTerm, mode: 'insensitive' } } } },
      ],
    });
  }

  if (status) andConditions.push({ status });
  if (paymentStatus) andConditions.push({ paymentStatus });

  const whereConditions: Prisma.BookingWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.booking.findMany({
    where: whereConditions,
    include: {
      customer: { select: { id: true, name: true, email: true } },
      technician: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      service: { select: { id: true, title: true, price: true } },
      payment: true,
    },
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await prisma.booking.count({ where: whereConditions });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: result,
  };
};

const getAllCategories = async (
  filters: ICategoryFilterOptions,
  options: IPaginationOptions
) => {
  const { searchTerm, isActive } = filters;
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;
  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder || 'desc';

  const andConditions: Prisma.CategoryWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      name: { contains: searchTerm, mode: 'insensitive' },
    });
  }

  if (isActive !== undefined) {
    andConditions.push({ isActive });
  }

  const whereConditions: Prisma.CategoryWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.category.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await prisma.category.count({ where: whereConditions });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: result,
  };
};

const createCategory = async (payload: ICreateCategoryPayload) => {
  const slug =
    payload.slug ||
    payload.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const existingCategory = await prisma.category.findUnique({
    where: { slug },
  });

  if (existingCategory) {
    throw new AppError(httpStatus.CONFLICT, 'Category with this slug already exists');
  }

  const category = await prisma.category.create({
    data: {
      name: payload.name,
      slug,
      icon: payload.icon || null,
      description: payload.description || null,
      isActive: payload.isActive !== undefined ? payload.isActive : true,
    },
  });

  return category;
};

const getAllReviews = async (
  filters: IReviewFilterOptions,
  options: IPaginationOptions
) => {
  const { searchTerm, rating } = filters;
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;
  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder || 'desc';

  const andConditions: Prisma.ReviewWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { customer: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { comment: { contains: searchTerm, mode: 'insensitive' } },
      ],
    });
  }

  if (rating) {
    andConditions.push({ rating: Number(rating) });
  }

  const whereConditions: Prisma.ReviewWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.review.findMany({
    where: whereConditions,
    include: {
      customer: { select: { id: true, name: true, email: true } },
      technician: {
        include: { user: { select: { name: true, email: true } } },
      },
      booking: { select: { id: true, service: { select: { title: true } } } },
    },
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await prisma.review.count({ where: whereConditions });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: result,
  };
};

const deleteReview = async (reviewId: string) => {
  const existingReview = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!existingReview) {
    throw new AppError(httpStatus.NOT_FOUND, 'Review not found');
  }

  const result = await prisma.$transaction(async (tx) => {
    const deleted = await tx.review.delete({
      where: { id: reviewId },
    });

    const ratingAggregate = await tx.review.aggregate({
      where: { technicianId: existingReview.technicianId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const averageRating = ratingAggregate._avg.rating
      ? Number(ratingAggregate._avg.rating.toFixed(2))
      : 0;
    const totalReviews = ratingAggregate._count.rating || 0;

    await tx.technicianProfile.update({
      where: { id: existingReview.technicianId },
      data: {
        averageRating,
        totalReviews,
      },
    });

    return deleted;
  });

  return result;
};

export const AdminService = {
  getAllUsers,
  updateUserStatus,
  getAllBookingsAdmin,
  getAllCategories,
  createCategory,
  getAllReviews,
  deleteReview,
};