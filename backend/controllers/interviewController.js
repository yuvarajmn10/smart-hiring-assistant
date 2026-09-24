const Application = require('../models/Application');
const { generateInterviewQuestions } = require('../services/aiScorer');
const getInterviewQuestions = async (req, res) => {
    try {
        // Only recruiters can generate interview questions
        if (req.user.role !== 'recruiter') {
            return res.status(403).json({ message: 'Only recruiters can generate interview questions' });
        }
        const { applicationId } = req.params;
        // applicationId comes from the URL: /api/interview/:applicationId
        // 1. Fetch the application with job and candidate details
        const application = await Application.findById(applicationId)
            .populate('job', 'title requirements recruiter')
            .populate('candidate', 'name');
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }
        // Recruiters may only interview applicants for their own jobs
        if (!application.job || application.job.recruiter.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this application' });
        }
        // 2. Check AI weaknesses exist — need them for targeted questions
        const weaknesses = application.aiWeaknesses.length > 0
            ? application.aiWeaknesses
            : ['General technical skills', 'Communication skills'];
        // Fallback if AI scoring didn't run — still generate generic questions
        // 3. Call Gemini to generate questions
        const questions = await generateInterviewQuestions(
            application.job.title,
            application.job.requirements,
            weaknesses,
            application.candidate.name
        );
        if (questions.length === 0) {
            return res.status(502).json({ message: 'AI could not generate questions right now. Please try again.' });
        }
        // 4. Return questions with candidate context
        res.json({
            candidate: application.candidate.name,
            jobTitle: application.job.title,
            aiScore: application.aiScore,
            aiVerdict: application.aiVerdict,
            weaknesses,
            questions,
        });
    } catch (error) {
        if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid application ID' });
        res.status(500).json({ message: error.message });
    }
};
module.exports = { getInterviewQuestions };