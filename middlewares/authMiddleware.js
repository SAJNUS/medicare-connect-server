import jwt from 'jsonwebtoken';
import { usersCollection } from '../utils/db.js';

// @desc    Verify JWT token from cookies
export const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access Denied: No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info (email, role) to the request object
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Access Denied: Invalid or expired token'
    });
  }
};

// @desc    Verify Admin Role
export const verifyAdmin = async (req, res, next) => {
  try {
    const email = req.user?.email;
    const user = await usersCollection.findOne({ email });

    if (!user || user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Admin access required'
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error during authorization' });
  }
};

// @desc    Verify Doctor Role
export const verifyDoctor = async (req, res, next) => {
  try {
    const email = req.user?.email;
    const user = await usersCollection.findOne({ email });

    if (!user || user.role !== 'Doctor') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Doctor access required'
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error during authorization' });
  }
};

// @desc    Verify Patient Role
export const verifyPatient = async (req, res, next) => {
  try {
    const email = req.user?.email;
    const user = await usersCollection.findOne({ email });

    if (!user || user.role !== 'Patient') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Patient access required'
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error during authorization' });
  }
};

// @desc    Verify Doctor OR Admin Role (for appointment status updates, viewing etc.)
export const verifyDoctorOrAdmin = async (req, res, next) => {
  try {
    const email = req.user?.email;
    const user = await usersCollection.findOne({ email });

    if (!user || (user.role !== 'Doctor' && user.role !== 'Admin')) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Doctor or Admin access required'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error during authorization' });
  }
};
