import express from 'express';
import { 
  createAppointment, 
  getAllAppointments, 
  getAppointmentById, 
  updateAppointmentStatus,
  updatePaymentStatus,
  deleteAppointment,
  rescheduleAppointment
} from '../controllers/appointmentController.js';
import { verifyToken, verifyDoctorOrAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All appointment routes require a valid JWT
router.route('/')
  .post(verifyToken, createAppointment)
  .get(verifyToken, getAllAppointments);

router.route('/:id')
  .get(verifyToken, getAppointmentById)
  .delete(verifyToken, deleteAppointment);

// Any user can change status, but controller enforces roles (patients can only cancel)
router.route('/:id/status')
  .patch(verifyToken, updateAppointmentStatus);

router.route('/:id/reschedule')
  .patch(verifyToken, rescheduleAppointment);

// Payment status update requires auth (triggered after Stripe confirms)
router.route('/:id/payment')
  .patch(verifyToken, updatePaymentStatus);

export default router;
