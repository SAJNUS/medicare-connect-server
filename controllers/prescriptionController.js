import { ObjectId } from 'mongodb';
import { prescriptionsCollection } from '../utils/db.js';

// @desc    Create new prescription
// @route   POST /prescriptions
export const createPrescription = async (req, res) => {
  try {
    const prescriptionData = req.body;
    
    // Auto-set creation timestamp
    const newPrescription = {
      ...prescriptionData,
      createdAt: new Date().toISOString()
    };

    const result = await prescriptionsCollection.insertOne(newPrescription);
    console.log(`[Prescriptions API] Created new prescription: ${result.insertedId}`);
    
    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: result
    });
  } catch (error) {
    console.error(`[Prescriptions API] Error creating prescription:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating prescription', 
      error: error.message 
    });
  }
};

// @desc    Get all prescriptions with filters
// @route   GET /prescriptions
export const getAllPrescriptions = async (req, res) => {
  try {
    const { patientEmail, doctorEmail, appointmentId } = req.query;
    
    let query = {};
    
    // Dynamic query building
    if (patientEmail) query.patientEmail = patientEmail;
    if (doctorEmail) query.doctorEmail = doctorEmail;
    if (appointmentId) query.appointmentId = appointmentId;

    // Sort by newest first natively
    const prescriptions = await prescriptionsCollection.find(query).sort({ createdAt: -1 }).toArray();
    
    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions
    });
  } catch (error) {
    console.error(`[Prescriptions API] Error fetching prescriptions:`, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching prescriptions',
      error: error.message
    });
  }
};

// @desc    Get single prescription by ID
// @route   GET /prescriptions/:id
export const getPrescriptionById = async (req, res) => {
  try {
    const id = req.params.id;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid prescription ID format' });
    }

    const prescription = await prescriptionsCollection.findOne({ _id: new ObjectId(id) });
    
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    res.status(200).json({ success: true, data: prescription });
  } catch (error) {
    console.error(`[Prescriptions API] Error fetching prescription by ID:`, error);
    res.status(500).json({ success: false, message: 'Error fetching prescription', error: error.message });
  }
};

// @desc    Update prescription (diagnosis, medications, notes)
// @route   PATCH /prescriptions/:id
export const updatePrescription = async (req, res) => {
  try {
    const id = req.params.id;
    const { diagnosis, medications, notes } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid prescription ID format' });
    }

    // Build update document based only on provided fields
    const updateFields = {};
    if (diagnosis !== undefined) updateFields.diagnosis = diagnosis;
    if (medications !== undefined) updateFields.medications = medications;
    if (notes !== undefined) updateFields.notes = notes;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields provided to update' });
    }

    const result = await prescriptionsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    console.log(`[Prescriptions API] Updated prescription ${id}`);
    res.status(200).json({ success: true, message: 'Prescription updated successfully', data: result });
  } catch (error) {
    console.error(`[Prescriptions API] Error updating prescription:`, error);
    res.status(500).json({ success: false, message: 'Error updating prescription', error: error.message });
  }
};

// @desc    Delete/Remove a prescription
// @route   DELETE /prescriptions/:id
export const deletePrescription = async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid prescription ID format' });
    }

    const result = await prescriptionsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    console.log(`[Prescriptions API] Deleted prescription: ${id}`);
    res.status(200).json({ success: true, message: 'Prescription deleted successfully', data: result });
  } catch (error) {
    console.error(`[Prescriptions API] Error deleting prescription:`, error);
    res.status(500).json({ success: false, message: 'Error deleting prescription', error: error.message });
  }
};
