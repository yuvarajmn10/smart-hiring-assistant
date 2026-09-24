const express = require('express');
const router = express.Router();
const { getMyResume, saveResumeForm, uploadResume, deleteMyResume } = require('../controllers/profileResumeController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
// The candidate's saved resume — /api/profile/resume
router.get('/', protect, getMyResume);
router.put('/', protect, saveResumeForm);
// PUT = save the fill-in form
router.post('/upload', protect, upload.single('resume'), uploadResume);
// POST /upload = save from a PDF (same 'resume' field name as /api/resume/parse)
router.delete('/', protect, deleteMyResume);
module.exports = router;
