//src/modules/admin/admin.service.ts
import {prisma} from '../../lib/prisma';
import {
  IUserManagementFilterOptions,
  IUpdateUserStatusPayload,
  ICreateCategoryPayload,
} from './admin.interface';

const getAllUsers = async (filters: IUserManagementFilterOptions) => {
  const { role, status, search } = filters;
  const whereConditions: any = { isDeleted: false };

  if (role) whereConditions.role = role;
  if (status) whereConditions.status = status;

  if (search) {
    whereConditions.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const users = await prisma.user.findMany({
    where: whereConditions,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
      technicianProfile: { select: { id: true, averageRating: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return users;
};

const updateUserStatus = async (
  userId: string,
  payload: IUpdateUserStatusPayload
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error('User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status: payload.status },
    select: { id: true, name: true, email: true, status: true },
  });

  return updatedUser;
};

const getAllBookingsAdmin = async () => {
  const bookings = await prisma.booking.findMany({
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
    orderBy: { createdAt: 'desc' },
  });

  return bookings;
};

const getAllCategories = async () => {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return categories;
};

const createCategory = async (payload: ICreateCategoryPayload) => {
  // Auto-generate slug if not provided
  const slug =
    payload.slug ||
    payload.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

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

export const AdminService = {
  getAllUsers,
  updateUserStatus,
  getAllBookingsAdmin,
  getAllCategories,
  createCategory,
};