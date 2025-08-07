import { auth } from '@/auth';
import { handleRequest } from '@/lib/handle-request';
import { User } from '@/server/models/user';
import {
  createCheckoutSession,
  createCustomer,
  createManagementSession,
  getSubscriptions,
} from '@/server/utils/stripe';
import { NextResponse } from 'next/server';
import { Resource } from 'sst';

const isValidStripePlan = (
  plan: string | null
): plan is keyof typeof Resource.MyStripePlans.plans => {
  return !!plan && plan in Resource.MyStripePlans.plans;
};

const isValidStripeCoupon = (
  plan: string | null
): plan is keyof typeof Resource.MyStripePlans.coupons => {
  return !!plan && plan in Resource.MyStripePlans.coupons;
};

/**
 * Redirects to the Stripe checkout page or billing portal depending on the customer's current plan.
 */
export const GET = handleRequest(async req => {
  let priceId = '';
  let coupon = '';

  const plan = req.nextUrl.searchParams.get('plan') || 'starter';
  if (isValidStripePlan(plan)) {
    priceId = Resource.MyStripePlans.plans[plan];
  }
  if (isValidStripeCoupon(plan)) {
    coupon = Resource.MyStripePlans.coupons[plan];
  }

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  // Create a Stripe customer if the user doesn't have one
  if (!session.user.stripeCustomerId) {
    const customer = await createCustomer(session.user);
    await User.update(
      { stripeCustomerId: customer.id },
      { where: { id: session.user.id }, fields: ['stripeCustomerId'] }
    );
    session.user.stripeCustomerId = customer.id;
  }

  // Check if the user has ever had a subscription
  const subscriptions = await getSubscriptions(session.user.stripeCustomerId, true);
  if (subscriptions.length > 0) {
    // If the user has a previous subscription, they cannot use a coupon again
    coupon = '';
  }

  // If the user has a plan, redirect to the billing portal
  if (session.user.plan) {
    const managementSession = await createManagementSession(session.user.stripeCustomerId);
    return NextResponse.redirect(managementSession.url);
  }
  // If the user doesn't have a plan, create a checkout session
  else if (session.user.stripeCustomerId) {
    const checkoutSession = await createCheckoutSession(
      session.user.stripeCustomerId,
      priceId,
      coupon,
      session.user.id
    );
    if (checkoutSession.url) {
      return NextResponse.redirect(checkoutSession.url);
    }
  }

  return NextResponse.json({ error: 'Unable to access billing at this time' }, { status: 400 });
});
