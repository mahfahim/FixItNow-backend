import express from 'express';
import { Role } from '../../../generated/prisma/enums';
import { auth } from '../../middlewares/auth';
import { ServiceController } from './service.controller';

const router = express.Router();

router.get('/', ServiceController.getAllServices);
router.get('/:id', ServiceController.getServiceById);

router.post(
  '/',
  auth(Role.TECHNICIAN, Role.ADMIN),
  ServiceController.createService
);
router.patch(
  '/:id',
  auth(Role.TECHNICIAN, Role.ADMIN),
  ServiceController.updateService
);
router.delete(
  '/:id',
  auth(Role.TECHNICIAN, Role.ADMIN),
  ServiceController.deleteService
);

export const ServiceRoutes = router;