import express from 'express';
import { 
  createPayment, 
  getAllPayments, 
  getPaymentById, 
  updatePaymentStatus,
  deletePayment
} from '../controllers/paymentController.js';
import { verifyToken, verifyAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Creating and reading payments requires authentication
router.route('/')
  .post(verifyToken, createPayment)
  .get(verifyToken, getAllPayments);

// Reading a single payment requires auth; deletion is admin-only
router.route('/:id')
  .get(verifyToken, getPaymentById)
  .delete(verifyToken, verifyAdmin, deletePayment);

// Updating payment status is admin-only
router.route('/:id/status')
  .patch(verifyToken, verifyAdmin, updatePaymentStatus);

export default router;
