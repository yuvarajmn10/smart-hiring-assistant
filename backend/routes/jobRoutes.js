const express = require('express');
const router = express.Router();
const { createJob, getAllJobs, getJobById } = require('../controllers/jobController');
const { protect, recruiterOnly } = require('../middleware/auth');

router.post('/', protect, recruiterOnly, createJob);
router.get('/', getAllJobs);
router.get('/:id', getJobById);

module.exports = router;
