import express from 'express';
import { getDashboardStats, getAllDoctorsAdmin, updateDoctorVerification } from '../controllers/adminController.js';
import { verifyToken, verifyAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Admin Dashboard stats (Admin only)
router.route('/stats')
  .get(verifyToken, verifyAdmin, getDashboardStats);

// Admin Manage Doctors list
router.route('/doctors')
  .get(verifyToken, verifyAdmin, getAllDoctorsAdmin);

// Admin Update Doctor Verification Status
router.route('/doctors/:email/verification')
  .patch(verifyToken, verifyAdmin, updateDoctorVerification);

export default router;
