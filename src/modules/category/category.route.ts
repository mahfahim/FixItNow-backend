//src/modules/category/category.route.ts
import express from 'express';
import { auth } from '../../middlewares/auth'; 
import { Role } from '../../../generated/prisma/enums';
import { CategoryController } from './category.controller';

const router = express.Router();

router.get('/', CategoryController.getAllCategories);
router.get('/:id', CategoryController.getCategoryById);

// Admin-only operations
router.post('/', auth(Role.ADMIN), CategoryController.createCategory);
router.patch('/:id', auth(Role.ADMIN), CategoryController.updateCategory);
router.delete('/:id', auth(Role.ADMIN), CategoryController.deleteCategory);

export const CategoryRoutes = router;