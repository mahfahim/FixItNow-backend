// src/middlewares/globalErrorHandler.ts

import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { ZodError } from "zod";
import { Prisma } from "../../generated/prisma/client"; 
import AppError from "../errors/AppError";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error Logged:", err);

  
  let statusCode: number = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  let errorMessage: string = err.message || "Something went wrong!";
  let errorName: string = err.name || "Error";
  let errorCode: string | null = err.code || err.errorCode || null;
  let errorDetails: Record<string, any> = {};

  
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorMessage = err.message;
    errorName = "AppError";
    errorDetails = {
      name: errorName,
      statusCode,
    };
  }

  
  else if (err instanceof ZodError) {
    statusCode = httpStatus.BAD_REQUEST;
    errorName = "ZodValidationError";

    
    errorMessage = err.issues
      .map((issue) => {
        const lastPath = issue.path[issue.path.length - 1];
        return lastPath ? `${String(lastPath)}: ${issue.message}` : issue.message;
      })
      .join("; ");

    
    errorDetails = {
      name: errorName,
      statusCode,
      issues: err.issues.map((issue) => ({
        field: issue.path.map(String).join("."),
        message: issue.message,
      })),
    };
  }

  
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    errorName = "PrismaValidationError";
    errorMessage = "You have provided incorrect field types or missing fields.";
    errorDetails = {
      name: errorName,
      statusCode,
    };
  }

  
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    errorName = "PrismaKnownRequestError";
    errorCode = err.code;

    if (err.code === "P2002") {
      statusCode = httpStatus.CONFLICT;
      errorMessage = "Duplicate key error. Record already exists.";
    } else if (err.code === "P2003") {
      statusCode = httpStatus.BAD_REQUEST;
      errorMessage = "Foreign key constraint failed.";
    } else if (err.code === "P2025") {
      statusCode = httpStatus.NOT_FOUND;
      errorMessage = "The requested record was not found.";
    } else {
      statusCode = httpStatus.BAD_REQUEST;
      errorMessage = err.message;
    }

    errorDetails = {
      name: errorName,
      statusCode,
      prismaCode: errorCode,
    };
  }

  
  else if (err instanceof Prisma.PrismaClientInitializationError) {
    errorName = "PrismaInitializationError";
    errorCode = err.errorCode || null;

    if (err.errorCode === "P1000") {
      statusCode = httpStatus.UNAUTHORIZED;
      errorMessage = "Authentication failed against the database server.";
    } else if (err.errorCode === "P1001") {
      statusCode = httpStatus.SERVICE_UNAVAILABLE;
      errorMessage = "Cannot reach the database server.";
    }

    errorDetails = {
      name: errorName,
      statusCode,
      prismaCode: errorCode,
    };
  }

  
  else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    errorName = "PrismaUnknownRequestError";
    errorMessage = "An error occurred during query execution.";
    errorDetails = {
      name: errorName,
      statusCode,
    };
  }

  
  else {
    errorDetails = {
      name: errorName,
      statusCode,
    };
  }

  
  if (res.headersSent) {
    return next(err);
  }

  
  res.status(statusCode).json({
    success: false,
    message: errorMessage,
    errorDetails,
  });
};