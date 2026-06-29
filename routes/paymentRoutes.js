import express from 'express';
import { 
  createPayment, 
  getAllPayments, 
  getPaymentById, 
  updatePaymentStatus,
  deletePayment
} from '../controllers/paymentController.js';

const router = express.Router();

router.route('/')
  .post(createPayment)
  .get(getAllPayments);

router.route('/:id')
  .get(getPaymentById)
  .delete(deletePayment);

router.route('/:id/status')
  .patch(updatePaymentStatus);

export default router;
