import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const printifyToken = Deno.env.get('PRINTIFY_API_TOKEN');
    const printifyShopId = Deno.env.get('PRINTIFY_SHOP_ID');

    if (
      !printifyToken ||
      !printifyShopId ||
      printifyToken === 'your_printify_api_token_here' ||
      printifyShopId === 'your_printify_shop_id_here'
    ) {
      return new Response(
        JSON.stringify({
          error: 'Printify is not configured. Add PRINTIFY_API_TOKEN and PRINTIFY_SHOP_ID to environment variables.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!order.shipping_address) {
      return new Response(
        JSON.stringify({ error: 'Shipping address not found' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const address = order.shipping_address as any;
    const lineItems = [];

    for (const item of order.order_items || []) {
      const { data: product } = await supabase
        .from('products')
        .select('printify_id')
        .eq('id', item.product_id)
        .single();

      let printifyVariantId = null;
      if (item.variant_id) {
        const { data: variant } = await supabase
          .from('variants')
          .select('printify_variant_id')
          .eq('id', item.variant_id)
          .single();
        printifyVariantId = variant?.printify_variant_id;
      }

      if (!product?.printify_id) {
        console.warn(`Product ${item.product_id} has no Printify ID, skipping`);
        continue;
      }

      lineItems.push({
        product_id: product.printify_id,
        variant_id: printifyVariantId ? parseInt(printifyVariantId) : undefined,
        quantity: item.quantity,
      });
    }

    if (lineItems.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No items with Printify IDs found' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const printifyOrderData = {
      external_id: order.id,
      label: `The Velvet Hollow - Order ${order.id.slice(0, 8)}`,
      line_items: lineItems,
      shipping_method: 1,
      send_shipping_notification: true,
      address_to: {
        first_name: order.customer_name?.split(' ')[0] || 'Customer',
        last_name: order.customer_name?.split(' ').slice(1).join(' ') || '',
        email: order.email,
        phone: order.customer_phone || '',
        country: address.country || 'US',
        region: address.state || '',
        address1: address.line1 || '',
        address2: address.line2 || '',
        city: address.city || '',
        zip: address.postal_code || '',
      },
    };

    const printifyResponse = await fetch(
      `https://api.printify.com/v1/shops/${printifyShopId}/orders.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${printifyToken}`,
        },
        body: JSON.stringify(printifyOrderData),
      }
    );

    if (!printifyResponse.ok) {
      const errorText = await printifyResponse.text();
      console.error('Printify API error:', errorText);

      await supabase
        .from('orders')
        .update({
          fulfillment_status: 'failed',
          metadata: {
            ...order.metadata,
            printify_error: errorText,
            printify_request: printifyOrderData,
          },
        })
        .eq('id', orderId);

      return new Response(
        JSON.stringify({ error: 'Failed to create Printify order', details: errorText }),
        {
          status: printifyResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const printifyOrder = await printifyResponse.json();

    await supabase
      .from('orders')
      .update({
        printify_order_id: printifyOrder.id,
        fulfillment_status: 'processing',
        metadata: {
          ...order.metadata,
          printify_order: printifyOrder,
        },
      })
      .eq('id', orderId);

    return new Response(
      JSON.stringify({
        success: true,
        printifyOrderId: printifyOrder.id,
        orderId: order.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating Printify order:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to create Printify order',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});