import jwt from 'jsonwebtoken';

// Configure cookie options for production readiness
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days expiration
};

// @desc    Generate JWT and set cookie
// @route   POST /auth/jwt
export const generateToken = (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email and role are required'
      });
    }

    const payload = { email, role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.cookie('token', token, cookieOptions).status(200).json({
      success: true,
      message: 'Authentication successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating token',
      error: error.message
    });
  }
};

// @desc    Clear JWT cookie
// @route   POST /auth/logout
export const logoutUser = (req, res) => {
  try {
    res.clearCookie('token', { ...cookieOptions, maxAge: 0 }).status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during logout',
      error: error.message
    });
  }
};
