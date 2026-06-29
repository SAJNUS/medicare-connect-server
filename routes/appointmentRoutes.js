import express from 'express';
import { 
  createAppointment, 
  getAllAppointments, 
  getAppointmentById, 
  updateAppointmentStatus,
  updatePaymentStatus,
  deleteAppointment
} from '../controllers/appointmentController.js';

const router = express.Router();

router.route('/')
  .post(createAppointment)
  .get(getAllAppointments);

router.route('/:id')
  .get(getAppointmentById)
  .delete(deleteAppointment);

router.route('/:id/status')
  .patch(updateAppointmentStatus);

router.route('/:id/payment')
  .patch(updatePaymentStatus);

export default router;
