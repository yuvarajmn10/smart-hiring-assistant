const mongoose = require('mongoose');
// A live job (LinkedIn, Naukri, Internshala...) the candidate applied to on the other site.
// HireAI can't see the other site, so we store a snapshot of the job at the moment they clicked Apply.
const externalApplicationSchema = new mongoose.Schema(
    {
        candidate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        externalJobId: {
            type: String,
            required: true,
            // JSearch's job_id
        },
        title: { type: String, required: true, trim: true },
        company: { type: String, default: '' },
        logo: { type: String, default: null },
        location: { type: String, default: '' },
        publisher: { type: String, default: '' },
        // e.g. "LinkedIn" — the site they applied on
        employmentType: { type: String, default: null },
        applyLink: { type: String, required: true },
        status: {
            type: String,
            enum: ['applied', 'interviewing', 'offer', 'rejected'],
            default: 'applied',
            // Updated by the candidate — the other site doesn't report back
        },
    },
    { timestamps: true }
);
externalApplicationSchema.index({ candidate: 1, externalJobId: 1 }, { unique: true });
const ExternalApplication = mongoose.model('ExternalApplication', externalApplicationSchema);
module.exports = ExternalApplication;
