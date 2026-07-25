import { BookingStatus, Prisma } from '../../../generated/prisma/client';
import httpStatus from 'http-status';
import { prisma } from '../../lib/prisma';
import AppError from '../../errors/AppError';
import { ICreateReviewPayload, IReviewFilterOptions } from './review.interface';

const createReview = async (userId: string, payload: ICreateReviewPayload) => {
  const { bookingId, rating, comment } = payload;

  // 1. Verify booking exists and includes review
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { review: true },
  });

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  if (booking.customerId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Forbidden: You can only review your own bookings'
    );
  }

  if (booking.status !== BookingStatus.COMPLETED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You can only review completed jobs'
    );
  }

  if (booking.review) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Review already submitted for this booking'
    );
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

// GetAll with Pagination, Filtering, and Search
const getAllReviews = async (filters: IReviewFilterOptions) => {
  const {
    searchTerm,
    rating,
    technicianId,
    customerId,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 10;
  const skip = (pageNumber - 1) * limitNumber;

  const andConditions: Prisma.ReviewWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { comment: { contains: searchTerm, mode: 'insensitive' } },
        { customer: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ],
    });
  }

  if (rating) {
    andConditions.push({ rating: Number(rating) });
  }

  if (technicianId) {
    andConditions.push({ technicianId });
  }

  if (customerId) {
    andConditions.push({ customerId });
  }

  const whereConditions: Prisma.ReviewWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const reviews = await prisma.review.findMany({
    where: whereConditions,
    include: {
      customer: { select: { id: true, name: true, email: true } },
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
    skip,
    take: limitNumber,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await prisma.review.count({ where: whereConditions });

  return {
    meta: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPage: Math.ceil(total / limitNumber),
    },
    data: reviews,
  };
};

const getTechnicianReviews = async (
  technicianId: string,
  filters: IReviewFilterOptions
) => {
  return getAllReviews({ ...filters, technicianId });
};

const getMyReviews = async (userId: string, filters: IReviewFilterOptions) => {
  return getAllReviews({ ...filters, customerId: userId });
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

  if (!review) {
    throw new AppError(httpStatus.NOT_FOUND, 'Review not found for this booking');
  }

  return review;
};

export const ReviewService = {
  createReview,
  getAllReviews,
  getTechnicianReviews,
  getMyReviews,
  getReviewByBookingId,
};