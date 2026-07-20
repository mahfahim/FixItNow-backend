// src/modules/auth/auth.controller.ts
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AuthService } from "./auth.service";
import config from "../../config";

const register = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.registerUserIntoDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "User registered successfully",
    data: result,
  });
});


const login = catchAsync(async (req : Request, res : Response, next : NextFunction) => {
    const payload = req.body;

    const {accessToken, refreshToken} = await AuthService.loginUser(payload);

    res.cookie("accessToken", accessToken, {
        httpOnly : true,
        secure : false,
        sameSite : "none",
        maxAge : 1000 * 60 * 60 * 24 // 24 hour or 1 day
    })

    res.cookie("refreshToken", refreshToken, {
        httpOnly : true,
        secure : false,
        sameSite : "none",
        maxAge : 1000 * 60 * 60 * 24 * 7 // 7 days
    })

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User logged in successfully",
        data: { accessToken, refreshToken }
    });
});

const refreshToken = catchAsync(async (req : Request, res : Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;

    const {accessToken} = await AuthService.refreshToken(refreshToken);

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 // 24 hour or 1 day
    })

    sendResponse(res, {
        success : true,
        statusCode : httpStatus.OK,
        message : "Token Refreshed Successfully",
        data : {
            accessToken
        }
    })
})

const getMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;
  const result = await AuthService.getMeFromDB(userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Current user profile fetched successfully",
    data: result,
  });
});

export const AuthController = {
  register,
  login,
  refreshToken,
  getMe,
};