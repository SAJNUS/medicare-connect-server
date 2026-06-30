import express from 'express';
import { 
  createDoctor, 
  getAllDoctors, 
  getDoctorById, 
  updateVerificationStatus,
  updateDoctorProfile,
  getDoctorProfile
} from '../controllers/doctorController.js';
import { verifyToken, verifyAdmin, verifyDoctor } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public: browsing all doctors / finding a doctor is public
// Creating a new doctor profile is admin-only
router.route('/')
  .post(verifyToken, verifyAdmin, createDoctor)
  .get(getAllDoctors);

// Doctor updating their own profile
router.route('/profile/update')
  .patch(verifyToken, verifyDoctor, updateDoctorProfile);

// Doctor fetching their own profile
router.route('/profile/me')
  .get(verifyToken, verifyDoctor, getDoctorProfile);

// Public: viewing an individual doctor's profile is public
router.route('/:id')
  .get(getDoctorById);

// Verifying / approving a doctor is strictly admin-only
router.route('/:id/verification')
  .patch(verifyToken, verifyAdmin, updateVerificationStatus);

export default router;
