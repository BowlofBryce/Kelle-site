import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14.11.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, Stripe-Signature',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!stripeSecretKey || stripeSecretKey === 'your_stripe_secret_key_here') {
    console.error('Stripe secret key not configured');
    return new Response('Webhook handler not configured', { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-11-20.acacia',
  });

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event: Stripe.Event;

    if (webhookSecret && webhookSecret !== 'your_webhook_secret_here' && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
      }
    } else {
      event = JSON.parse(body);
      console.warn('Webhook signature verification skipped (no secret configured)');
    }

    await supabase.from('webhook_events').insert({
      event_type: event.type,
      event_id: event.id,
      payload: event as any,
      processed: false,
    });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('stripe_session_id', session.id)
        .single();

      if (!order) {
        console.error('Order not found for session:', session.id);
        return new Response('Order not found', { status: 404 });
      }

      const customerName = session.customer_details?.name || 'Guest';
      const customerEmail = session.customer_details?.email || order.email;
      const customerPhone = session.customer_details?.phone || null;
      const shippingAddress = session.shipping_details?.address || session.customer_details?.address;

      await supabase
        .from('orders')
        .update({
          status: 'paid',
          stripe_payment_id: session.payment_intent as string,
          customer_name: customerName,
          email: customerEmail,
          customer_phone: customerPhone,
          shipping_address: shippingAddress,
          fulfillment_status: 'processing',
        })
        .eq('id', order.id);

      const printifyToken = Deno.env.get('PRINTIFY_API_TOKEN');
      const printifyShopId = Deno.env.get('PRINTIFY_SHOP_ID');

      if (
        printifyToken &&
        printifyShopId &&
        printifyToken !== 'your_printify_api_token_here' &&
        printifyShopId !== 'your_printify_shop_id_here'
      ) {
        try {
          const functionUrl = `${supabaseUrl}/functions/v1/create-printify-order`;
          const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              orderId: order.id,
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            console.error('Failed to create Printify order:', error);
            await supabase
              .from('orders')
              .update({
                fulfillment_status: 'failed',
                metadata: {
                  ...order.metadata,
                  printify_error: error,
                },
              })
              .eq('id', order.id);
          }
        } catch (error) {
          console.error('Error calling Printify function:', error);
          await supabase
            .from('orders')
            .update({
              fulfillment_status: 'failed',
              metadata: {
                ...order.metadata,
                printify_error: error.message,
              },
            })
            .eq('id', order.id);
        }
      } else {
        console.log('Printify not configured, skipping fulfillment');
      }

      await supabase
        .from('webhook_events')
        .update({ processed: true })
        .eq('event_id', event.id);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook processing error:', error);

    if (error.event) {
      await supabase
        .from('webhook_events')
        .update({
          processed: true,
          error_message: error.message,
        })
        .eq('event_id', error.event.id);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});