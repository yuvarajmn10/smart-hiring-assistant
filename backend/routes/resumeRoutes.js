const express = require('express');
const router = express.Router();
const { parseResume } = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
router.post(
    '/parse',
    protect,
    // protect runs first — must be logged in
    upload.single('resume'),
    // upload.single('resume') runs second — handles the file
    // 'resume' must match the field name used in Postman/frontend
    parseResume
    // parseResume runs last — extracts text and responds
);
module.exports = router;