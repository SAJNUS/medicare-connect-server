import express from 'express';
import { 
  createReview, 
  getAllReviews, 
  getReviewById, 
  updateReview,
  deleteReview
} from '../controllers/reviewController.js';
import { verifyToken, verifyAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public: any visitor can read all reviews (needed for doctor pages)
// Auth required only for writing
router.route('/')
  .post(verifyToken, createReview)
  .get(getAllReviews);

// Reading by ID is public; editing requires auth; deleting requires auth
router.route('/:id')
  .get(getReviewById)
  .patch(verifyToken, updateReview)
  .delete(verifyToken, deleteReview);

export default router;
