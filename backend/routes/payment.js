const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createCheckoutSession,
  handleWebhook,
  cancelSubscription,
} = require('../controllers/paymentController');

// Webhook uses raw body - must be before protect middleware
router.post('/webhook', handleWebhook);

router.use(protect);
router.post('/create-checkout-session', createCheckoutSession);
router.post('/cancel-subscription', cancelSubscription);

module.exports = router;
