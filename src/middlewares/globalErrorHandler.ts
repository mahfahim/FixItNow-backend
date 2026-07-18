import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Prisma } from "../../generated/prisma/client";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error: ", err);

  
  let statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  let errorMessage = err.message || "Internal Server Error";
  let errorName = err.name || "Internal Server Error";
  let errorCode = err.code || err.errorCode || null;
  let errorMeta = err.meta || null;

  
  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    errorMessage = "You have provided incorrect field types or missing fields.";
  } 
  
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = httpStatus.BAD_REQUEST;
      const target = (err.meta?.target as string[])?.join(", ") || "field";
      errorMessage = `Duplicate Key Error: A record with this ${target} already exists.`;
    } else if (err.code === "P2003") {
      statusCode = httpStatus.BAD_REQUEST;
      const fieldName = err.meta?.field_name || "unknown field";
      errorMessage = `Foreign key constraint failed on the field: ${fieldName}.`;
    } else if (err.code === "P2025") {
      statusCode = httpStatus.NOT_FOUND; 
      errorMessage = "An operation failed because it depends on one or more records that were required but not found.";
    }
  } 
  
  else if (err instanceof Prisma.PrismaClientInitializationError) {
    if (err.errorCode === "P1000") {
      statusCode = httpStatus.UNAUTHORIZED;
      errorMessage = "Authentication failed against the database server. Please check your credentials.";
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

  
  const responsePayload = {
    success: false,
    message: errorMessage,
    errorDetails: {
      name: errorName,
      statusCode: statusCode,
      prismaCode: errorCode,
      meta: errorMeta,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    }
  };

  res.status(statusCode).json(responsePayload);
};