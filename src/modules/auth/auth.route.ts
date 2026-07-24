// src/modules/auth/auth.route.ts
import { Router } from 'express';
import { AuthController } from './auth.controller';
import { auth } from '../../middlewares/auth'; 
import { validateRequest } from '../../middlewares/validateRequest';
import { AuthValidation } from './auth.validation';
import { Role } from '../../../generated/prisma/enums';

const router = Router();

router.post(
  '/register',
  validateRequest(AuthValidation.registerValidationSchema),
  AuthController.register
);

router.post(
  '/login',
  validateRequest(AuthValidation.loginValidationSchema),
  AuthController.login
);

router.post(
  '/refresh-token',
  validateRequest(AuthValidation.refreshTokenValidationSchema),
  AuthController.refreshToken
);

router.get(
  '/me',
  auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN),
  AuthController.getMyProfile
);

router.patch(
  '/me',
  auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN),
  validateRequest(AuthValidation.updateMyProfileValidationSchema),
  AuthController.updateMyProfile
);

router.post(
  '/address',
  auth(Role.TECHNICIAN),
  validateRequest(AuthValidation.addAddressValidationSchema),
  AuthController.addAddress
);

export const AuthRoutes = router;