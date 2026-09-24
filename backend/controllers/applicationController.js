const { getTopKCandidates } = require('../utils/MaxHeap');
const Application = require('../models/Application');
const Job = require('../models/Job')
const { scoreResume, generateCoverLetter } = require('../services/aiScorer');
const crypto = require('crypto');
// Fit scores from "Review my resume", kept briefly so Submit saves the exact score the
// candidate saw (and doesn't pay for a second Gemini call). Key: user + job + resume text.
const PREVIEW_TTL_MS = 30 * 60 * 1000;
const previewCache = new Map();
const previewKey = (userId, jobId, resumeText) =>
    `${userId}:${jobId}:${crypto.createHash('sha256').update(resumeText).digest('hex')}`;
const getCachedPreview = (key) => {
    const hit = previewCache.get(key);
    if (!hit) return null;
    if (Date.now() - hit.at > PREVIEW_TTL_MS) { previewCache.delete(key); return null; }
    return hit.result;
};
// Shared checks for preview and submit — returns the job, or sends the error response
const loadJobForApplying = async (req, res, jobId, resumeText) => {
    if (req.user.role !== 'candidate') {
        res.status(403).json({ message: 'Only candidates can apply to jobs' });
        return null;
    }
    if (!jobId || !resumeText || resumeText.trim().length < 50) {
        res.status(400).json({ message: 'Missing fields or resume too short' });
        return null;
    }
    const job = await Job.findById(jobId);
    if (!job) {
        res.status(404).json({ message: 'Job not found' });
        return null;
    }
    if (job.status === 'closed') {
        res.status(400).json({ message: 'This job is no longer accepting applications' });
        return null;
    }
    const existing = await Application.findOne({ job: jobId, candidate: req.user.id });
    if (existing) {
        res.status(400).json({ message: 'You have already applied to this job' });
        return null;
    }
    return job;
};
// ─── WRITE A COVER LETTER (nothing is saved) ─────────
const writeCoverLetter = async (req, res) => {
    try {
        if (req.user.role !== 'candidate') {
            return res.status(403).json({ message: 'Only candidates can write cover letters' });
        }
        const { jobId, resumeText } = req.body;
        if (!jobId || typeof resumeText !== 'string' || resumeText.trim().length < 50) {
            return res.status(400).json({ message: 'Choose or upload your resume first' });
        }
        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        const coverLetter = await generateCoverLetter(
            resumeText.slice(0, 15000), job.title, job.description, job.requirements, req.user.name
        );
        res.json({ coverLetter });
    } catch (error) {
        if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid job ID' });
        console.error('Cover letter generation failed:', error.message);
        res.status(502).json({ message: 'AI could not write a cover letter right now. Please try again.' });
    }
};
// ─── PREVIEW FIT SCORE (nothing is saved) ────────────
const previewApplication = async (req, res) => {
    try {
        const { jobId, resumeText } = req.body;
        const job = await loadJobForApplying(req, res, jobId, resumeText);
        if (!job) return;
        const key = previewKey(req.user.id, jobId, resumeText);
        let result = getCachedPreview(key);
        if (!result) {
            result = await scoreResume(resumeText, job.title, job.description, job.requirements);
            if (result.fitScore == null) {
                return res.status(502).json({ message: 'AI could not review your resume right now. Please try again.' });
            }
            previewCache.set(key, { at: Date.now(), result });
            if (previewCache.size > 500) previewCache.delete(previewCache.keys().next().value);
        }
        res.json({
            aiScore: result.fitScore,
            aiVerdict: result.verdict,
            aiStrengths: result.strengths,
            aiWeaknesses: result.weaknesses,
        });
    } catch (error) {
        if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid job ID' });
        res.status(500).json({ message: error.message });
    }
};
// ─── SUBMIT APPLICATION ──────────────────────────────
const submitApplication = async (req, res) => {
    try {
        // 1-3. Candidate only, job exists and is open, not already applied
        const { jobId, resumeText, coverLetter } = req.body;
        const job = await loadJobForApplying(req, res, jobId, resumeText);
        if (!job) return;
        // Reuse the score from "Review my resume" when the resume is unchanged
        const key = previewKey(req.user.id, jobId, resumeText);
        const aiResult = getCachedPreview(key)
            || await scoreResume(resumeText, job.title, job.description, job.requirements);
        // 4. Create the application
        const application = await Application.create({
            job: jobId,
            candidate: req.user.id,
            resumeText,
            coverLetter: typeof coverLetter === 'string' ? coverLetter.slice(0, 500) : '',
            aiScore: aiResult.fitScore,
            aiVerdict: aiResult.verdict,
            aiStrengths: aiResult.strengths,
            aiWeaknesses: aiResult.weaknesses,
        });
        previewCache.delete(key);
        res.status(201).json({ message: 'Application submitted successfully', application });
    } catch (error) {
        if (error.code === 11000) {
            // Unique index hit — two submissions raced past the duplicate check
            return res.status(400).json({ message: 'You have already applied to this job' });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid job ID' });
        }
        res.status(500).json({ message: error.message });
    }
};
// ─── GET APPLICATIONS FOR A JOB (recruiter) ──────────
const getApplicationsForJob = async (req, res) => {
    try {
        // Only recruiters can see applications
        if (req.user.role !== 'recruiter') {
            return res.status(403).json({ message: 'Only recruiters can view applications' });
        }
        const { jobId } = req.query;
        if (!jobId) return res.status(400).json({ message: 'jobId is required' });
        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        if (job.recruiter.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view these applications' });
        }

        // jobId comes from the URL query: /api/applications?jobId=xxx
        const applications = await Application.find({ job: jobId })
            .populate('candidate', 'name email')
            .populate('job', 'title')
            .sort({ aiScore: -1 });
        res.json({ count: applications.length, applications });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ─── GET RANKED CANDIDATES (heap sort) ───────────────
const getRankedCandidates = async (req, res) => {
    try {
        if (req.user.role !== 'recruiter') {
            return res.status(403).json({ message: 'Only recruiters can view ranked candidates' });
        }
        const { jobId } = req.query;
        const k = parseInt(req.query.k) || 10;
        // k = how many top candidates to return, default 10
        if (!jobId) {
            return res.status(400).json({ message: 'jobId is required' });
        }
        // Recruiters may only see applicants for their own jobs
        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        if (job.recruiter.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view these applications' });
        }
        // Fetch all applications for this job
        const applications = await Application.find({ job: jobId })
            .populate('candidate', 'name email')
            .populate('job', 'title');
        // Note: no .sort() here — heap handles the sorting
        if (applications.length === 0) {
            return res.json({ count: 0, topCandidates: [] });
        }
        // Use max-heap to get top K candidates
        const topCandidates = getTopKCandidates(applications, k);
        res.json({
            totalApplicants: applications.length,
            showing: topCandidates.length,
            rankedBy: 'aiScore (max-heap)',
            topCandidates,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── RESCORE (recruiter) — for applications saved while the AI was down ───
const rescoreApplication = async (req, res) => {
    try {
        if (req.user.role !== 'recruiter') {
            return res.status(403).json({ message: 'Only recruiters can rescore applications' });
        }
        const application = await Application.findById(req.params.id).populate('job');
        if (!application || !application.job) return res.status(404).json({ message: 'Application not found' });
        if (application.job.recruiter.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Not authorized to rescore this application' });
        }
        const { title, description, requirements } = application.job;
        const aiResult = await scoreResume(application.resumeText, title, description, requirements);
        if (aiResult.fitScore == null) {
            return res.status(502).json({ message: 'AI is busy right now. Please try again in a minute.' });
        }
        application.aiScore = aiResult.fitScore;
        application.aiVerdict = aiResult.verdict;
        application.aiStrengths = aiResult.strengths;
        application.aiWeaknesses = aiResult.weaknesses;
        await application.save();
        await application.populate('candidate', 'name email');
        res.json({ application });
    } catch (error) {
        if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid application ID' });
        res.status(500).json({ message: error.message });
    }
};

// ─── UPDATE STATUS (recruiter) — under review → interview / selected / rejected ───
const RECRUITER_STATUSES = ['applied', 'interview', 'selected', 'rejected'];
const updateApplicationStatus = async (req, res) => {
    try {
        if (req.user.role !== 'recruiter') {
            return res.status(403).json({ message: 'Only recruiters can update application status' });
        }
        const { status } = req.body;
        if (!RECRUITER_STATUSES.includes(status)) {
            return res.status(400).json({ message: `status must be one of: ${RECRUITER_STATUSES.join(', ')}` });
        }
        const application = await Application.findById(req.params.id).populate('job');
        if (!application || !application.job) return res.status(404).json({ message: 'Application not found' });
        if (application.job.recruiter.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this application' });
        }
        application.status = status;
        await application.save();
        res.json({ application: { _id: application._id, status: application.status } });
    } catch (error) {
        if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid application ID' });
        res.status(500).json({ message: error.message });
    }
};

// ─── BULK UPDATE STATUS (recruiter) — e.g. move the top N ranked candidates to selected ───
const bulkUpdateApplicationStatus = async (req, res) => {
    try {
        if (req.user.role !== 'recruiter') {
            return res.status(403).json({ message: 'Only recruiters can update application status' });
        }
        const { jobId, applicationIds, status } = req.body;
        if (!RECRUITER_STATUSES.includes(status)) {
            return res.status(400).json({ message: `status must be one of: ${RECRUITER_STATUSES.join(', ')}` });
        }
        if (!jobId || !Array.isArray(applicationIds) || applicationIds.length === 0) {
            return res.status(400).json({ message: 'jobId and applicationIds are required' });
        }
        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        if (job.recruiter.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update these applications' });
        }
        // Filtering on job too means ids from someone else's job are ignored
        const result = await Application.updateMany({ _id: { $in: applicationIds }, job: jobId }, { status });
        res.json({ updated: result.modifiedCount, matched: result.matchedCount, status });
    } catch (error) {
        if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid job or application ID' });
        res.status(500).json({ message: error.message });
    }
};

// ─── GET MY APPLICATIONS (candidate) ─────────────────
const getMyApplications = async (req, res) => {
    try {
        const applications = await Application.find({ candidate: req.user.id })
            .populate('job', 'title location salary status')
            .sort({ createdAt: -1 });
        res.json({ count: applications.length, applications });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
module.exports = { writeCoverLetter, previewApplication, submitApplication, rescoreApplication, updateApplicationStatus, bulkUpdateApplicationStatus, getApplicationsForJob, getMyApplications, getRankedCandidates, };