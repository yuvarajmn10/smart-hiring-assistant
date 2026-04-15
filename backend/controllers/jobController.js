const Job = require('../models/Job');

const createJob = async (req, res) => {
  try {
    const { title, company, description, requirements, location } = req.body;

    if (!title || !company || !description || !requirements || !location) {
      return res.status(400).json({
        message: 'Please provide title, company, description, requirements and location'
      });
    }

    const job = await Job.create({
      title,
      company,
      description,
      requirements,
      location,
      postedBy: req.user._id,
    });

    res.status(201).json({
      message: 'Job posted successfully',
      job,
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server error while creating job',
      error: error.message,
    });
  }
};
const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('postedBy', 'name email company')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Jobs fetched successfully',
      count: jobs.length,
      jobs,
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server error while fetching jobs',
      error: error.message,
    });
  }
};

const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name email');

    if (!job) {
      return res.status(404).json({
        message: 'Job not found'
      });
    }

    res.status(200).json({
      message: 'Job fetched successfully',
      job,
    });
} catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }
    res.status(500).json({
      message: 'Server error while fetching job',
      error: error.message,
    });
  }
};

module.exports = { createJob, getAllJobs, getJobById };