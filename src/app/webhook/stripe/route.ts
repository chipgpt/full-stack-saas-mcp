import { handleRequest } from '@/lib/handle-request';
import { CONFIG } from '@/server/config';
import { User } from '@/server/models/user';
import { getCheckoutSession } from '@/server/utils/stripe';
import { Resource } from 'sst';
import { NextResponse } from 'next/server';
import stripe from 'stripe';

/**
 * Handles the Stripe callback for checkout sessions.
 * Updates the user's plan based on the completed checkout session.
 */
export const GET = handleRequest(async req => {
  const checkoutSessionId = req.nextUrl.searchParams.get('checkoutSessionId');
  if (checkoutSessionId) {
    const session = await getCheckoutSession(checkoutSessionId);
    if (
      session.status === 'complete' &&
      session.customer &&
      typeof session.customer !== 'string' &&
      !session.customer.deleted &&
      session.client_reference_id &&
      session.subscription &&
      typeof session.subscription !== 'string'
    ) {
      const user = await User.findOne({
        where: { stripeCustomerId: session.customer.id },
      });
      if (user) {
        if (!user.email) {
          await user.update({ email: session.customer.email }, { fields: ['email'] });
        }
        const priceId = session.subscription.items.data.find(Boolean)?.price?.id;
        if (priceId) {
          await updateUserPlan(user, priceId);
        }
      }
    }
  }
  return NextResponse.redirect(`${CONFIG.website}/dashboard`);
});

/**
 * Handles the Stripe webhook for subscription updates.
 */
export const POST = handleRequest(async req => {
  const event = stripe.webhooks.constructEvent(
    await req.text(),
    req.headers.get('stripe-signature') || '',
    Resource.MyStripePlans.webhookSecret
  );

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const subscription = event.data.object;
    const user = await User.findOne({ where: { stripeCustomerId: subscription.customer } });

    if (user) {
      // Update the user's plan when the subscription is created or updated.
      if (
        event.type === 'customer.subscription.created' ||
        event.type === 'customer.subscription.updated'
      ) {
        const priceId = subscription.items.data.find(Boolean)?.price?.id;
        if (priceId) {
          await updateUserPlan(user, priceId);
        }
      }
      // Set the user's plan to null when the subscription is deleted.
      else {
        user.plan = null;
        await user.save({ fields: ['plan'] });
      }
    }
  }

  return NextResponse.json({});
});

/**
 * Updates the user's plan based on the price ID.
 */
async function updateUserPlan(user: User, priceId: string) {
  if (priceId === Resource.MyStripePlans.plans.starter) {
    user.plan = 'starter';
    await user.save({ fields: ['plan'] });
  } else {
    console.error('Unknown plan:', priceId);
  }
}
