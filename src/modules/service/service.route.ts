import express from 'express';
import { Role } from '../../../generated/prisma/enums';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { ServiceController } from './service.controller';
import { ServiceValidation } from './service.validation';

const router = express.Router();

router.get('/', ServiceController.getAllServices);
router.get('/:id', ServiceController.getServiceById);

router.post(
  '/',
  auth(Role.TECHNICIAN, Role.ADMIN),
  validateRequest(ServiceValidation.createServiceValidationSchema),
  ServiceController.createService
);

router.patch(
  '/:id',
  auth(Role.TECHNICIAN, Role.ADMIN),
  validateRequest(ServiceValidation.updateServiceValidationSchema),
  ServiceController.updateService
);

router.delete(
  '/:id',
  auth(Role.TECHNICIAN, Role.ADMIN),
  ServiceController.deleteService
);

export const ServiceRoutes = router;