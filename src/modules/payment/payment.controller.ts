// src/modules/payment/payment.controller.ts
import { Request, Response } from "express";
import httpStatus from "http-status";
import {catchAsync} from "../../utils/catchAsync";
import {sendResponse} from "../../utils/sendResponse";
import { PaymentService } from "./payment.service";

const createPaymentIntent = catchAsync(async (req: Request, res: Response) => {
    
    const userId = req.user!.id;
    const result = await PaymentService.createPaymentIntent(userId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Payment intent initialized",
        data: result,
    });
});


const confirmPayment = catchAsync(async (req: Request, res: Response) => {
    const result = await PaymentService.confirmPayment(req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment verification completed",
        data: result,
    });
});


const stripeWebhook = catchAsync(async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;

    const result = await PaymentService.handleStripeWebhook(req.body as Buffer, signature);

    res.status(httpStatus.OK).json(result);
});

const getPaymentHistory = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await PaymentService.getPaymentHistory(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment history fetched successfully",
        data: result,
    });
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await PaymentService.getPaymentById(userId, req.params.id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment details fetched successfully",
        data: result,
    });
});

export const PaymentController = {
    createPaymentIntent,
    confirmPayment,
    stripeWebhook,
    getPaymentHistory,
    getPaymentById,
};