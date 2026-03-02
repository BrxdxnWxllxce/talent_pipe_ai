import mongoose from 'mongoose';

const CandidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Applied', 'Interviewing', 'Hired', 'Rejected'],
      default: 'Applied',
    },
    resumeUrl: {
      type: String,
      default: '',
    },
    aiSummary: {
      type: String,
      default: '',
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    experienceYears: {
      type: Number,
      default: null,
    },
    skills: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model('Candidate', CandidateSchema);
