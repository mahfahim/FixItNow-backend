// src/modules/payment/payment.utils.ts
import { PaymentProvider } from "../../../generated/prisma/client";
import { stripe, stripeConfig } from "../../config/stripe.config";

export const generateTransactionId = (): string => {
    return `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
};

type InitiatePaymentInput = {
    transactionId: string;
    bookingId: string;
    amount: number;
    provider: PaymentProvider;
    customerName: string;
    customerEmail: string;
    serviceName?: string;
};

type GatewayResult = {
    paymentUrl: string;
    sessionId?: string;
    sessionkey?: string; 
};

export const initiatePaymentGateway = async (
    data: InitiatePaymentInput
): Promise<GatewayResult> => {
    if (data.provider === PaymentProvider.STRIPE) {
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
                        unit_amount: Math.round(data.amount * 100), // Stripe expects cents
                    },
                    quantity: 1,
                },
            ],
          
            metadata: {
                transactionId: data.transactionId,
                bookingId: data.bookingId,
            },
            success_url: `${stripeConfig.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: stripeConfig.cancelUrl,
        });

        if (!session.url) {
            throw new Error("Failed to create Stripe checkout session");
        }

        return {
            paymentUrl: session.url,
            sessionId: session.id,
        };
    }

    if (data.provider === PaymentProvider.SSLCOMMERZ) {
        
        return {
            paymentUrl: `https://sandbox.sslcommerz.com/gwprocess/v4/api.php?Q=mock_${data.transactionId}`,
            sessionkey: `mock_session_${data.transactionId}`,
        };
    }

    throw new Error("Unsupported payment provider");
};