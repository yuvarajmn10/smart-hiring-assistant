const pdfParse = require('pdf-parse');
const Resume = require('../models/Resume');

const str = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const list = (value, maxItems) => (Array.isArray(value) ? value.slice(0, maxItems) : []);

// Whitelist + trim everything from the form — never store arbitrary client JSON
const cleanDetails = (d = {}) => ({
    fullName: str(d.fullName, 100),
    email: str(d.email, 150),
    phone: str(d.phone, 30),
    location: str(d.location, 100),
    links: {
        linkedin: str(d.links?.linkedin, 300),
        github: str(d.links?.github, 300),
        portfolio: str(d.links?.portfolio, 300),
    },
    summary: str(d.summary, 1500),
    skills: [...new Set(list(d.skills, 50).map(s => str(s, 50)).filter(Boolean))],
    experience: list(d.experience, 15).map(e => ({
        title: str(e?.title, 120), company: str(e?.company, 120),
        start: str(e?.start, 30), end: str(e?.end, 30), description: str(e?.description, 1500),
    })).filter(e => e.title || e.company),
    education: list(d.education, 10).map(e => ({
        degree: str(e?.degree, 150), institution: str(e?.institution, 150),
        year: str(e?.year, 30), score: str(e?.score, 30),
    })).filter(e => e.degree || e.institution),
    projects: list(d.projects, 15).map(p => ({
        name: str(p?.name, 120), tech: str(p?.tech, 200),
        link: str(p?.link, 300), description: str(p?.description, 1500),
    })).filter(p => p.name),
    certifications: list(d.certifications, 20).map(c => str(c, 150)).filter(Boolean),
});

// Plain-text resume built from the form — this is what Gemini reads when scoring
const buildResumeText = (d, targetRole) => {
    const lines = [];
    lines.push(d.fullName);
    if (targetRole) lines.push(`Target role: ${targetRole}`);
    const contact = [d.email, d.phone, d.location].filter(Boolean).join(' | ');
    if (contact) lines.push(contact);
    const links = Object.entries(d.links || {}).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`);
    if (links.length) lines.push(links.join(' | '));
    if (d.summary) lines.push('', 'SUMMARY', d.summary);
    if (d.skills.length) lines.push('', 'SKILLS', d.skills.join(', '));
    if (d.experience.length) {
        lines.push('', 'EXPERIENCE');
        d.experience.forEach(e => {
            const dates = [e.start, e.end].filter(Boolean).join(' – ');
            lines.push(`${e.title}${e.company ? ` at ${e.company}` : ''}${dates ? ` (${dates})` : ''}`);
            if (e.description) lines.push(e.description);
        });
    }
    if (d.projects.length) {
        lines.push('', 'PROJECTS');
        d.projects.forEach(p => {
            lines.push(`${p.name}${p.tech ? ` — ${p.tech}` : ''}${p.link ? ` (${p.link})` : ''}`);
            if (p.description) lines.push(p.description);
        });
    }
    if (d.education.length) {
        lines.push('', 'EDUCATION');
        d.education.forEach(e => {
            lines.push([e.degree, e.institution, e.year, e.score].filter(Boolean).join(', '));
        });
    }
    if (d.certifications.length) lines.push('', 'CERTIFICATIONS', d.certifications.join(', '));
    return lines.filter(l => l !== undefined).join('\n').trim();
};

const candidateOnly = (req, res) => {
    if (req.user.role !== 'candidate') {
        res.status(403).json({ message: 'Only candidates have a resume' });
        return false;
    }
    return true;
};

// ─── GET MY RESUME ───────────────────────────────────
const getMyResume = async (req, res) => {
    try {
        const resume = await Resume.findOne({ user: req.user.id });
        res.json({ resume });
        // resume is null when nothing is saved yet — not an error
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── SAVE FROM THE FILL-IN FORM ──────────────────────
const saveResumeForm = async (req, res) => {
    try {
        if (!candidateOnly(req, res)) return;
        const details = cleanDetails(req.body.details);
        const targetRole = str(req.body.targetRole, 100);
        if (!details.fullName) {
            return res.status(400).json({ message: 'Full name is required' });
        }
        const resumeText = buildResumeText(details, targetRole);
        if (resumeText.length < 50) {
            return res.status(400).json({ message: 'Add a bit more — a summary, skills or experience — so the AI has something to score' });
        }
        const resume = await Resume.findOneAndUpdate(
            { user: req.user.id },
            { user: req.user.id, source: 'form', targetRole, details, resumeText, fileName: '' },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true }
        );
        res.json({ resume });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── SAVE FROM AN UPLOADED PDF ───────────────────────
const uploadResume = async (req, res) => {
    try {
        if (!candidateOnly(req, res)) return;
        if (!req.file) return res.status(400).json({ message: 'Please upload a PDF file' });
        const data = await pdfParse(req.file.buffer);
        const resumeText = data.text.trim();
        if (resumeText.length < 50) {
            return res.status(400).json({ message: 'Could not extract text from PDF. Make sure it is not a scanned image.' });
        }
        const resume = await Resume.findOneAndUpdate(
            { user: req.user.id },
            {
                user: req.user.id, source: 'upload', resumeText,
                fileName: str(req.file.originalname, 200),
                targetRole: str(req.body.targetRole, 100),
                $unset: { details: 1 },
            },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
        res.json({ resume });
    } catch (error) {
        res.status(500).json({ message: 'Failed to read PDF: ' + error.message });
    }
};

// ─── DELETE ──────────────────────────────────────────
const deleteMyResume = async (req, res) => {
    try {
        await Resume.deleteOne({ user: req.user.id });
        res.json({ message: 'Resume deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getMyResume, saveResumeForm, uploadResume, deleteMyResume };
