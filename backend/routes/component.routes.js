const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getComponents,
  getComponent,
  checkoutComponent,
  returnComponent,
  getComponentHistory,
  createComponent,
  getOverdueComponents,
  uploadComponentImage,
} = require('../controllers/componentController');
const { protect, admin } = require('../middleware/auth');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/components/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'component-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.get('/', protect, getComponents);
router.post('/', protect, admin, createComponent);
router.post('/:id/upload-image', protect, admin, upload.single('image'), uploadComponentImage);
router.get('/overdue/list', protect, getOverdueComponents);
router.get('/:id', protect, getComponent);
router.post('/:id/checkout', protect, checkoutComponent);
router.post('/:id/return', protect, returnComponent);
router.get('/:id/history', protect, getComponentHistory);

module.exports = router;
