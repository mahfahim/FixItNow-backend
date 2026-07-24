//src/modules/category/category.route.ts
import express from 'express';
import { Role } from '../../../generated/prisma/enums';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { CategoryController } from './category.controller';
import { CategoryValidation } from './category.validation';

const router = express.Router();

router.get('/', CategoryController.getAllCategories);
router.get('/:id', CategoryController.getCategoryById);

// Admin-only operations
router.post(
  '/',
  auth(Role.ADMIN),
  validateRequest(CategoryValidation.createCategoryValidationSchema),
  CategoryController.createCategory
);

router.patch(
  '/:id',
  auth(Role.ADMIN),
  validateRequest(CategoryValidation.updateCategoryValidationSchema),
  CategoryController.updateCategory
);

router.delete(
  '/:id',
  auth(Role.ADMIN),
  CategoryController.deleteCategory
);

export const CategoryRoutes = router;