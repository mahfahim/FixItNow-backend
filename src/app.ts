// src/app.ts
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import config from "./config";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { notFound } from "./middlewares/notFound";
import { AuthRoutes } from "./modules/auth/auth.route";
import { CategoryRoutes } from "./modules/category/category.route";
import { TechnicianRoutes } from "./modules/technician/technician.route";
import { ServiceRoutes } from "./modules/service/service.route";
import { BookingRoutes } from "./modules/booking/booking.route";
import { AdminRoutes } from "./modules/admin/admin.route";
import { ReviewRoutes } from "./modules/review/review.route";
import { PaymentRoutes } from "./modules/payment/payment.route";
import { PaymentController } from "./modules/payment/payment.controller";

const app: Application = express();

app.use(cors({
    origin: config.app_url,
    credentials: true,
}))


app.post(
  "/api/payment/webhook/stripe",
  express.raw({ type: "application/json" }),
  PaymentController.stripeWebhook
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.get("/", (req: Request, res: Response) => {
    res.send("Hello, World!");
});

app.get("/payment/success", (req: Request, res: Response) => {
  res.status(200).send(`
    <html>
      <head>
        <title>Payment Successful</title>
      </head>
      <body style="font-family: Arial, sans-serif; text-align:center; margin-top:100px;">
        <h1>✅ Payment Successful</h1>
        <p>Your payment has been completed successfully.</p>
      </body>
    </html>
  `);
});

app.get("/payment/cancel", (req: Request, res: Response) => {
  res.status(200).send(`
    <html>
      <head>
        <title>Payment Cancelled</title>
      </head>
      <body style="font-family: Arial, sans-serif; text-align:center; margin-top:100px;">
        <h1>❌ Payment Cancelled</h1>
        <p>Your payment was cancelled.</p>
      </body>
    </html>
  `);
});



app.use("/api/auth", AuthRoutes)
app.use("/api/categories", CategoryRoutes)
app.use('/api/technicians', TechnicianRoutes);
app.use("/api/services", ServiceRoutes);
app.use("/api/bookings", BookingRoutes);
app.use("/api/payment", PaymentRoutes);
app.use('/api/admin', AdminRoutes);
app.use('/api/review', ReviewRoutes);

app.use(notFound)
app.use(globalErrorHandler)

export default app;