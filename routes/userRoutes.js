import express from 'express';
import { 
  registerUser, 
  getUserByEmail, 
  updateUserRole, 
  getAllUsers 
} from '../controllers/userController.js';
import { verifyToken, verifyAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// POST /users is public — needed for registration flow
// GET /users (list all users) is admin-only
router.route('/')
  .post(registerUser)
  .get(verifyToken, verifyAdmin, getAllUsers);

// GET /users/:email requires auth (users can only see their own profile in practice)
router.route('/:email')
  .get(verifyToken, getUserByEmail);

// Changing a user's role is strictly admin-only
router.route('/:email/role')
  .patch(verifyToken, verifyAdmin, updateUserRole);

export default router;
