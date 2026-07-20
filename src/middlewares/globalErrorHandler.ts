// src/middlewares/globalErrorHandler.ts

import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Prisma } from "../../generated/prisma/client";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", err);

  let statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  let errorMessage = err.message || "Internal Server Error";
  let errorName = err.name || "Internal Server Error";
  let errorCode = err.code || err.errorCode || null;

  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    errorMessage =
      "You have provided incorrect field types or missing fields.";
  }

  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = httpStatus.BAD_REQUEST;
      errorMessage = "Duplicate key error. Record already exists.";
    } else if (err.code === "P2003") {
      statusCode = httpStatus.BAD_REQUEST;
      errorMessage = "Foreign key constraint failed.";
    } else if (err.code === "P2025") {
      statusCode = httpStatus.NOT_FOUND;
      errorMessage =
        "The requested record was not found.";
    }
  }

  else if (err instanceof Prisma.PrismaClientInitializationError) {
    if (err.errorCode === "P1000") {
      statusCode = httpStatus.UNAUTHORIZED;
      errorMessage =
        "Authentication failed against the database server.";
    } else if (err.errorCode === "P1001") {
      statusCode = httpStatus.SERVICE_UNAVAILABLE;
      errorMessage = "Cannot reach the database server.";
    }
  }

  else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    errorMessage = "An error occurred during query execution.";
  }

  if (res.headersSent) {
    return next(err);
  }

  res.status(statusCode).json({
    success: false,
    message: errorMessage,
    errorDetails: {
      name: errorName,
      statusCode,
      prismaCode: errorCode,
    },
  });
};