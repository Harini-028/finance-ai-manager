import express from 'express';
import {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  toggleSubscriptionStatus,
  logSubscriptionPaymentAsTransaction,
  deleteSubscription,
} from '../controllers/subscriptionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getSubscriptions)
  .post(createSubscription);

router.route('/:id')
  .put(updateSubscription)
  .delete(deleteSubscription);

router.patch('/:id/status', toggleSubscriptionStatus);
router.post('/:id/log-payment', logSubscriptionPaymentAsTransaction);

export default router;
