import express from 'express';
import { 
  registerUser, 
  getUserByEmail, 
  updateUserRole, 
  getAllUsers 
} from '../controllers/userController.js';

const router = express.Router();

router.route('/')
  .post(registerUser)
  .get(getAllUsers);

router.route('/:email')
  .get(getUserByEmail);

router.route('/:email/role')
  .patch(updateUserRole);

export default router;
