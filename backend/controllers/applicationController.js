const Application = require('../models/Application');
const Job = require('../models/Job');
const pdfParse = require('pdf-parse');
// const pdfParse = require('pdf-parse/lib/pdf-parse');

const applyToJob = async (req, res) => {
  try {
    const { jobId } = req.body;
    const candidateId = req.user._id;

    if (!jobId) {
      return res.status(400).json({
        message: 'Please provide jobId in the request body'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'Please upload a PDF resume'
      });
    }
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        message: 'Job not found'
      });
    }

    const existingApplication = await Application.findOne({
      jobId,
      candidateId,
    });
    if (existingApplication) {
      return res.status(400).json({
        message: 'You have already applied to this job'
      });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text.trim();

    if (!resumeText || resumeText.length < 50) {
      return res.status(400).json({
        message: 'Could not extract text from PDF. Please upload a text-based PDF, not a scanned image.'
      });
    }
    const application = await Application.create({
      jobId,
      candidateId,
      resumeText,
      resumeFileName: req.file.originalname,
    });

    res.status(201).json({
      message: 'Application submitted successfully',
      application: {
        _id: application._id,
        jobId: application.jobId,
        candidateId: application.candidateId,
        resumeFileName: application.resumeFileName,
        resumeTextPreview: resumeText.substring(0, 200) + '...',
        resumeTextLength: resumeText.length,
        fitScore: application.fitScore,
        status: application.status,
        createdAt: application.createdAt,
      },
    });
    } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'You have already applied to this job'
      });
    }
    res.status(500).json({
      message: 'Server error during application',
      error: error.message,
    });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({
      candidateId: req.user._id,
    })
      .populate('jobId', 'title company location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Applications fetched successfully',
      count: applications.length,
      applications,
    });
    } catch (error) {
    res.status(500).json({
      message: 'Server error while fetching applications',
      error: error.message,
    });
  }
};

module.exports = { applyToJob, getMyApplications };