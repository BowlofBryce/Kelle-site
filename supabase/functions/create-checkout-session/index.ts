import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14.11.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeSecretKey || stripeSecretKey === 'your_stripe_secret_key_here') {
      return new Response(
        JSON.stringify({
          error: 'Stripe is not configured. Please add your Stripe Secret Key to environment variables.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20',
    });

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { items, customerEmail } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Cart is empty' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let subtotalCents = 0;

    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', item.productId)
        .single();

      if (!product) {
        return new Response(
          JSON.stringify({ error: `Product ${item.productId} not found` }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      let price = product.price_cents;
      let variantName = null;

      if (item.variantId) {
        const { data: variant } = await supabase
          .from('variants')
          .select('*')
          .eq('id', item.variantId)
          .single();

        if (variant) {
          price = variant.price_cents;
          variantName = variant.name;
        }
      }

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: variantName ? `${product.name} - ${variantName}` : product.name,
            description: product.description || undefined,
            images: product.thumbnail_url ? [product.thumbnail_url] : [],
          },
          unit_amount: price,
        },
        quantity: item.quantity,
      });

      subtotalCents += price * item.quantity;
    }

    const shippingCents = subtotalCents >= 5000 ? 0 : 500;
    const taxCents = Math.round(subtotalCents * 0.08);
    const totalCents = subtotalCents + shippingCents + taxCents;

    if (shippingCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Shipping' },
          unit_amount: shippingCents,
        },
        quantity: 1,
      });
    }

    if (taxCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Estimated Tax' },
          unit_amount: taxCents,
        },
        quantity: 1,
      });
    }

    const origin = req.headers.get('origin') || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      customer_email: customerEmail,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU'],
      },
      metadata: {
        cart_items: JSON.stringify(items),
      },
    });

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        stripe_session_id: session.id,
        stripe_payment_id: session.payment_intent as string || null,
        status: 'pending',
        email: customerEmail || 'guest@velvethollow.com',
        subtotal_cents: subtotalCents,
        shipping_cents: shippingCents,
        tax_cents: taxCents,
        total_cents: totalCents,
        currency: 'usd',
        fulfillment_status: 'pending',
        metadata: {
          items: items,
          session_url: session.url,
        },
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Failed to create order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const orderItems = [];
    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', item.productId)
        .single();

      if (!product) continue;

      let price = product.price_cents;
      let variantName = null;

      if (item.variantId) {
        const { data: variant } = await supabase
          .from('variants')
          .select('*')
          .eq('id', item.variantId)
          .single();

        if (variant) {
          price = variant.price_cents;
          variantName = variant.name;
        }
      }

      orderItems.push({
        order_id: order.id,
        product_id: item.productId,
        variant_id: item.variantId || null,
        name: variantName ? `${product.name} - ${variantName}` : product.name,
        quantity: item.quantity,
        price_cents: price,
      });
    }

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Failed to create order items:', itemsError);
    }

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
        orderId: order?.id,
        totals: {
          subtotal_cents: subtotalCents,
          shipping_cents: shippingCents,
          tax_cents: taxCents,
          total_cents: totalCents,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to create checkout session',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});