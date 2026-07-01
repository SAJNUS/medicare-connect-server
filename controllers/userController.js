import { usersCollection } from '../utils/db.js';

// @desc    Register a new user
// @route   POST /users
export const registerUser = async (req, res) => {
  try {
    const user = req.body;
    
    // Prevent duplicate user creation (case-insensitive)
    const query = { email: { $regex: new RegExp(`^${user.email}$`, 'i') } };
    const existingUser = await usersCollection.findOne(query);
    
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    if (!user.createdAt) {
      user.createdAt = new Date().toISOString();
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
    const user = await usersCollection.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    
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

    // Protect permanent roles
    if (email.toLowerCase() === 'medicare@gmail.com' || email.toLowerCase() === 'sajnussaharearhojayfa@gmail.com') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify the role of a permanent system account.'
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

// @desc    Update user name
// @route   PATCH /users/:email/name
export const updateUserName = async (req, res) => {
  try {
    const email = req.params.email;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const result = await usersCollection.updateOne({ email }, { $set: { name } });
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'User name updated successfully' });
  } catch (error) {
    console.error(`[Users API] Error updating user name:`, error);
    res.status(500).json({ success: false, message: 'Error updating user name' });
  }
};

// @desc    Update user status (Suspend/Unsuspend)
// @route   PATCH /users/:email/status
export const updateUserStatus = async (req, res) => {
  try {
    const email = req.params.email;
    const { status } = req.body;

    const user = await usersCollection.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role && user.role.toLowerCase() === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot suspend an admin account' });
    }

    await usersCollection.updateOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } }, { $set: { status } });
    
    res.status(200).json({ success: true, message: 'User status updated successfully' });
  } catch (error) {
    console.error(`[Users API] Error updating user status:`, error);
    res.status(500).json({ success: false, message: 'Error updating user status' });
  }
};

// @desc    Delete user
// @route   DELETE /users/:email
export const deleteUser = async (req, res) => {
  try {
    const email = req.params.email;

    // Prevent deleting admin
    const targetUser = await usersCollection.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (targetUser.role && targetUser.role.toLowerCase() === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot delete an admin account' });
    }

    await usersCollection.deleteOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error(`[Users API] Error deleting user:`, error);
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
};
