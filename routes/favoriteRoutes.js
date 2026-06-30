import express from 'express';
import { 
  addFavorite, 
  removeFavorite, 
  getFavorites 
} from '../controllers/favoriteController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Require auth for all favorite routes
router.use(verifyToken);

router.route('/')
  .post(addFavorite)
  .get(getFavorites);

router.route('/:doctorId')
  .delete(removeFavorite);

export default router;
