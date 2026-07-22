import { BookingStatus, Role } from '../../../generated/prisma/client';
import {prisma} from '../../lib/prisma';
import {
  ICreateBookingPayload,
  IBookingFilterOptions,
  IUpdateBookingStatusPayload,
} from './booking.interface';

const createBooking = async (userId: string, payload: ICreateBookingPayload) => {
  // 1. Check if the requested service exists
  const service = await prisma.service.findUnique({
    where: { id: payload.serviceId },
  });

  if (!service || service.isDeleted || !service.isAvailable) {
    throw new Error('Service is not available for booking');
  }

  if (!service.technicianId) {
    throw new Error('Technician profile for this service was not found.');
  }

  // 2. Validate scheduledDate
  const dateObj = new Date(payload.scheduledDate);
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date format for scheduledDate. Use YYYY-MM-DD.');
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
        // Safely spread optional fields
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
  filters: IBookingFilterOptions
) => {
  const whereConditions: any = {};

  if (filters.status) {
    whereConditions.status = filters.status;
  }

  if (filters.paymentStatus) {
    whereConditions.paymentStatus = filters.paymentStatus;
  }

  if (userRole === Role.CUSTOMER) {
    whereConditions.customerId = userId;
  } else if (userRole === Role.TECHNICIAN) {
    const technicianProfile = await prisma.technicianProfile.findUnique({
      where: { userId },
    });
    if (!technicianProfile) {
      throw new Error('Technician profile not found');
    }
    whereConditions.technicianId = technicianProfile.id;
  }

  const bookings = await prisma.booking.findMany({
    where: whereConditions,
    include: {
      customer: { select: { id: true, name: true, email: true } },
      technician: {
        include: { user: { select: { name: true, email: true } } },
      },
      service: { select: { id: true, title: true, price: true } },
      payment: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return bookings;
};

const getBookingById = async (userId: string, userRole: Role, bookingId: string) => {
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
    throw new Error('Booking not found');
  }

  if (userRole === Role.CUSTOMER && booking.customerId !== userId) {
    throw new Error('Forbidden: Access denied');
  }

  if (userRole === Role.TECHNICIAN) {
    const techProfile = await prisma.technicianProfile.findUnique({ where: { userId } });
    if (!techProfile || booking.technicianId !== techProfile.id) {
      throw new Error('Forbidden: Access denied');
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
    throw new Error('Booking not found');
  }

  if (userRole === Role.CUSTOMER) {
    if (booking.customerId !== userId) {
      throw new Error('Forbidden: Access denied');
    }
    if (payload.status !== BookingStatus.CANCELLED) {
      throw new Error('Customers can only cancel bookings');
    }
  }

  if (userRole === Role.TECHNICIAN) {
    const techProfile = await prisma.technicianProfile.findUnique({ where: { userId } });
    if (!techProfile || booking.technicianId !== techProfile.id) {
      throw new Error('Forbidden: Access denied');
    }
  }

  if (payload.status === BookingStatus.CANCELLED) {
    if (
      booking.status === BookingStatus.IN_PROGRESS ||
      booking.status === BookingStatus.COMPLETED
    ) {
      throw new Error('Cannot cancel a booking that is in progress or completed');
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