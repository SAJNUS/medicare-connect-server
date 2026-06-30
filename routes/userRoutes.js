import express from 'express';
import { 
  registerUser, 
  getUserByEmail, 
  updateUserRole, 
  getAllUsers,
  updateUserName,
  updateUserStatus,
  deleteUser
} from '../controllers/userController.js';
import { verifyToken, verifyAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// POST /users is public — needed for registration flow
// GET /users (list all users) is admin-only
router.route('/')
  .post(registerUser)
  .get(verifyToken, verifyAdmin, getAllUsers);

// GET /users/:email (public because it's required during the Google Login flow before JWT is issued)
router.route('/:email')
  .get(getUserByEmail);

// Changing a user's role is strictly admin-only
router.route('/:email/role')
  .patch(verifyToken, verifyAdmin, updateUserRole);

// Updating a user's name (authenticated user)
router.route('/:email/name')
  .patch(verifyToken, updateUserName);

// Suspend or unsuspend user (admin only)
router.route('/:email/status')
  .patch(verifyToken, verifyAdmin, updateUserStatus);

// Delete user (admin only)
router.route('/:email')
  .delete(verifyToken, verifyAdmin, deleteUser);

export default router;
