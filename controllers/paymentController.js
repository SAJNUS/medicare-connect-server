import { ObjectId } from 'mongodb';
import { paymentsCollection } from '../utils/db.js';

// @desc    Create new payment record
// @route   POST /payments
export const createPayment = async (req, res) => {
  try {
    const paymentData = req.body;
    
    if (!paymentData.appointmentId) {
      return res.status(400).json({ success: false, message: 'appointmentId is required' });
    }

    // Check for duplicate payment
    const existingPayment = await paymentsCollection.findOne({ appointmentId: paymentData.appointmentId });
    if (existingPayment) {
      return res.status(409).json({ success: false, message: 'Payment for this appointment already exists' });
    }

    // Generate Sequential Transaction ID
    const count = await paymentsCollection.countDocuments();
    const displayTransactionId = `TXN-2026-${(count + 1).toString().padStart(4, '0')}`;

    // Generate Friendly Transaction ID (legacy)
    const getFriendlyId = (idStr) => {
      let hash = 0;
      for (let i = 0; i < idStr.length; i++) {
        hash = (hash << 5) - hash + idStr.charCodeAt(i);
        hash |= 0;
      }
      const num = Math.abs(hash) % 10000;
      return `TXN-2026-${num.toString().padStart(4, '0')}`;
    };

    const friendlyTxnId = getFriendlyId(paymentData.transactionId || new Date().getTime().toString());

    // Auto-set paymentDate
    const newPayment = {
      ...paymentData,
      friendlyTxnId,
      displayTransactionId,
      paymentDate: new Date().toISOString()
    };

    const result = await paymentsCollection.insertOne(newPayment);
    console.log(`[Payments API] Created new payment: ${result.insertedId}`);
    
    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: result
    });
  } catch (error) {
    console.error(`[Payments API] Error creating payment:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating payment', 
      error: error.message 
    });
  }
};

// @desc    Get all payments with filters
// @route   GET /payments
export const getAllPayments = async (req, res) => {
  try {
    const { patientEmail, doctorEmail, appointmentId } = req.query;
    
    let query = {};
    
    if (patientEmail) query.patientEmail = patientEmail;
    if (doctorEmail) query.doctorEmail = doctorEmail;
    if (appointmentId) query.appointmentId = appointmentId;

    const payments = await paymentsCollection.find(query).sort({ paymentDate: -1 }).toArray();
    
    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error(`[Payments API] Error fetching payments:`, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message
    });
  }
};

// @desc    Get single payment by ID
// @route   GET /payments/:id
export const getPaymentById = async (req, res) => {
  try {
    const id = req.params.id;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid payment ID format' });
    }

    const payment = await paymentsCollection.findOne({ _id: new ObjectId(id) });
    
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    console.error(`[Payments API] Error fetching payment by ID:`, error);
    res.status(500).json({ success: false, message: 'Error fetching payment', error: error.message });
  }
};

// @desc    Update payment status
// @route   PATCH /payments/:id/status
export const updatePaymentStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid payment ID format' });
    }

    const allowedStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values are: ${allowedStatuses.join(', ')}`
      });
    }

    const result = await paymentsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    console.log(`[Payments API] Updated status for payment ${id} to ${status}`);
    res.status(200).json({ success: true, message: 'Payment status updated successfully', data: result });
  } catch (error) {
    console.error(`[Payments API] Error updating payment status:`, error);
    res.status(500).json({ success: false, message: 'Error updating status', error: error.message });
  }
};

// @desc    Delete/Remove a payment record
// @route   DELETE /payments/:id
export const deletePayment = async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid payment ID format' });
    }

    const result = await paymentsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    console.log(`[Payments API] Deleted payment: ${id}`);
    res.status(200).json({ success: true, message: 'Payment deleted successfully', data: result });
  } catch (error) {
    console.error(`[Payments API] Error deleting payment:`, error);
    res.status(500).json({ success: false, message: 'Error deleting payment', error: error.message });
  }
};
