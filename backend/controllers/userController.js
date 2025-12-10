const { findUserById, updateUser, getAllUsers: getAllUsersModel, deleteUser: deleteUserModel } = require('../models/User');
const { getAllComponents } = require('../models/Component');
const { getHistoryByUser } = require('../models/CheckoutHistory');

// @desc    Get user's borrowed items
// @route   GET /api/users/:id/borrowed
// @access  Private
const getUserBorrowedItems = async (req, res) => {
  try {
    // Check if user is requesting their own data or is admin
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const allComponents = await getAllComponents({});
    const borrowedItems = allComponents.filter(comp => 
      comp.currentBorrower === req.params.id && 
      (comp.status === 'taken' || comp.status === 'overdue')
    ).sort((a, b) => new Date(b.checkedOutAt) - new Date(a.checkedOutAt));

    res.json(borrowedItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's checkout history
// @route   GET /api/users/:id/history
// @access  Private
const getUserHistory = async (req, res) => {
  try {
    // Check if user is requesting their own data or is admin
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const history = await getHistoryByUser(req.params.id);

    // Manually populate component details
    const historyWithComponents = await Promise.all(history.map(async (record) => {
      const components = await getAllComponents({});
      const component = components.find(c => c.id === record.componentId);
      if (component) {
        record.componentDetails = {
          id: component.id,
          name: component.name,
          componentId: component.componentId,
          category: component.category,
        };
      }
      return record;
    }));

    res.json(historyWithComponents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user notification preferences
// @route   PATCH /api/users/:id/preferences
// @access  Private
const updateNotificationPreferences = async (req, res) => {
  try {
    // Check if user is updating their own preferences
    if (req.params.id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { email, whatsapp } = req.body;

    const user = await findUserById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updates = { notificationPreferences: user.notificationPreferences || {} };
    if (email !== undefined) updates.notificationPreferences.email = email;
    if (whatsapp !== undefined) updates.notificationPreferences.whatsapp = whatsapp;

    await updateUser(req.params.id, updates);

    res.json({
      notificationPreferences: updates.notificationPreferences,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await getAllUsersModel();
    // Remove passwords
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    res.json(usersWithoutPasswords);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const userToDelete = await findUserById(req.params.id);

    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting yourself
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Check if user has borrowed items
    const allComponents = await getAllComponents({});
    const borrowedItems = allComponents.filter(comp => 
      comp.currentBorrower === req.params.id && 
      (comp.status === 'taken' || comp.status === 'overdue')
    );

    if (borrowedItems.length > 0) {
      return res.status(400).json({ 
        message: `Cannot delete user. They have ${borrowedItems.length} borrowed item(s). Please ensure all items are returned first.` 
      });
    }

    await deleteUserModel(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user role (Admin only)
// @route   PATCH /api/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !['admin', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be "admin" or "member"' });
    }

    // Prevent changing your own role
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    const user = await findUserById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await updateUser(req.params.id, { role });

    res.json({ message: 'User role updated successfully', role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUserBorrowedItems,
  getUserHistory,
  updateNotificationPreferences,
  getAllUsers,
  deleteUser,
  updateUserRole,
};
