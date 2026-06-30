import { favoritesCollection, doctorsCollection } from '../utils/db.js';

// @desc    Add a doctor to favorites
// @route   POST /favorites
export const addFavorite = async (req, res) => {
  try {
    const { patientEmail, doctorId } = req.body;

    if (!patientEmail || !doctorId) {
      return res.status(400).json({ success: false, message: 'Patient email and doctorId are required' });
    }

    // Check if already favorited
    const existing = await favoritesCollection.findOne({ patientEmail, doctorId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Doctor is already favorited' });
    }

    const newFavorite = {
      patientEmail,
      doctorId,
      createdAt: new Date().toISOString()
    };

    const result = await favoritesCollection.insertOne(newFavorite);
    
    res.status(201).json({
      success: true,
      message: 'Doctor added to favorites',
      data: result
    });
  } catch (error) {
    console.error(`[Favorites API] Error adding favorite:`, error);
    res.status(500).json({ success: false, message: 'Error adding favorite', error: error.message });
  }
};

// @desc    Remove a doctor from favorites
// @route   DELETE /favorites/:doctorId
export const removeFavorite = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const { patientEmail } = req.query; // Usually passed in query for DELETE

    if (!patientEmail || !doctorId) {
      return res.status(400).json({ success: false, message: 'Patient email and doctorId are required' });
    }

    const result = await favoritesCollection.deleteOne({ patientEmail, doctorId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Favorite not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Doctor removed from favorites'
    });
  } catch (error) {
    console.error(`[Favorites API] Error removing favorite:`, error);
    res.status(500).json({ success: false, message: 'Error removing favorite', error: error.message });
  }
};

// @desc    Get all favorites for a patient
// @route   GET /favorites
export const getFavorites = async (req, res) => {
  try {
    const { patientEmail } = req.query;

    if (!patientEmail) {
      return res.status(400).json({ success: false, message: 'Patient email is required' });
    }

    // Pipeline to fetch favorites and join with doctors collection
    const pipeline = [
      { $match: { patientEmail } },
      { 
        $addFields: { 
          doctorObjId: { 
            $convert: { 
              input: "$doctorId", 
              to: "objectId", 
              onError: null, 
              onNull: null 
            } 
          } 
        } 
      },
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctorObjId',
          foreignField: '_id',
          as: 'doctorDetails'
        }
      },
      { $unwind: { path: "$doctorDetails", preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } }
    ];

    const favorites = await favoritesCollection.aggregate(pipeline).toArray();
    
    res.status(200).json({
      success: true,
      count: favorites.length,
      data: favorites
    });
  } catch (error) {
    console.error(`[Favorites API] Error fetching favorites:`, error);
    res.status(500).json({ success: false, message: 'Error fetching favorites', error: error.message });
  }
};
