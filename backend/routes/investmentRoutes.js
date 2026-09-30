import express from 'express';
import {
  getInvestments,
  addInvestment,
  updateInvestment,
  deleteInvestment,
} from '../controllers/investmentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getInvestments)
  .post(addInvestment);

router.route('/:id')
  .put(updateInvestment)
  .delete(deleteInvestment);

export default router;
