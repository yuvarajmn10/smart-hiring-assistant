const mongoose = require('mongoose');
const applicationSchema = new mongoose.Schema(
    {
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job',
            required: true,
            // which job this application is for
        },
        candidate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            // which candidate submitted this application
        },
        resumeText: {
            type: String,
            required: [true, 'Resume text is required'],
            // plain text of the resume — AI will read this on Day 11
        },
        coverLetter: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            enum: ['applied', 'reviewed', 'shortlisted', 'interview', 'selected', 'rejected'],
            default: 'applied',
            // starts as 'applied' (under review); recruiter moves it to interview / selected / rejected
            // 'reviewed' and 'shortlisted' are legacy values kept so older documents still validate
        },
        // AI fields — empty for now, filled on Day 11
        aiScore: {
            type: Number,
            default: null,
        },
        aiVerdict: {
            type: String,
            enum: ['shortlist', 'maybe', 'reject', null],
            default: null,
        },
        aiStrengths: {
            type: [String],
            default: [],
        },
        aiWeaknesses: {
            type: [String],
            default: [],
        },
    },
    { timestamps: true }
);
// One application per candidate per job — enforced by the DB, not just the controller
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });
const Application = mongoose.model('Application', applicationSchema);
module.exports = Application;