import Candidate from '../models/Candidate.js';
import { generateCandidateInsight } from '../services/aiService.js';

/**
 * Create a new candidate.
 * POST /api/candidates
 */
export const createCandidate = async (req, res) => {
  console.log('Incoming Request Body:', req.body);
  try {
    const { name, email, role, status, resumeUrl, aiSummary, matchScore, experienceYears, skills } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name and email are required.',
      });
    }

    const candidate = await Candidate.create({
      name,
      email,
      role: role ?? '',
      status: status ?? 'Applied',
      resumeUrl: resumeUrl ?? '',
      aiSummary: aiSummary ?? '',
      matchScore: matchScore ?? null,
      experienceYears: experienceYears ?? null,
      skills: Array.isArray(skills) ? skills : [],
    });

    res.status(201).json({ success: true, data: candidate });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'A candidate with this email already exists.' });
    }
    res.status(500).json({ success: false, message: err.message || 'Failed to create candidate.' });
  }
};

/**
 * Analyze a candidate with AI.
 * PUT /api/candidates/:id/analyze
 */
export const analyzeCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }

    const { summary, matchScore } = await generateCandidateInsight(candidate.name, candidate.role, candidate.resumeUrl);

    const updated = await Candidate.findByIdAndUpdate(
      req.params.id,
      { aiSummary: summary, matchScore },
      { new: true }
    );

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'AI analysis failed.' });
  }
};

/**
 * Get all candidates.
 * GET /api/candidates
 */
export const getCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: candidates, count: candidates.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch candidates.' });
  }
};

/**
 * Upload a resume for a candidate.
 * POST /api/candidates/:id/resume
 */
export const uploadResume = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const resumeUrl = `/uploads/${req.file.filename}`;

    const updated = await Candidate.findByIdAndUpdate(
      req.params.id,
      { resumeUrl },
      { new: true }
    );

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to upload resume.' });
  }
};

/**
 * Delete a candidate.
 * DELETE /api/candidates/:id
 */
export const deleteCandidate = async (req, res) => {
  console.log('Incoming Request Params:', req.params);
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }
    res.status(200).json({ success: true, message: 'Candidate deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to delete candidate.' });
  }
};

/**
 * Update a candidate's status.
 * PATCH /api/candidates/:id/status
 */
export const updateCandidateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Applied', 'Interviewing', 'Hired', 'Rejected'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const updated = await Candidate.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update status.' });
  }
};
