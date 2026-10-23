import express from 'express';
import {
  createSavingsGoal,
  getSavingsGoals,
  updateSavingsGoal,
  addSavingsAmount,
  recordGoalTransaction,
  toggleGoalStatus,
  deleteSavingsGoal,
} from '../controllers/savingsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(createSavingsGoal)
  .get(getSavingsGoals);

router.route('/:id')
  .put(updateSavingsGoal)
  .delete(deleteSavingsGoal);

router.patch('/:id/add', addSavingsAmount);
router.post('/:id/transaction', recordGoalTransaction);
router.patch('/:id/status', toggleGoalStatus);

export default router;
