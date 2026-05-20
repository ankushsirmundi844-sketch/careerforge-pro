const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

// POST /api/payment/create-checkout-session
exports.createCheckoutSession = async (req, res) => {
  try {
    const user = req.user;

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user._id.toString() },
      });
      customerId = customer.id;
      await User.findByIdAndUpdate(user._id, { stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.CLIENT_URL}/pricing?cancelled=true`,
      metadata: { userId: user._id.toString() },
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/payment/webhook  (raw body)
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata.userId;
      await User.findByIdAndUpdate(userId, {
        plan: 'pro',
        stripeSubscriptionId: session.subscription,
      });
      console.log(`User ${userId} upgraded to Pro`);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      await User.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        { plan: 'free', stripeSubscriptionId: null }
      );
      break;
    }
    default:
      console.log(`Unhandled event: ${event.type}`);
  }

  res.json({ received: true });
};

// POST /api/payment/cancel-subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const user = req.user;
    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }
    await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    res.json({ message: 'Subscription cancelled. Access valid until end of billing period.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
