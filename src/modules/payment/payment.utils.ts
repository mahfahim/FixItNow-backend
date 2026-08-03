import Stripe from "stripe";
import httpStatus from "http-status";
import { PaymentProvider } from "../../../generated/prisma/client";
import { stripe, stripeConfig } from "../../config/stripe.config";
import AppError from "../../errors/AppError";
import { IGatewayResult, IInitiatePaymentInput } from "./payment.interface";

export const generateTransactionId = (): string => {
  return `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
};

export const initiatePaymentGateway = async (
  data: IInitiatePaymentInput
): Promise<IGatewayResult> => {
  if (data.provider === PaymentProvider.STRIPE) {
    try {
  
      const numericAmount = Number(data.amount);

      if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid payment amount");
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: data.customerEmail,
        line_items: [
          {
            price_data: {
              currency: "usd", 
              product_data: {
                name: data.serviceName || "Service Booking Payment",
              },
              
              unit_amount: Math.round(numericAmount * 100),
            },
            quantity: 1,
          },
        ],
        metadata: {
          transactionId: data.transactionId,
          bookingId: data.bookingId,
        },
        success_url: `${stripeConfig.successUrl}?session_id={CHECKOUT_SESSION_ID}&txn=${data.transactionId}`,
        cancel_url: stripeConfig.cancelUrl,
      });

      if (!session.url) {
        throw new AppError(
          httpStatus.INTERNAL_SERVER_ERROR,
          "Failed to generate Stripe checkout URL"
        );
      }

      return {
        paymentUrl: session.url,
        sessionId: session.id,
      };
    } catch (error: any) {
      throw new AppError(
        error.statusCode || httpStatus.BAD_REQUEST,
        `Stripe Gateway Error: ${error.message || "Failed to initiate payment"}`
      );
    }
  }

  if (data.provider === PaymentProvider.SSLCOMMERZ) {
    return {
      paymentUrl: `https://sandbox.sslcommerz.com/gwprocess/v4/api.php?Q=mock_${data.transactionId}`,
      sessionkey: `mock_session_${data.transactionId}`,
    };
  }

  throw new AppError(
    httpStatus.BAD_REQUEST,
    `Unsupported payment provider: ${data.provider}`
  );
};

export const verifyStripeSession = async (
  sessionId: string
): Promise<Stripe.Checkout.Session> => {
  try {
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch (error: any) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Failed to verify Stripe Session: ${error.message}`
    );
  }
};

export const verifyWebhookSignature = (
  rawBody: Buffer,
  signature: string
): Stripe.Event => {
  try {
    return stripe.webhooks.constructEvent(
      rawBody,
      signature,
      stripeConfig.webhookSecret
    );
  } catch (err: any) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Webhook signature verification failed: ${err.message}`
    );
  }
};

export const executeRefund = async (
  paymentIntentId: string,
  amountInCents?: number
): Promise<Stripe.Refund> => {
  try {
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };
    if (amountInCents) {
      refundParams.amount = amountInCents;
    }
    return await stripe.refunds.create(refundParams);
  } catch (error: any) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Stripe Refund Failed: ${error.message}`
    );
  }
};