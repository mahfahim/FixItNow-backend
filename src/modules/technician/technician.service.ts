// src/modules/technician/technician.service.ts
import {prisma} from '../../lib/prisma';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { BookingStatus } from '../../../generated/prisma/enums';
import {
  IAvailabilitySlotPayload,
  ITechnicianFilterOptions,
  IUpdateBookingStatusPayload,
  IUpdateTechnicianProfile,
} from './technician.interface';


const updateProfile = async (
  userId: string,
  payload: IUpdateTechnicianProfile
) => {

  if (!userId) {
    throw new Error('User ID is missing from authorization token');
  }

  const profile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new Error('Technician profile not found');
  }

  const {
    bio,
    yearsOfExperience,
    hourlyRate,
    profileImage,
    phone,
    address,
    city,
    district,
  } = payload;

  const updatedProfile = await prisma.technicianProfile.update({
    where: { id: profile.id},
    data: {
      bio,
      yearsOfExperience: yearsOfExperience !== undefined ? Number(yearsOfExperience) : undefined,
      hourlyRate: hourlyRate !== undefined ? Number(hourlyRate) : undefined,
      profileImage,
      phone,
      address,
      city,
      district,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return updatedProfile;
};


const setAvailability = async (
  userId: string,
  slots: IAvailabilitySlotPayload[]
) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const profile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new Error('Technician profile not found');
  }

  
  const result = await prisma.$transaction(async (tx) => {
    
    await tx.availabilitySlot.deleteMany({
      where: { technicianId: profile.id },
    });

    
    const createdSlots = await tx.availabilitySlot.createMany({
      data: slots.map((slot) => ({
        technicianId: profile.id,
        weekday: slot.weekday,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable: slot.isAvailable ?? true,
      })),
    });

    return createdSlots;
  });

  return result;
};


const getAllTechnicians = async (filters: ITechnicianFilterOptions) => {
  const { search, city, district, minRating } = filters;
  const whereConditions: any = {
    isDeleted: false,
  };

  if (city) whereConditions.city = {
     equals: city, mode: 'insensitive' 
  };

  if (district) whereConditions.district = { 
    equals: district, mode: 'insensitive'
  };

  if (minRating && !isNaN(Number(minRating))) {
    whereConditions.averageRating = { gte: Number(minRating) };
  }

  if (search) {
    whereConditions.OR = [
      { bio: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const result = await prisma.technicianProfile.findMany({
    where: whereConditions,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      services: {
        where: { isAvailable: true, isDeleted: false },
        include: { category: true },
      },
    },
  });

  return result;
};

const getTechnicianById = async (id: string) => {
  if (!id) {
    throw new Error('Technician ID is required');
  }
  const result = await prisma.technicianProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      services: {
        where: { isDeleted: false },
        include: { category: true },
      },
      availabilitySlots: true,
      reviewsReceived: {
        include: {
          customer: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!result || result.isDeleted) {
    throw new Error('Technician not found');
  }

  return result;
};


// GET Technician's Bookings
const getTechnicianBookings = async (userId: string) => {
  if (!userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User ID is missing from authorization token');
  }

  const profile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new AppError(
      httpStatus.NOT_FOUND, 
      'Technician profile not found. Please create or update your profile first.'
    );
  }

  const bookings = await prisma.booking.findMany({
    where: { technicianId: profile.id },
    include: {
      customer: {
        select: { id: true, name: true, email: true },
      },
      service: true,
      addressRef: true,
      payment: true,
      review: true,
      statusHistory: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return bookings;
};


// UPDATE Booking Status
const updateBookingStatus = async (
  userId: string,
  bookingId: string,
  payload: IUpdateBookingStatusPayload
) => {
  const profile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new Error('Technician profile not found');
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking || booking.technicianId !== profile.id) {
    throw new Error('Booking not found or unauthorized access');
  }

  const { status, note, cancellationReason } = payload;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Update booking status
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status,
        cancellationReason: cancellationReason || booking.cancellationReason,
      },
    });

    // 2. Add entry to status history
    await tx.bookingStatusHistory.create({
      data: {
        bookingId,
        status,
        note: note || `Status updated to ${status}`,
      },
    });

    // 3. Increment totalCompletedJobs if marked as COMPLETED
    if (status === BookingStatus.COMPLETED && booking.status !== BookingStatus.COMPLETED) {
      await tx.technicianProfile.update({
        where: { id: profile.id },
        data: {
          totalCompletedJobs: { increment: 1 },
        },
      });
    }

    return updatedBooking;
  });

  return result;
};


export const TechnicianService = {
  updateProfile,
  setAvailability,
  getAllTechnicians,
  getTechnicianById,
  getTechnicianBookings,
  updateBookingStatus,
};