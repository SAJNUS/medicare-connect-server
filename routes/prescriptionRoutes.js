import express from 'express';
import { 
  createPrescription, 
  getAllPrescriptions, 
  getPrescriptionById, 
  updatePrescription,
  deletePrescription
} from '../controllers/prescriptionController.js';
import { verifyToken, verifyDoctor, verifyAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Reading prescriptions requires auth; creating is doctor-only
router.route('/')
  .post(verifyToken, verifyDoctor, createPrescription)
  .get(verifyToken, getAllPrescriptions);

// Reading by ID is auth-gated; editing is doctor-only; deleting is admin-only
router.route('/:id')
  .get(verifyToken, getPrescriptionById)
  .patch(verifyToken, verifyDoctor, updatePrescription)
  .delete(verifyToken, verifyAdmin, deletePrescription);

export default router;
