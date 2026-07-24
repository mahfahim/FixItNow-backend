// src/middlewares/validateRequest.ts
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { catchAsync } from '../utils/catchAsync';

export const validateRequest = (schema: z.ZodType) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    await schema.parseAsync({
      body: req.body,
      cookies: req.cookies,
      query: req.query,
      params: req.params,
    });

    next();
  });
};