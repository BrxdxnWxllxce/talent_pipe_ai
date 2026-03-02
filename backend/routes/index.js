import { Router } from 'express';
import healthRoutes from './health.js';
import candidateRoutes from './candidateRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/candidates', candidateRoutes);

export default router;
