import httpStatus from 'http-status';
import { BookingStatus, Role } from '../../../generated/prisma/client';
import AppError from '../../errors/AppError';
import { prisma } from '../../lib/prisma';
import {
  IBookingFilterOptions,
  ICreateBookingPayload,
  IPaginationOptions,
  IUpdateBookingStatusPayload,
} from './booking.interface';

const createBooking = async (userId: string, payload: ICreateBookingPayload) => {
  // 1. Check if the requested service exists
  const service = await prisma.service.findUnique({
    where: { id: payload.serviceId },
  });

  if (!service || service.isDeleted || !service.isAvailable) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Service is not available for booking'
    );
  }

  if (!service.technicianId) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Technician profile for this service was not found.'
    );
  }

  // 2. Validate scheduledDate
  const dateObj = new Date(payload.scheduledDate);
  if (isNaN(dateObj.getTime())) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Invalid date format for scheduledDate. Use YYYY-MM-DD.'
    );
  }

  // 3. Create booking inside transaction
  const booking = await prisma.$transaction(async (tx) => {
    const newBooking = await tx.booking.create({
      data: {
        customerId: userId,
        technicianId: service.technicianId,
        serviceId: service.id,
        scheduledDate: dateObj,
        scheduledTime: payload.scheduledTime,
        address: payload.address,
        price: service.price,
        status: BookingStatus.REQUESTED,
        ...(payload.addressId ? { addressId: payload.addressId } : {}),
        ...(payload.notes ? { notes: payload.notes } : {}),
      },
    });

    // Create entry in booking status history
    await tx.bookingStatusHistory.create({
      data: {
        bookingId: newBooking.id,
        status: BookingStatus.REQUESTED,
        note: 'Booking requested by customer',
      },
    });

    return newBooking;
  });

  return booking;
};

const getUserBookings = async (
  userId: string,
  userRole: Role,
  filters: IBookingFilterOptions,
  paginationOptions: IPaginationOptions
) => {
  const { searchTerm, status, paymentStatus, startDate, endDate } = filters;
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = paginationOptions;

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const andConditions: any[] = [];

  //  Search Term Filtering
  if (searchTerm) {
    andConditions.push({
      OR: [
        { address: { contains: searchTerm, mode: 'insensitive' } },
        { service: { title: { contains: searchTerm, mode: 'insensitive' } } },
        { customer: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ],
    });
  }

  //  Status & Payment Status Filter
  if (status) {
    andConditions.push({ status });
  }

  if (paymentStatus) {
    andConditions.push({ paymentStatus });
  }

  //  Date Range Filter
  if (startDate && endDate) {
    andConditions.push({
      scheduledDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    });
  }

  // 👤 Role-based Authorization Filter
  if (userRole === Role.CUSTOMER) {
    andConditions.push({ customerId: userId });
  } else if (userRole === Role.TECHNICIAN) {
    const technicianProfile = await prisma.technicianProfile.findUnique({
      where: { userId },
    });
    if (!technicianProfile) {
      throw new AppError(httpStatus.NOT_FOUND, 'Technician profile not found');
    }
    andConditions.push({ technicianId: technicianProfile.id });
  }
  // Admin receives all bookings filtered by conditions

  const whereConditions = andConditions.length > 0 ? { AND: andConditions } : {};

  const bookings = await prisma.booking.findMany({
    where: whereConditions,
    skip,
    take: limitNum,
    orderBy: { [sortBy]: sortOrder },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      technician: {
        include: { user: { select: { name: true, email: true } } },
      },
      service: { select: { id: true, title: true, price: true } },
      payment: true,
    },
  });

  const total = await prisma.booking.count({ where: whereConditions });

  return {
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPage: Math.ceil(total / limitNum),
    },
    data: bookings,
  };
};

const getBookingById = async (
  userId: string,
  userRole: Role,
  bookingId: string
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      technician: {
        include: { user: { select: { name: true, email: true } } },
      },
      service: true,
      payment: true,
      statusHistory: { orderBy: { createdAt: 'desc' } },
      review: true,
    },
  });

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  if (userRole === Role.CUSTOMER && booking.customerId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'Forbidden: Access denied');
  }

  if (userRole === Role.TECHNICIAN) {
    const techProfile = await prisma.technicianProfile.findUnique({
      where: { userId },
    });
    if (!techProfile || booking.technicianId !== techProfile.id) {
      throw new AppError(httpStatus.FORBIDDEN, 'Forbidden: Access denied');
    }
  }

  return booking;
};

const updateBookingStatus = async (
  userId: string,
  userRole: Role,
  bookingId: string,
  payload: IUpdateBookingStatusPayload
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  if (userRole === Role.CUSTOMER) {
    if (booking.customerId !== userId) {
      throw new AppError(httpStatus.FORBIDDEN, 'Forbidden: Access denied');
    }
    if (payload.status !== BookingStatus.CANCELLED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Customers can only cancel bookings'
      );
    }
  }

  if (userRole === Role.TECHNICIAN) {
    const techProfile = await prisma.technicianProfile.findUnique({
      where: { userId },
    });
    if (!techProfile || booking.technicianId !== techProfile.id) {
      throw new AppError(httpStatus.FORBIDDEN, 'Forbidden: Access denied');
    }
  }

  if (payload.status === BookingStatus.CANCELLED) {
    if (
      booking.status === BookingStatus.IN_PROGRESS ||
      booking.status === BookingStatus.COMPLETED
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Cannot cancel a booking that is in progress or completed'
      );
    }
  }

  const updatedBooking = await prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: payload.status,
        cancellationReason: payload.cancellationReason || null,
      },
    });

    await tx.bookingStatusHistory.create({
      data: {
        bookingId,
        status: payload.status,
        note: payload.note || `Status changed to ${payload.status}`,
      },
    });

    if (
      payload.status === BookingStatus.COMPLETED &&
      booking.status !== BookingStatus.COMPLETED
    ) {
      await tx.technicianProfile.update({
        where: { id: booking.technicianId },
        data: { totalCompletedJobs: { increment: 1 } },
      });
    }

    return updated;
  });

  return updatedBooking;
};

export const BookingService = {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
};