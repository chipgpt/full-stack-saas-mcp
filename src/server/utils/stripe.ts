import Stripe from 'stripe';
import { CONFIG } from '../config';
import { Resource } from 'sst';

const stripe = new Stripe(Resource.MyStripePlans.apiKey);

/**
 * Create a checkout session for a customer to create a subscription
 */
export async function createCheckoutSession(
  stripeCustomerId: string,
  priceId: string,
  coupon?: string,
  userId?: string | null
) {
  const session = await stripe.checkout.sessions.create({
    client_reference_id: userId || undefined,
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    currency: 'usd',
    cancel_url: `${CONFIG.website}/dashboard`,
    success_url: `${CONFIG.website}/webhook/stripe?checkoutSessionId={CHECKOUT_SESSION_ID}`,
    discounts: coupon
      ? [
          {
            coupon: coupon,
          },
        ]
      : undefined,
  });
  return session;
}

/**
 * Get a checkout session by its ID
 */
export async function getCheckoutSession(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['customer', 'subscription'],
  });
  return session;
}

/**
 * Create a management session for a customer to manage their existing subscription
 */
export async function createManagementSession(customerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${CONFIG.website}/dashboard`,
  });
  return session;
}

/**
 * Create a customer in Stripe
 */
export async function createCustomer(user: { id: string; email?: string | null }) {
  const customer = await stripe.customers.create({
    email: user.email || undefined,
  });
  return customer;
}

/**
 * Get a customer by their ID
 */
export async function getCustomer(id: string) {
  const customer = await stripe.customers.retrieve(id);
  return customer;
}

/**
 * Get a customer's subscriptions
 */
export async function getSubscriptions(customerId: string, all = false) {
  const subscription = await stripe.subscriptions.list({
    customer: customerId,
    status: all ? 'all' : 'active',
  });
  return subscription.data;
}
