import express from 'express';
import { 
  createDoctor, 
  getAllDoctors, 
  getDoctorById, 
  updateVerificationStatus 
} from '../controllers/doctorController.js';

const router = express.Router();

router.route('/')
  .post(createDoctor)
  .get(getAllDoctors);

router.route('/:id')
  .get(getDoctorById);

router.route('/:id/verification')
  .patch(updateVerificationStatus);

export default router;
