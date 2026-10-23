import express from 'express';
import {
  uploadAndScanReceipt,
  getReceipts,
  getReceiptFile,
  confirmReceiptExpense,
  deleteReceipt,
} from '../controllers/receiptController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/upload', uploadAndScanReceipt);
router.get('/', getReceipts);
router.get('/:id/file', getReceiptFile);
router.post('/:id/confirm', confirmReceiptExpense);
router.delete('/:id', deleteReceipt);

export default router;
