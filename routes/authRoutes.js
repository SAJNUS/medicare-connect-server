import express from 'express';
import { generateToken, logoutUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/jwt', generateToken);
router.post('/logout', logoutUser);

export default router;
