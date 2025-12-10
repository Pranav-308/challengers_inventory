const express = require('express');
const router = express.Router();
const {
  requestComponent,
  getRequests,
  approveRequest,
  rejectRequest,
  cancelRequest,
} = require('../controllers/requestController');
const { protect, admin } = require('../middleware/auth');

router.post('/', protect, requestComponent);
router.get('/', protect, getRequests);
router.patch('/:id/approve', protect, admin, approveRequest);
router.patch('/:id/reject', protect, admin, rejectRequest);
router.delete('/:id', protect, cancelRequest);

module.exports = router;
