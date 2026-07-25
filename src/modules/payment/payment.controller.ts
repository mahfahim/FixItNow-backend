import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import  pick  from "../../utils/pick";
import { sendResponse } from "../../utils/sendResponse";
import { PaymentService } from "./payment.service";

const createPaymentIntent = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await PaymentService.createPaymentIntent(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Payment process initialized successfully",
    data: result,
  });
});

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.confirmPayment(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment status verified successfully",
    data: result,
  });
});

const stripeWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;

  const result = await PaymentService.handleStripeWebhook(
    req.body as Buffer,
    signature
  );

  res.status(httpStatus.OK).json({
    success: true,
    message: "Stripe webhook event processed",
    data: result,
  });
});

const refundPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.refundPayment(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment refunded successfully",
    data: result,
  });
});

const getPaymentHistory = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await PaymentService.getPaymentHistory(userId, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Customer payment history fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, [
    "searchTerm",
    "status",
    "provider",
    "startDate",
    "endDate",
  ]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await PaymentService.getAllPayments(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All payment records fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const paymentId = req.params.id as string;

  const result = await PaymentService.getPaymentById(userId, userRole, paymentId);

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
  refundPayment,
  getPaymentHistory,
  getAllPayments,
  getPaymentById,
};