import express from 'express';
import {
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
} from '../controllers/recurringController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getRecurringTransactions)
  .post(createRecurringTransaction);

router.route('/:id')
  .put(updateRecurringTransaction)
  .delete(deleteRecurringTransaction);

export default router;
