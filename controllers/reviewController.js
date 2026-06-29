import { ObjectId } from 'mongodb';
import { reviewsCollection } from '../utils/db.js';

// @desc    Create new review
// @route   POST /reviews
export const createReview = async (req, res) => {
  try {
    const reviewData = req.body;
    
    // Auto-set creation timestamp
    const newReview = {
      ...reviewData,
      createdAt: new Date().toISOString()
    };

    const result = await reviewsCollection.insertOne(newReview);
    console.log(`[Reviews API] Created new review: ${result.insertedId}`);
    
    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: result
    });
  } catch (error) {
    console.error(`[Reviews API] Error creating review:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating review', 
      error: error.message 
    });
  }
};

// @desc    Get all reviews with filters
// @route   GET /reviews
export const getAllReviews = async (req, res) => {
  try {
    const { patientEmail, doctorEmail, rating } = req.query;
    
    let query = {};
    
    // Dynamic query building
    if (patientEmail) query.patientEmail = patientEmail;
    if (doctorEmail) query.doctorEmail = doctorEmail;
    
    // Convert rating to number if provided
    if (rating) {
      query.rating = Number(rating);
    }

    // Sort by newest first natively
    const reviews = await reviewsCollection.find(query).sort({ createdAt: -1 }).toArray();
    
    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error(`[Reviews API] Error fetching reviews:`, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// @desc    Get single review by ID
// @route   GET /reviews/:id
export const getReviewById = async (req, res) => {
  try {
    const id = req.params.id;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid review ID format' });
    }

    const review = await reviewsCollection.findOne({ _id: new ObjectId(id) });
    
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    console.error(`[Reviews API] Error fetching review by ID:`, error);
    res.status(500).json({ success: false, message: 'Error fetching review', error: error.message });
  }
};

// @desc    Update review (rating and/or reviewText)
// @route   PATCH /reviews/:id
export const updateReview = async (req, res) => {
  try {
    const id = req.params.id;
    const { rating, reviewText } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid review ID format' });
    }

    // Build update document based only on provided fields
    const updateFields = {};
    if (rating !== undefined) updateFields.rating = rating;
    if (reviewText !== undefined) updateFields.reviewText = reviewText;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields provided to update' });
    }

    const result = await reviewsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    console.log(`[Reviews API] Updated review ${id}`);
    res.status(200).json({ success: true, message: 'Review updated successfully', data: result });
  } catch (error) {
    console.error(`[Reviews API] Error updating review:`, error);
    res.status(500).json({ success: false, message: 'Error updating review', error: error.message });
  }
};

// @desc    Delete/Remove a review
// @route   DELETE /reviews/:id
export const deleteReview = async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid review ID format' });
    }

    const result = await reviewsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    console.log(`[Reviews API] Deleted review: ${id}`);
    res.status(200).json({ success: true, message: 'Review deleted successfully', data: result });
  } catch (error) {
    console.error(`[Reviews API] Error deleting review:`, error);
    res.status(500).json({ success: false, message: 'Error deleting review', error: error.message });
  }
};
