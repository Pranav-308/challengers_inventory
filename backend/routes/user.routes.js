const express = require('express');
const router = express.Router();
const {
  getUserBorrowedItems,
  getUserHistory,
  updateNotificationPreferences,
  getAllUsers,
  deleteUser,
  updateUserRole,
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

router.get('/', protect, admin, getAllUsers);
router.delete('/:id', protect, admin, deleteUser);
router.patch('/:id/role', protect, admin, updateUserRole);
router.get('/:id/borrowed', protect, getUserBorrowedItems);
router.get('/:id/history', protect, getUserHistory);
router.patch('/:id/preferences', protect, updateNotificationPreferences);

module.exports = router;
