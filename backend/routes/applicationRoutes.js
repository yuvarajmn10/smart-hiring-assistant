const express = require('express');
const router = express.Router();
const {
    writeCoverLetter,
    previewApplication,
    rescoreApplication,
    updateApplicationStatus,
    bulkUpdateApplicationStatus,
    submitApplication,
    getApplicationsForJob,
    getMyApplications,
    getRankedCandidates,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');
router.post('/cover-letter', protect, writeCoverLetter);
// POST /api/applications/cover-letter - AI drafts a cover letter, nothing saved
router.post('/preview', protect, previewApplication);
// POST /api/applications/preview - fit score only, nothing saved
router.post('/', protect, submitApplication);
// POST /api/applications — candidate submits application
router.get('/', protect, getApplicationsForJob);
// GET /api/applications?jobId=xxx — recruiter views applications
router.get('/my', protect, getMyApplications);
// GET /api/applications/my — candidate views their own applications
router.get('/ranked', protect, getRankedCandidates);
router.post('/:id/rescore', protect, rescoreApplication);
// POST /api/applications/:id/rescore - recruiter re-runs AI scoring
router.patch('/status', protect, bulkUpdateApplicationStatus);
// PATCH /api/applications/status - recruiter updates many at once (top N by rank)
router.patch('/:id/status', protect, updateApplicationStatus);
// PATCH /api/applications/:id/status - recruiter sets under review / interview / selected / rejected
module.exports = router; 