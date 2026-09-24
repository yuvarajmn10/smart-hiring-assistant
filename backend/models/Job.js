const mongoose = require('mongoose');
const jobSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Job title is required'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Job description is required'],
        },
        requirements: {
            type: [String],
            // Array of strings: ["React", "Node.js", "MongoDB"]
            default: [],
        },
        location: {
            type: String,
            default: 'Remote',
        },
        salary: {
            type: String,
            // String so we can store "₹8-12 LPA" or "$80k-100k"
            default: 'Not disclosed',
        },
        status: {
            type: String,
            enum: ['open', 'closed'],
            default: 'open',
        },
        recruiter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            // ref: 'User' links this field to the User model
            // stores the recruiter's _id — like a foreign key in SQL
            required: true,
        },
    },
    { timestamps: true }
);
const Job = mongoose.model('Job', jobSchema);
module.exports = Job;