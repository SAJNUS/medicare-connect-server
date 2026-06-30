import { ObjectId } from 'mongodb';
import { schedulesCollection } from '../utils/db.js';

// @desc    Add a schedule slot for a doctor
// @route   POST /schedules
export const createSlot = async (req, res) => {
  try {
    const { doctorEmail, date, startTime, endTime, type } = req.body;

    if (!doctorEmail || !date || !startTime || !endTime || !type) {
      return res.status(400).json({ success: false, message: 'All fields (doctorEmail, date, startTime, endTime, type) are required.' });
    }

    // Validate that startTime < endTime
    if (startTime >= endTime) {
      return res.status(400).json({ success: false, message: 'startTime must be before endTime.' });
    }

    // Prevent duplicate slot: same doctor, date, startTime, type
    const duplicate = await schedulesCollection.findOne({ doctorEmail, date, startTime, type });
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'A slot with this date, time, and type already exists.' });
    }

    // Check for time overlap on the same doctor+date
    const overlapping = await schedulesCollection.findOne({
      doctorEmail,
      date,
      $or: [
        // New slot starts during an existing slot
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    });
    if (overlapping) {
      return res.status(409).json({ success: false, message: `This slot overlaps with an existing slot (${overlapping.startTime}–${overlapping.endTime}).` });
    }

    const newSlot = {
      doctorEmail,
      date,
      startTime,
      endTime,
      type,
      status: 'available',
      createdAt: new Date().toISOString()
    };

    const result = await schedulesCollection.insertOne(newSlot);
    console.log(`[Schedules API] Doctor ${doctorEmail} added slot: ${date} ${startTime}-${endTime}`);

    res.status(201).json({ success: true, message: 'Slot created successfully', data: result });
  } catch (error) {
    console.error('[Schedules API] Error creating slot:', error);
    res.status(500).json({ success: false, message: 'Error creating slot', error: error.message });
  }
};

// @desc    Get all slots for a doctor
// @route   GET /schedules?doctorEmail=
export const getSlots = async (req, res) => {
  try {
    const { doctorEmail, date, status } = req.query;

    if (!doctorEmail) {
      return res.status(400).json({ success: false, message: 'doctorEmail query param is required.' });
    }

    let query = { doctorEmail };
    if (date) query.date = date;
    if (status) query.status = status;

    const slots = await schedulesCollection.find(query).sort({ date: 1, startTime: 1 }).toArray();

    res.status(200).json({ success: true, count: slots.length, data: slots });
  } catch (error) {
    console.error('[Schedules API] Error fetching slots:', error);
    res.status(500).json({ success: false, message: 'Error fetching slots', error: error.message });
  }
};

// @desc    Update a slot (date/time/type) — cannot edit a booked slot
// @route   PATCH /schedules/:id
export const updateSlot = async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid slot ID format.' });
    }

    const existing = await schedulesCollection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Slot not found.' });
    }
    if (existing.status === 'booked') {
      return res.status(400).json({ success: false, message: 'Cannot edit a booked slot. Cancel the appointment first.' });
    }

    const { date, startTime, endTime, type, status } = req.body;

    const allowedStatuses = ['available', 'unavailable'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}` });
    }

    const newStart = startTime || existing.startTime;
    const newEnd = endTime || existing.endTime;
    const newDate = date || existing.date;
    if (newStart >= newEnd) {
      return res.status(400).json({ success: false, message: 'startTime must be before endTime.' });
    }

    // Check for overlap if time or date is changing
    if (startTime || endTime || date) {
      const overlapping = await schedulesCollection.findOne({
        _id: { $ne: new ObjectId(id) }, // Exclude current slot
        doctorEmail: existing.doctorEmail,
        date: newDate,
        $or: [
          { startTime: { $lt: newEnd }, endTime: { $gt: newStart } }
        ]
      });
      if (overlapping) {
        return res.status(409).json({ success: false, message: `This update overlaps with an existing slot (${overlapping.startTime}–${overlapping.endTime}).` });
      }
    }

    const updateFields = {};
    if (date) updateFields.date = date;
    if (startTime) updateFields.startTime = startTime;
    if (endTime) updateFields.endTime = endTime;
    if (type) updateFields.type = type;
    if (status) updateFields.status = status;
    updateFields.updatedAt = new Date().toISOString();

    const result = await schedulesCollection.updateOne({ _id: new ObjectId(id) }, { $set: updateFields });
    res.status(200).json({ success: true, message: 'Slot updated successfully', data: result });
  } catch (error) {
    console.error('[Schedules API] Error updating slot:', error);
    res.status(500).json({ success: false, message: 'Error updating slot', error: error.message });
  }
};

// @desc    Delete a slot — cannot delete a booked slot
// @route   DELETE /schedules/:id
export const deleteSlot = async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid slot ID format.' });
    }

    const existing = await schedulesCollection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Slot not found.' });
    }
    if (existing.status === 'booked') {
      return res.status(400).json({ success: false, message: 'Cannot delete a booked slot. Cancel the appointment first.' });
    }

    await schedulesCollection.deleteOne({ _id: new ObjectId(id) });
    console.log(`[Schedules API] Deleted slot ${id}`);

    res.status(200).json({ success: true, message: 'Slot deleted successfully' });
  } catch (error) {
    console.error('[Schedules API] Error deleting slot:', error);
    res.status(500).json({ success: false, message: 'Error deleting slot', error: error.message });
  }
};
