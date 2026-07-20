//  src/modules/auth/auth.route.ts
import { Router } from 'express';
import { AuthController } from './auth.controller';
import {auth} from '../../middlewares/auth'; 
import { Role } from '../../../generated/prisma/enums';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

router.get(
  '/me', 
  auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN), 
  AuthController.getMe
);

export const AuthRoutes = router;