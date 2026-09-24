const express = require('express');
const router = express.Router();
const { getInterviewQuestions } = require('../controllers/interviewController');
const { protect } = require('../middleware/authMiddleware');
router.get('/:applicationId', protect, getInterviewQuestions);
// GET /api/interview/:applicationId
// recruiter passes the application ID → gets back 5 targeted questions
module.exports = router;