const Job = require('../models/Job');
const Application = require('../models/Application');
// ─── CREATE JOB ─────────────────────────────────────
const createJob = async (req, res) => {
    try {
        const { title, description, requirements, location, salary } = req.body;
        if (!title || !description) {
            return res.status(400).json({ message: 'Title and description are required' });
        }
        // Only recruiters can post jobs
        if (req.user.role !== 'recruiter') {
            return res.status(403).json({ message: 'Only recruiters can post jobs' });
        }
        const job = await Job.create({
            title,
            description,
            requirements,
            location,
            salary,
            recruiter: req.user.id,
            // req.user.id comes from the auth middleware — no need to send it manually
        });
        res.status(201).json({ job });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// ─── GET ALL JOBS ────────────────────────────────────
const getAllJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ status: 'open' })
            .populate('recruiter', 'name email')
            // populate replaces the recruiter ID with the actual name + email
            // instead of: recruiter: "661f3b..."
            // you get: recruiter: { name: "Test Recruiter", email: "..." }
            .sort({ createdAt: -1 });
        // -1 = newest first
        res.json({ count: jobs.length, jobs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMyJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ recruiter: req.user.id })
            .sort({ createdAt: -1 });
        res.json({ count: jobs.length, jobs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// ─── GET ONE JOB ─────────────────────────────────────
const getJobById = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate('recruiter', 'name email');
        // req.params.id = the :id part from the URL
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        res.json({ job });
    } catch (error) {
        if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid job ID' });
        res.status(500).json({ message: error.message });
    }
};
// ─── DELETE JOB ──────────────────────────────────────
const deleteJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        // Make sure the recruiter deleting the job is the one who created it
        if (job.recruiter.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this job' });
        }
        await Application.deleteMany({ job: job._id });
        // Remove the job's applications too — otherwise they're orphaned
        await job.deleteOne();
        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid job ID' });
        res.status(500).json({ message: error.message });
    }
};
module.exports = { createJob, getAllJobs, getJobById, deleteJob, getMyJobs };