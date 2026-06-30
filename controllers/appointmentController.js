import { ObjectId } from 'mongodb';
import { appointmentsCollection } from '../utils/db.js';

// @desc    Create new appointment
// @route   POST /appointments
export const createAppointment = async (req, res) => {
  try {
    const appointmentData = req.body;
    
    // Auto-set default values for status and timestamp
    const newAppointment = {
      ...appointmentData,
      appointmentStatus: 'pending',
      paymentStatus: 'unpaid',
      createdAt: new Date().toISOString()
    };

    const result = await appointmentsCollection.insertOne(newAppointment);
    console.log(`[Appointments API] Created new appointment: ${result.insertedId}`);
    
    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: result
    });
  } catch (error) {
    console.error(`[Appointments API] Error creating appointment:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating appointment', 
      error: error.message 
    });
  }
};

// @desc    Get all appointments with filters
// @route   GET /appointments
export const getAllAppointments = async (req, res) => {
  try {
    const { patientEmail, doctorEmail, status } = req.query;
    
    let query = {};
    
    // Dynamic query building
    if (patientEmail) query.patientEmail = patientEmail;
    if (doctorEmail) query.doctorEmail = doctorEmail;
    if (status) query.appointmentStatus = status;

    // Fetch and sort by newest first
    const appointments = await appointmentsCollection.find(query).sort({ createdAt: -1 }).toArray();
    
    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error(`[Appointments API] Error fetching appointments:`, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
};

// @desc    Get single appointment by ID
// @route   GET /appointments/:id
export const getAppointmentById = async (req, res) => {
  try {
    const id = req.params.id;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID format' });
    }

    const appointment = await appointmentsCollection.findOne({ _id: new ObjectId(id) });
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    console.error(`[Appointments API] Error fetching appointment by ID:`, error);
    res.status(500).json({ success: false, message: 'Error fetching appointment', error: error.message });
  }
};

// @desc    Update appointment status
// @route   PATCH /appointments/:id/status
export const updateAppointmentStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID format' });
    }

    const allowedStatuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values are: ${allowedStatuses.join(', ')}`
      });
    }

    // Fetch current appointment to validate transition
    const existing = await appointmentsCollection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Enforce valid state transitions
    const validTransitions = {
      pending:   ['approved', 'rejected', 'cancelled'],
      approved:  ['completed', 'cancelled'],
      rejected:  [],   // terminal
      cancelled: [],   // terminal
      completed: []    // terminal
    };

    const allowed = validTransitions[existing.appointmentStatus] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${existing.appointmentStatus}' to '${status}'.`
      });
    }

    const result = await appointmentsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { appointmentStatus: status, updatedAt: new Date().toISOString() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    console.log(`[Appointments API] Updated status for appointment ${id} to ${status}`);
    res.status(200).json({ success: true, message: 'Appointment status updated successfully', data: result });
  } catch (error) {
    console.error(`[Appointments API] Error updating appointment status:`, error);
    res.status(500).json({ success: false, message: 'Error updating appointment status', error: error.message });
  }
};

// @desc    Reschedule appointment
// @route   PATCH /appointments/:id/reschedule
export const rescheduleAppointment = async (req, res) => {
  try {
    const id = req.params.id;
    const { date, time } = req.body;

    if (!date || !time) {
      return res.status(400).json({ success: false, message: 'Date and time are required to reschedule' });
    }

    const result = await appointmentsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { date, time, updatedAt: new Date().toISOString() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    console.log(`[Appointments API] Rescheduled appointment ${id} to ${date} at ${time}`);
    res.status(200).json({ success: true, message: 'Appointment rescheduled successfully', data: result });
  } catch (error) {
    console.error(`[Appointments API] Error rescheduling appointment:`, error);
    res.status(500).json({ success: false, message: 'Error rescheduling appointment', error: error.message });
  }
};

// @desc    Update appointment payment status
// @route   PATCH /appointments/:id/payment
export const updatePaymentStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { paymentStatus, transactionId } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID format' });
    }

    const allowedStatuses = ['unpaid', 'paid'];
    if (!allowedStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment status. Allowed values are: ${allowedStatuses.join(', ')}`
      });
    }

    const updateDoc = { $set: { paymentStatus } };
    if (transactionId) {
      updateDoc.$set.transactionId = transactionId;
    }

    const result = await appointmentsCollection.updateOne(
      { _id: new ObjectId(id) },
      updateDoc
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    console.log(`[Appointments API] Updated payment status for appointment ${id} to ${paymentStatus}`);
    res.status(200).json({ success: true, message: 'Payment status updated successfully', data: result });
  } catch (error) {
    console.error(`[Appointments API] Error updating payment status:`, error);
    res.status(500).json({ success: false, message: 'Error updating payment status', error: error.message });
  }
};

// @desc    Delete/Cancel an appointment
// @route   DELETE /appointments/:id
export const deleteAppointment = async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID format' });
    }

    const result = await appointmentsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    console.log(`[Appointments API] Deleted appointment: ${id}`);
    res.status(200).json({ success: true, message: 'Appointment deleted successfully', data: result });
  } catch (error) {
    console.error(`[Appointments API] Error deleting appointment:`, error);
    res.status(500).json({ success: false, message: 'Error deleting appointment', error: error.message });
  }
};
