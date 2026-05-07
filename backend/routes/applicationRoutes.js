const express = require('express');
const router = express.Router();
const {
  applyToJob,
  getMyApplications,
} = require('../controllers/applicationController');
const { protect, candidateOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/apply', protect, candidateOnly, upload.single('resume'), applyToJob);
router.get('/my', protect, candidateOnly, getMyApplications);

module.exports = router;