import express from 'express';
import { generateFinancialAnalysis, handleChatQuery } from '../services/aiService.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/analysis', protect, async (req, res, next) => {
  try {
    const analysis = await generateFinancialAnalysis(req.user._id);
    return res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/chat', protect, async (req, res, next) => {
  try {
    const { prompt } = req.body;
    const result = await handleChatQuery(req.user._id, prompt);
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

