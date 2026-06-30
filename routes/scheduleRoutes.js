import express from 'express';
import { createSlot, getSlots, updateSlot, deleteSlot } from '../controllers/scheduleController.js';
import { verifyToken, verifyDoctor } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Reading schedules requires auth; writing is doctor-only
router.route('/')
  .post(verifyToken, verifyDoctor, createSlot)
  .get(verifyToken, getSlots);

router.route('/:id')
  .patch(verifyToken, verifyDoctor, updateSlot)
  .delete(verifyToken, verifyDoctor, deleteSlot);

export default router;
