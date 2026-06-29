import { ObjectId } from 'mongodb';
import { doctorsCollection } from '../utils/db.js';

// @desc    Create doctor profile
// @route   POST /doctors
export const createDoctor = async (req, res) => {
  try {
    const doctorData = req.body;
    
    // Auto-set verificationStatus and createdAt timestamp
    const newDoctor = {
      ...doctorData,
      verificationStatus: 'pending',
      createdAt: new Date().toISOString()
    };

    const result = await doctorsCollection.insertOne(newDoctor);
    console.log(`[Doctors API] Successfully created doctor profile: ${result.insertedId}`);
    
    res.status(201).json({
      success: true,
      message: 'Doctor profile created successfully',
      data: result
    });
  } catch (error) {
    console.error(`[Doctors API] Error creating doctor:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating doctor profile', 
      error: error.message 
    });
  }
};

// @desc    Get all doctors with filtering and sorting
// @route   GET /doctors
export const getAllDoctors = async (req, res) => {
  try {
    const { search, specialization, sortBy } = req.query;
    
    let query = {};
    
    // Name search regex
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    // Exact match for specialization
    if (specialization) {
      query.specialization = specialization;
    }

    // Determine sorting options
    let sortOptions = {};
    if (sortBy === 'fee') {
      sortOptions.consultationFee = 1; // Lowest fee first
    } else if (sortBy === 'experience') {
      sortOptions.experience = -1; // Highest experience first
    } else if (sortBy === 'rating') {
      sortOptions.rating = -1; // Highest rating first
    }

    const doctors = await doctorsCollection.find(query).sort(sortOptions).toArray();
    
    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    console.error(`[Doctors API] Error fetching doctors:`, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctors',
      error: error.message
    });
  }
};

// @desc    Get single doctor by ID
// @route   GET /doctors/:id
export const getDoctorById = async (req, res) => {
  try {
    const id = req.params.id;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID format'
      });
    }

    const doctor = await doctorsCollection.findOne({ _id: new ObjectId(id) });
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error(`[Doctors API] Error fetching doctor by ID:`, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor',
      error: error.message
    });
  }
};

// @desc    Update doctor verification status
// @route   PATCH /doctors/:id/verification
export const updateVerificationStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID format'
      });
    }

    // Validate allowed status values
    const allowedStatuses = ['pending', 'verified', 'rejected'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values are: ${allowedStatuses.join(', ')}`
      });
    }

    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: { verificationStatus: status }
    };

    const result = await doctorsCollection.updateOne(filter, updateDoc);

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    console.log(`[Doctors API] Updated verification status for doctor ${id} to ${status}`);
    
    res.status(200).json({
      success: true,
      message: 'Verification status updated successfully',
      data: result
    });
  } catch (error) {
    console.error(`[Doctors API] Error updating verification status:`, error);
    res.status(500).json({
      success: false,
      message: 'Error updating verification status',
      error: error.message
    });
  }
};
