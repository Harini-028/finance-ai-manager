import express from 'express';
import { generateFinancialAnalysis, handleFinancialCoachQuery } from '../services/aiService.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get complete financial analysis
// @route   GET /api/ai/analysis
// @access  Private
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

// @desc    AI Financial Coach chat endpoint with calculations & assumptions
// @route   POST /api/ai/coach
// @access  Private
router.post('/coach', protect, async (req, res, next) => {
  try {
    const { prompt, query } = req.body;
    const userPrompt = prompt || query || '';
    const result = await handleFinancialCoachQuery(req.user._id, userPrompt);
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Legacy chat endpoint for backward compatibility
// @route   POST /api/ai/chat
// @access  Private
router.post('/chat', protect, async (req, res, next) => {
  try {
    const { prompt, query } = req.body;
    const userPrompt = prompt || query || '';
    const result = await handleFinancialCoachQuery(req.user._id, userPrompt);
    return res.json({
      success: true,
      data: {
        reply: result.reply,
        calculation: result.calculation,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
