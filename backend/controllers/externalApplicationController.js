const ExternalApplication = require('../models/ExternalApplication');
const STATUSES = ['applied', 'interviewing', 'offer', 'rejected'];
// Only http(s) links — never store javascript: or other schemes we'd later render as a link
const isHttpUrl = (value) => {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
        return false;
    }
};
const str = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

// ─── TRACK A LIVE-JOB APPLICATION (candidate clicked Apply) ──────────
const trackExternalApplication = async (req, res) => {
    try {
        if (req.user.role !== 'candidate') {
            return res.status(403).json({ message: 'Only candidates can track applications' });
        }
        const externalJobId = str(req.body.externalJobId, 500);
        const title = str(req.body.title, 300);
        const applyLink = str(req.body.applyLink, 2000);
        if (!externalJobId || !title || !isHttpUrl(applyLink)) {
            return res.status(400).json({ message: 'externalJobId, title and a valid applyLink are required' });
        }
        const logo = str(req.body.logo, 2000);
        // Upsert — clicking Apply twice on the same job keeps one entry
        const application = await ExternalApplication.findOneAndUpdate(
            { candidate: req.user.id, externalJobId },
            {
                $setOnInsert: {
                    candidate: req.user.id,
                    externalJobId,
                    title,
                    company: str(req.body.company, 200),
                    logo: isHttpUrl(logo) ? logo : null,
                    location: str(req.body.location, 200),
                    publisher: str(req.body.publisher, 100),
                    employmentType: str(req.body.employmentType, 30) || null,
                    applyLink,
                },
            },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
        res.status(201).json({ application });
    } catch (error) {
        if (error.code === 11000) {
            // Two clicks raced — the entry exists, which is what we wanted
            const application = await ExternalApplication.findOne({ candidate: req.user.id, externalJobId: req.body.externalJobId });
            return res.status(200).json({ application });
        }
        res.status(500).json({ message: error.message });
    }
};

// ─── MY LIVE-JOB APPLICATIONS ───────────────────────────────────────
const getMyExternalApplications = async (req, res) => {
    try {
        const applications = await ExternalApplication.find({ candidate: req.user.id }).sort({ createdAt: -1 });
        res.json({ count: applications.length, applications });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── UPDATE STATUS (candidate tracks progress themselves) ───────────
const updateExternalApplication = async (req, res) => {
    try {
        if (!STATUSES.includes(req.body.status)) {
            return res.status(400).json({ message: `status must be one of: ${STATUSES.join(', ')}` });
        }
        const application = await ExternalApplication.findOneAndUpdate(
            { _id: req.params.id, candidate: req.user.id },
            // Filtering on candidate too means nobody can edit someone else's entry
            { status: req.body.status },
            { returnDocument: 'after' }
        );
        if (!application) return res.status(404).json({ message: 'Application not found' });
        res.json({ application });
    } catch (error) {
        if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid application ID' });
        res.status(500).json({ message: error.message });
    }
};

// ─── REMOVE FROM DASHBOARD ──────────────────────────────────────────
const deleteExternalApplication = async (req, res) => {
    try {
        const result = await ExternalApplication.deleteOne({ _id: req.params.id, candidate: req.user.id });
        if (result.deletedCount === 0) return res.status(404).json({ message: 'Application not found' });
        res.json({ message: 'Removed' });
    } catch (error) {
        if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid application ID' });
        res.status(500).json({ message: error.message });
    }
};

module.exports = { trackExternalApplication, getMyExternalApplications, updateExternalApplication, deleteExternalApplication };
