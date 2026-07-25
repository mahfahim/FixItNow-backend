import { BookingStatus, PaymentStatus, Prisma } from "../../../generated/prisma/client";
import httpStatus from "http-status";
import Stripe from "stripe";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import {
  IConfirmPaymentPayload,
  ICreatePaymentPayload,
  IPaginationOptions,
  IPaymentFilterRequest,
  IRefundPaymentPayload,
} from "./payment.interface";
import {
  executeRefund,
  generateTransactionId,
  initiatePaymentGateway,
  verifyWebhookSignature,
} from "./payment.utils";

const createPaymentIntent = async (
  userId: string,
  payload: ICreatePaymentPayload
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: payload.bookingId },
    include: { customer: true, service: true },
  });

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }

  if (booking.customerId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Forbidden: You are not authorized to pay for this booking"
    );
  }

  if (booking.status !== BookingStatus.ACCEPTED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Payment can only be initiated for accepted bookings"
    );
  }

  if (booking.paymentStatus === PaymentStatus.COMPLETED) {
    throw new AppError(httpStatus.BAD_REQUEST, "Booking is already paid");
  }

  const transactionId = generateTransactionId();

  const gatewayResult = await initiatePaymentGateway({
    transactionId,
    bookingId: booking.id,
    amount: Number(booking.price),
    provider: payload.provider,
    customerName: booking.customer.name,
    customerEmail: booking.customer.email,
    serviceName: booking.service?.title,
  });

  const payment = await prisma.payment.upsert({
    where: { bookingId: booking.id },
    update: {
      transactionId,
      provider: payload.provider,
      amount: booking.price,
      status: PaymentStatus.PENDING,
      metadata: gatewayResult.sessionId
        ? { stripeSessionId: gatewayResult.sessionId }
        : gatewayResult.sessionkey
        ? { sslSessionKey: gatewayResult.sessionkey }
        : undefined,
    },
    create: {
      bookingId: booking.id,
      transactionId,
      amount: booking.price,
      provider: payload.provider,
      status: PaymentStatus.PENDING,
      metadata: gatewayResult.sessionId
        ? { stripeSessionId: gatewayResult.sessionId }
        : gatewayResult.sessionkey
        ? { sslSessionKey: gatewayResult.sessionkey }
        : undefined,
    },
  });

  return {
    payment,
    gatewayUrl: gatewayResult.paymentUrl,
  };
};

const markPaymentCompleteInDB = async (
  transactionId: string,
  success: boolean,
  paymentIntentId?: string
) => {
  const payment = await prisma.payment.findUnique({ where: { transactionId } });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment session not found");
  }

  if (payment.status === PaymentStatus.COMPLETED) {
    return payment;
  }

  return prisma.$transaction(async (tx) => {
    const updatedMetadata = {
      ...(payment.metadata as object),
      ...(paymentIntentId ? { paymentIntentId } : {}),
    };

    const updatedPayment = await tx.payment.update({
      where: { transactionId },
      data: {
        status: success ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
        paidAt: success ? new Date() : null,
        metadata: updatedMetadata,
      },
    });

    if (success) {
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: {
          paymentStatus: PaymentStatus.COMPLETED,
          status: BookingStatus.PAID,
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: payment.bookingId,
          status: BookingStatus.PAID,
          note: "Payment successfully completed via gateway",
        },
      });
    }

    return updatedPayment;
  });
};

const confirmPayment = async (payload: IConfirmPaymentPayload) => {
  return markPaymentCompleteInDB(
    payload.transactionId,
    payload.status === "COMPLETED"
  );
};

const handleStripeWebhook = async (rawBody: Buffer, signature: string) => {
  const event = verifyWebhookSignature(rawBody, signature);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const transactionId = session.metadata?.transactionId;
      const paymentIntentId = session.payment_intent as string;
      if (transactionId) {
        await markPaymentCompleteInDB(transactionId, true, paymentIntentId);
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const transactionId = session.metadata?.transactionId;
      if (transactionId) {
        await markPaymentCompleteInDB(transactionId, false);
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const transactionId = intent.metadata?.transactionId;
      if (transactionId) {
        await markPaymentCompleteInDB(transactionId, false);
      }
      break;
    }

    default:
      break;
  }

  return { received: true };
};

const refundPayment = async (payload: IRefundPaymentPayload) => {
  const payment = await prisma.payment.findUnique({
    where: { id: payload.paymentId },
    include: { booking: true },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment record not found");
  }

  if (payment.status !== PaymentStatus.COMPLETED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only completed payments can be refunded"
    );
  }

  const metadata = payment.metadata as { paymentIntentId?: string } | null;
  const paymentIntentId = metadata?.paymentIntentId;

  if (payment.provider === "STRIPE" && paymentIntentId) {
    const refundAmountCents = payload.amount
      ? Math.round(payload.amount * 100)
      : undefined;
    await executeRefund(paymentIntentId, refundAmountCents);
  }

  return prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.REFUNDED,
        metadata: {
          ...(payment.metadata as object),
          refundReason: payload.reason || "Administrative refund",
          refundedAt: new Date(),
        },
      },
    });

    await tx.booking.update({
      where: { id: payment.bookingId },
      data: {
        paymentStatus: PaymentStatus.REFUNDED,
        status: BookingStatus.CANCELLED,
      },
    });

    await tx.bookingStatusHistory.create({
      data: {
        bookingId: payment.bookingId,
        status: BookingStatus.CANCELLED,
        note: `Payment refunded. Reason: ${payload.reason || "N/A"}`,
      },
    });

    return updatedPayment;
  });
};

const getPaymentHistory = async (
  userId: string,
  options: IPaginationOptions
) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  const whereCondition: Prisma.PaymentWhereInput = {
    booking: {
      customerId: userId,
    },
  };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where: whereCondition,
      include: {
        booking: {
          include: { service: { select: { title: true } } },
        },
      },
      orderBy: { [options.sortBy || "createdAt"]: options.sortOrder || "desc" },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where: whereCondition }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: payments,
  };
};

const getAllPayments = async (
  filters: IPaymentFilterRequest,
  options: IPaginationOptions
) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  const { searchTerm, status, provider, startDate, endDate } = filters;
  const andConditions: Prisma.PaymentWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { transactionId: { contains: searchTerm, mode: "insensitive" } },
        {
          booking: {
            customer: {
              name: { contains: searchTerm, mode: "insensitive" },
            },
          },
        },
        {
          booking: {
            customer: {
              email: { contains: searchTerm, mode: "insensitive" },
            },
          },
        },
      ],
    });
  }

  if (status) andConditions.push({ status });
  if (provider) andConditions.push({ provider });

  if (startDate && endDate) {
    andConditions.push({
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    });
  }

  const whereConditions: Prisma.PaymentWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where: whereConditions,
      include: {
        booking: {
          include: {
            customer: { select: { id: true, name: true, email: true } },
            service: { select: { title: true } },
          },
        },
      },
      orderBy: { [options.sortBy || "createdAt"]: options.sortOrder || "desc" },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where: whereConditions }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: payments,
  };
};

const getPaymentById = async (userId: string, userRole: string, paymentId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        include: {
          service: true,
          technician: true,
          customer: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment record not found");
  }

  if (userRole === "CUSTOMER" && payment.booking.customerId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Access denied: You do not own this payment record"
    );
  }

  return payment;
};

export const PaymentService = {
  createPaymentIntent,
  confirmPayment,
  handleStripeWebhook,
  refundPayment,
  getPaymentHistory,
  getAllPayments,
  getPaymentById,
};