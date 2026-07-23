import { BookingStatus } from '../../../generated/prisma/client';
import httpStatus from 'http-status';
import {prisma} from '../../lib/prisma';
import AppError from '../../errors/AppError';
import { ICreateReviewPayload } from './review.interface';

const createReview = async (userId: string, payload: ICreateReviewPayload) => {
  const { bookingId, rating, comment } = payload;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Rating must be an integer between 1 and 5');
  }

  // 1. Verify booking exists and includes review
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { review: true },
  });

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  if (booking.customerId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'Forbidden: You can only review your own bookings');
  }

  if (booking.status !== BookingStatus.COMPLETED) {
    throw new AppError(httpStatus.BAD_REQUEST, 'You can only review completed jobs');
  }

  if (booking.review) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Review already submitted for this booking');
  }

  // 2. Create review & recalculate average rating inside a transaction
  const result = await prisma.$transaction(async (tx) => {
    const newReview = await tx.review.create({
      data: {
        bookingId,
        customerId: userId,
        technicianId: booking.technicianId,
        rating,
        comment,
      },
    });

    const ratingAggregate = await tx.review.aggregate({
      where: { technicianId: booking.technicianId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const averageRating = ratingAggregate._avg.rating
      ? Number(ratingAggregate._avg.rating.toFixed(2))
      : 0;
    const totalReviews = ratingAggregate._count.rating || 0;

    await tx.technicianProfile.update({
      where: { id: booking.technicianId },
      data: {
        averageRating,
        totalReviews,
      },
    });

    return newReview;
  });

  return result;
};

const getTechnicianReviews = async (technicianId: string) => {
  const reviews = await prisma.review.findMany({
    where: { technicianId },
    include: {
      customer: {
        select: { id: true, name: true },
      },
      booking: {
        select: {
          id: true,
          service: { select: { title: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return reviews;
};

const getMyReviews = async (userId: string) => {
  const reviews = await prisma.review.findMany({
    where: { customerId: userId },
    include: {
      technician: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
      booking: {
        select: {
          id: true,
          service: { select: { title: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return reviews;
};

const getReviewByBookingId = async (bookingId: string) => {
  const review = await prisma.review.findUnique({
    where: { bookingId },
    include: {
      customer: { select: { id: true, name: true } },
      booking: {
        select: { id: true, service: { select: { title: true } } },
      },
    },
  });

  return review;
};

export const ReviewService = {
  createReview,
  getTechnicianReviews,
  getMyReviews,
  getReviewByBookingId,
};