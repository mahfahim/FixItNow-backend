//src/modules/technician/technician.route.ts
import express from 'express';
import {auth} from '../../middlewares/auth'; 
import { Role } from '../../../generated/prisma/enums';
import { TechnicianController } from './technician.controller';

const router = express.Router();

router.get('/', TechnicianController.getAllTechnicians);
router.get('/:id', TechnicianController.getTechnicianById);

router.patch(
  '/profile',
  auth(Role.TECHNICIAN),
  TechnicianController.updateProfile
);

router.patch(
  '/availability',
  auth(Role.TECHNICIAN),
  TechnicianController.setAvailability
);

export const TechnicianRoutes = router;