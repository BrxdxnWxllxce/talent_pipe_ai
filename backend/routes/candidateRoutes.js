import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { createCandidate, getCandidates, analyzeCandidate, uploadResume, deleteCandidate, updateCandidateStatus } from '../controllers/candidateController.js';

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const router = Router();

router.route('/').get(getCandidates).post(createCandidate);
router.delete('/:id', deleteCandidate);
router.put('/:id/analyze', analyzeCandidate);
router.patch('/:id/status', updateCandidateStatus);
router.post('/:id/resume', upload.single('resume'), uploadResume);

export default router;
