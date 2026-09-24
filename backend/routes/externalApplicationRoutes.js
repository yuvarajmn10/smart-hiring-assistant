const express = require('express');
const router = express.Router();
const {
    trackExternalApplication,
    getMyExternalApplications,
    updateExternalApplication,
    deleteExternalApplication,
} = require('../controllers/externalApplicationController');
const { protect } = require('../middleware/authMiddleware');
router.post('/', protect, trackExternalApplication);
// POST /api/external-applications — candidate clicked Apply on a live job
router.get('/my', protect, getMyExternalApplications);
router.patch('/:id', protect, updateExternalApplication);
router.delete('/:id', protect, deleteExternalApplication);
module.exports = router;
