const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required'],
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Candidate ID is required'],
    },
    resumeText: {
      type: String,
      default: '',
    },
    resumeFileName: {
      type: String,
      default: '',
    },
    fitScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    strengths: {
      type: [String],
      default: [],
    },
    gaps: {
      type: [String],
      default: [],
    },
    aiSummary: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'rejected'],
      default: 'applied',
    },
  },
  {
    timestamps: true,
  }
);

applicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;