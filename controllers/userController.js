import { usersCollection } from '../utils/db.js';

// @desc    Register a new user
// @route   POST /users
export const registerUser = async (req, res) => {
  try {
    const user = req.body;
    
    // Prevent duplicate user creation
    const query = { email: user.email };
    const existingUser = await usersCollection.findOne(query);
    
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    const result = await usersCollection.insertOne(user);
    console.log(`[Users API] Successfully registered new user: ${user.email}`);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    console.error(`[Users API] Error registering user:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Error registering user', 
      error: error.message 
    });
  }
};

// @desc    Get user by email
// @route   GET /users/:email
export const getUserByEmail = async (req, res) => {
  try {
    const email = req.params.email;
    const user = await usersCollection.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(`[Users API] Error fetching user by email:`, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// @desc    Update user role
// @route   PATCH /users/:email/role
export const updateUserRole = async (req, res) => {
  try {
    const email = req.params.email;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required to update'
      });
    }

    const filter = { email };
    const updateDoc = {
      $set: { role }
    };

    const result = await usersCollection.updateOne(filter, updateDoc);

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: result
    });
  } catch (error) {
    console.error(`[Users API] Error updating user role:`, error);
    res.status(500).json({
      success: false,
      message: 'Error updating user role',
      error: error.message
    });
  }
};

// @desc    Get all users
// @route   GET /users
export const getAllUsers = async (req, res) => {
  try {
    const users = await usersCollection.find({}).toArray();
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error(`[Users API] Error fetching all users:`, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};
