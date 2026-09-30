import express from 'express';
import {
  createSavingsGoal,
  getSavingsGoals,
  updateSavingsGoal,
  addSavingsAmount,
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

export default router;
