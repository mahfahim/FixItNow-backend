import { Role, UserStatus, BookingStatus, PaymentStatus } from '../../../generated/prisma/client';

export type IPaginationOptions = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type IUserFilterOptions = {
  searchTerm?: string;
  role?: Role;
  status?: UserStatus;
};

export type IBookingFilterOptions = {
  searchTerm?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
};

export type ICategoryFilterOptions = {
  searchTerm?: string;
  isActive?: boolean;
};

export type IReviewFilterOptions = {
  searchTerm?: string;
  rating?: number;
};

export type IUpdateUserStatusPayload = {
  status: UserStatus;
};

export type ICreateCategoryPayload = {
  name: string;
  slug?: string;
  icon?: string;
  description?: string;
  isActive?: boolean;
};