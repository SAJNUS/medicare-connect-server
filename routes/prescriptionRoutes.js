import express from 'express';
import { 
  createPrescription, 
  getAllPrescriptions, 
  getPrescriptionById, 
  updatePrescription,
  deletePrescription
} from '../controllers/prescriptionController.js';

const router = express.Router();

router.route('/')
  .post(createPrescription)
  .get(getAllPrescriptions);

router.route('/:id')
  .get(getPrescriptionById)
  .patch(updatePrescription)
  .delete(deletePrescription);

export default router;
