import express from 'express';
import CategoryController from '../controllers/CategoryController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// --- PUBLIC ROUTES ---
router.get('/', CategoryController.getAllCategories);           // GET /api/categories work
router.get('/:category_id', CategoryController.getCategory);    // GET /api/categories/:category_id work
router.get('/:category_id/posts', CategoryController.getPostsByCategory); // GET /api/categories/:category_id/posts

// --- PROTECTED ---
router.post('/', authMiddleware, CategoryController.createCategory);      // POST /api/categories work
router.patch('/:category_id', authMiddleware, CategoryController.updateCategory); // PATCH /api/categories/:category_id work
router.delete('/:category_id', authMiddleware, CategoryController.deleteCategory); // DELETE /api/categories/:category_id work

export default router;