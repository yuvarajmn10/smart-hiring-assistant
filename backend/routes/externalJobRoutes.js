const express = require('express');
const router = express.Router();
const { getExternalJobs } = require('../controllers/externalJobController');
router.get('/', getExternalJobs);
// GET /api/external-jobs — public, like /api/jobs
module.exports = router;
