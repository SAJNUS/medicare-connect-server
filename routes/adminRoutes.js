import express from 'express';
import { getDashboardStats } from '../controllers/adminController.js';
import { verifyToken, verifyAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Admin Dashboard stats (Admin only)
router.route('/stats')
  .get(verifyToken, verifyAdmin, getDashboardStats);

export default router;
