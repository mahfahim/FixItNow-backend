// src/config/stripe.config.ts
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
   
    console.warn(" STRIPE_WEBHOOK_SECRET is not set. Stripe webhook verification will fail.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-06-24.dahlia",
});

export const stripeConfig = {
    secretKey: process.env.STRIPE_SECRET_KEY as string,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET as string,
    successUrl: process.env.STRIPE_SUCCESS_URL || "http://localhost:3000/payment/success",
    cancelUrl: process.env.STRIPE_CANCEL_URL || "http://localhost:3000/payment/cancel",
};