import express from 'express';
import { generateToken, logoutUser } from '../controllers/authController.js';
import { verifyToken, verifyAdmin, verifyDoctor, verifyPatient } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/jwt', generateToken);
router.post('/logout', logoutUser);

// Protected Test Routes
router.get('/admin-test', verifyToken, verifyAdmin, (req, res) => {
  res.status(200).json({ success: true, message: 'Admin access granted' });
});

router.get('/doctor-test', verifyToken, verifyDoctor, (req, res) => {
  res.status(200).json({ success: true, message: 'Doctor access granted' });
});

router.get('/patient-test', verifyToken, verifyPatient, (req, res) => {
  res.status(200).json({ success: true, message: 'Patient access granted' });
});

export default router;
