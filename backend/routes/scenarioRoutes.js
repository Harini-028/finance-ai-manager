import express from 'express';
import {
  calculateScenario,
  getScenarios,
  createScenario,
  updateScenario,
  deleteScenario,
} from '../controllers/scenarioController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/calculate', calculateScenario);

router.route('/')
  .get(getScenarios)
  .post(createScenario);

router.route('/:id')
  .put(updateScenario)
  .delete(deleteScenario);

export default router;
