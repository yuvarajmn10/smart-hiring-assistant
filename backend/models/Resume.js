const mongoose = require('mongoose');
// One saved resume per candidate — either an uploaded PDF (text extracted)
// or details filled in on the Resume page. resumeText is what AI scoring reads either way.
const experienceSchema = new mongoose.Schema({
    title: String, company: String, start: String, end: String, description: String,
}, { _id: false });
const educationSchema = new mongoose.Schema({
    degree: String, institution: String, year: String, score: String,
}, { _id: false });
const projectSchema = new mongoose.Schema({
    name: String, tech: String, link: String, description: String,
}, { _id: false });
const resumeSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        source: {
            type: String,
            enum: ['upload', 'form'],
            required: true,
        },
        targetRole: { type: String, default: '' },
        fileName: { type: String, default: '' },
        // fileName is only set for uploads
        resumeText: {
            type: String,
            required: true,
        },
        // Only for the fill-in form — kept so the form can be edited later
        details: {
            fullName: String,
            email: String,
            phone: String,
            location: String,
            links: { linkedin: String, github: String, portfolio: String },
            summary: String,
            skills: [String],
            experience: [experienceSchema],
            education: [educationSchema],
            projects: [projectSchema],
            certifications: [String],
        },
    },
    { timestamps: true }
);
const Resume = mongoose.model('Resume', resumeSchema);
module.exports = Resume;
