// src/modules/payment/payment.service.ts
import { BookingStatus, PaymentStatus } from "../../../generated/prisma/client";
import Stripe from "stripe";
import {prisma} from "../../lib/prisma";
import { stripe, stripeConfig } from "../../config/stripe.config";
import { IConfirmPaymentPayload, ICreatePaymentPayload } from "./payment.interface";
import { generateTransactionId, initiatePaymentGateway } from "./payment.utils";

const createPaymentIntent = async (userId: string, payload: ICreatePaymentPayload) => {
    const booking = await prisma.booking.findUnique({
        where: { id: payload.bookingId },
        include: { customer: true, service: true },
    });

    if (!booking) {
        throw new Error("Booking not found");
    }

    if (booking.customerId !== userId) {
        throw new Error("Forbidden: Access denied");
    }

    if (booking.status !== BookingStatus.ACCEPTED) {
        throw new Error("Payment can only be initiated for accepted bookings");
    }

    if (booking.paymentStatus === PaymentStatus.COMPLETED) {
        throw new Error("Booking is already paid");
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


const markPaymentCompleteInDB = async (transactionId: string, success: boolean) => {
    const payment = await prisma.payment.findUnique({ where: { transactionId } });

    if (!payment) {
        throw new Error("Payment session not found");
    }

    
    if (payment.status === PaymentStatus.COMPLETED) {
        return payment;
    }

    return prisma.$transaction(async (tx) => {
        const updatedPayment = await tx.payment.update({
            where: { transactionId },
            data: {
                status: success ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
                paidAt: success ? new Date() : null,
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
                    note: "Payment successfully processed",
                },
            });
        }

        return updatedPayment;
    });
};


const confirmPayment = async (payload: IConfirmPaymentPayload) => {
    return markPaymentCompleteInDB(payload.transactionId, payload.status === "COMPLETED");
};


const handleStripeWebhook = async (rawBody: Buffer, signature: string) => {
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(rawBody, signature, stripeConfig.webhookSecret);
    } catch (err: any) {
        throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const transactionId = session.metadata?.transactionId;
            if (transactionId) {
                await markPaymentCompleteInDB(transactionId, true);
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
            // ignore other events
            break;
    }

    return { received: true };
};

const getPaymentHistory = async (userId: string) => {
    const payments = await prisma.payment.findMany({
        where: {
            booking: {
                customerId: userId,
            },
        },
        include: {
            booking: {
                include: { service: { select: { title: true } } },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return payments;
};

const getPaymentById = async (userId: string, paymentId: string) => {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
            booking: {
                include: { service: true, technician: true },
            },
        },
    });

    if (!payment || payment.booking.customerId !== userId) {
        throw new Error("Payment record not found or access denied");
    }

    return payment;
};

export const PaymentService = {
    createPaymentIntent,
    confirmPayment,
    handleStripeWebhook,
    getPaymentHistory,
    getPaymentById,
};