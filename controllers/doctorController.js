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

// @desc    Get all doctors with filtering, sorting, and pagination
// @route   GET /doctors
export const getAllDoctors = async (req, res) => {
  try {
    const { search, specialization, sortBy, page, limit } = req.query;
    
    let query = {};
    
    // Combined name OR specialization search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Exact match for specialization filter (separate from search)
    if (specialization && specialization !== 'All') {
      query.specialization = { $regex: `^${specialization}$`, $options: 'i' };
    }

    // Determine sorting options
    let sortOptions = { createdAt: -1 }; // default: newest first
    if (sortBy === 'fee') {
      sortOptions = { consultationFee: 1 };
    } else if (sortBy === 'experience') {
      sortOptions = { experience: -1 };
    } else if (sortBy === 'rating') {
      sortOptions = { rating: -1 };
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await doctorsCollection.countDocuments(query);
    const doctors = await doctorsCollection.find(query).sort(sortOptions).skip(skip).limit(limitNum).toArray();
    
    res.status(200).json({
      success: true,
      count: doctors.length,
      total: totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
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

// @desc    Update doctor verification status (admin-only)
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

    // 'removed' handles the "Verification Removed" workflow
    const allowedStatuses = ['pending', 'verified', 'rejected', 'removed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values are: ${allowedStatuses.join(', ')}`
      });
    }

    // Fetch existing doctor to validate transition
    const existing = await doctorsCollection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Valid state machine transitions
    const validTransitions = {
      pending:  ['verified', 'rejected'],
      verified: ['rejected', 'removed'],
      rejected: ['pending', 'verified'],  // allow re-review
      removed:  ['pending', 'verified']   // allow reinstatement
    };

    const allowed = validTransitions[existing.verificationStatus] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${existing.verificationStatus}' to '${status}'.`
      });
    }

    const updateDoc = {
      $set: {
        verificationStatus: status,
        verifiedBy: req.user?.email || 'admin',
        updatedAt: new Date().toISOString()
      }
    };

    const result = await doctorsCollection.updateOne({ _id: new ObjectId(id) }, updateDoc);

    console.log(`[Doctors API] Admin ${req.user?.email} changed doctor ${id} status: ${existing.verificationStatus} → ${status}`);
    
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

// @desc    Update doctor profile (logged in doctor updates their own profile)
// @route   PATCH /doctors/profile/update
export const updateDoctorProfile = async (req, res) => {
  try {
    const email = req.user.email;
    const updateData = req.body;
    
    // UPSERT operation based on email
    const filter = { email: email };
    const updateDoc = {
      $set: {
        ...updateData,
        email: email, // ensure email is set if inserting
        updatedAt: new Date().toISOString()
      }
    };
    
    const result = await doctorsCollection.updateOne(filter, updateDoc, { upsert: true });
    console.log(`[Doctors API] Doctor ${email} updated their profile`);
    
    res.status(200).json({
      success: true,
      message: 'Doctor profile updated successfully',
      data: result
    });
  } catch (error) {
    console.error(`[Doctors API] Error updating doctor profile:`, error);
    res.status(500).json({
      success: false,
      message: 'Error updating doctor profile',
      error: error.message
    });
  }
};

// @desc    Get logged in doctor profile
// @route   GET /doctors/profile/me
export const getDoctorProfile = async (req, res) => {
  try {
    const email = req.user.email;
    const doctor = await doctorsCollection.findOne({ email });
    
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    console.error(`[Doctors API] Error fetching doctor profile:`, error);
    res.status(500).json({ success: false, message: 'Error fetching profile', error: error.message });
  }
};
