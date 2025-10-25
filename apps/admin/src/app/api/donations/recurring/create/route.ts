import { NextRequest, NextResponse } from 'next/server';
import { createRecurringDonation, createOrRetrieveCustomer } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount,
      interval = 'month',
      intervalCount = 1,
      contactId,
      fundDesignation = 'General',
      donorEmail,
      donorName,
    } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    if (!donorEmail) {
      return NextResponse.json(
        { error: 'Email is required for recurring donations' },
        { status: 400 }
      );
    }

    if (!['month', 'year'].includes(interval)) {
      return NextResponse.json(
        { error: 'Invalid interval. Must be "month" or "year"' },
        { status: 400 }
      );
    }

    // Create or retrieve Stripe customer
    const customerResult = await createOrRetrieveCustomer({
      email: donorEmail,
      name: donorName,
      contactId,
    });

    if (!customerResult.success || !customerResult.customer) {
      return NextResponse.json(
        { error: customerResult.error || 'Failed to create customer' },
        { status: 500 }
      );
    }

    // Create recurring donation subscription
    const result = await createRecurringDonation({
      customerId: customerResult.customer.id,
      amount,
      interval,
      intervalCount,
      contactId,
      fundDesignation,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscriptionId: result.subscription?.id,
      priceId: result.priceId,
      status: result.subscription?.status,
      nextPaymentDate: result.subscription?.current_period_end,
    });

  } catch (error) {
    console.error('Error creating recurring donation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 