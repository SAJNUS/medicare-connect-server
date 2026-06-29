import express from 'express';
import { 
  createReview, 
  getAllReviews, 
  getReviewById, 
  updateReview,
  deleteReview
} from '../controllers/reviewController.js';

const router = express.Router();

router.route('/')
  .post(createReview)
  .get(getAllReviews);

router.route('/:id')
  .get(getReviewById)
  .patch(updateReview)
  .delete(deleteReview);

export default router;
