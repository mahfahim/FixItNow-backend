// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";
import { JwtPayload, SignOptions } from "jsonwebtoken";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { jwtUtils } from "../../utils/jwt";
import { ILoginUser, IRegisterUser } from "./auth.interface";
import { ICreateAddress, IUpdateUserProfile } from './auth.interface';


const registerUserIntoDB = async (payload: IRegisterUser) => {
    const { name, email, role, password } = payload;
  
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
        throw new Error("User with this email already exists");
    }

  
    const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds)
    );

    
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
        },
      });

    
      if (newUser.role === "TECHNICIAN") {
        await tx.technicianProfile.create({
          data: {
            userId: newUser.id,
            hourlyRate: 0, 
          },
        });
      }

      return newUser;
    });

    
    const { password: _, ...userWithoutPassword } = result;
    return userWithoutPassword;

  
};


const loginUser = async (payload: ILoginUser) => {
    const { email, password } = payload;

    
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            technicianProfile: true,
        },
    });

    if (!user) {
        throw new Error("User does not exist");
    }

    if (user.isDeleted) {
        throw new Error("This account has been deleted.");
    }

    if (user.status === "BLOCKED") {
        throw new Error("Your account has been blocked. Please contact support.");
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);
    
    if (!isPasswordMatched) {
        throw new Error("Password is incorrect");
    }

    
    const jwtPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        technicianProfileId: user.technicianProfile?.id || null,
    };

    const accessToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.jwt_access_expires_in as SignOptions
    );

    const refreshToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_refresh_secret as string,
        config.jwt_refresh_expires_in as SignOptions
    );

    return {
        accessToken,
        refreshToken,
    };
};


const refreshToken = async (refreshToken : string) => {
    const verifiedRefreshToken = jwtUtils.verifyToken(refreshToken, config.jwt_refresh_secret as string);

    if(!verifiedRefreshToken.success){
        throw new Error(verifiedRefreshToken.error)
    }

    const { id } = verifiedRefreshToken.data as JwtPayload;

    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            technicianProfile: true,
        },
    });

    if (!user) {
        throw new Error("User not found!");
    }

    if(user.status === "BLOCKED"){
        throw new Error("User is blocked!")
    }

    const jwtPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        technicianProfileId: user.technicianProfile?.id || null,
    };

    const accessToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.jwt_access_expires_in as SignOptions
    );

    return { accessToken }
}


const getMyProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      technicianProfile: true,
      addresses: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};


const updateMyProfile = async (
  userId: string,
  payload: IUpdateUserProfile
) => {
  const { name } = payload;

  const result = await prisma.user.update({
    where: { id: userId },
    data: {
      name,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });

  return result;
};

const addAddress = async (userId: string, payload: ICreateAddress) => {
  const address = await prisma.address.create({
    data: {
      ...payload,
      userId,
    },
  });

  return address;
};


export const AuthService = {
  registerUserIntoDB,
  loginUser,
  refreshToken,
  getMyProfile,
  updateMyProfile,
  addAddress,
};