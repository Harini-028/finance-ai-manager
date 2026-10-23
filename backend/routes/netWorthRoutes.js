import express from 'express';
import {
  getNetWorthSummary,
  createNetWorthItem,
  updateNetWorthItem,
  deleteNetWorthItem,
  recordNetWorthSnapshot,
} from '../controllers/netWorthController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getNetWorthSummary);
router.post('/items', createNetWorthItem);
router.put('/items/:id', updateNetWorthItem);
router.delete('/items/:id', deleteNetWorthItem);
router.post('/snapshots', recordNetWorthSnapshot);

export default router;
