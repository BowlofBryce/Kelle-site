import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const COUNTRY_CODE_MAP: Record<string, string> = {
  'United States': 'US',
  'Canada': 'CA',
  'United Kingdom': 'GB',
  'Australia': 'AU',
  'Germany': 'DE',
  'France': 'FR',
  'Italy': 'IT',
  'Spain': 'ES',
  'Netherlands': 'NL',
  'Belgium': 'BE',
  'Austria': 'AT',
  'Switzerland': 'CH',
  'Sweden': 'SE',
  'Denmark': 'DK',
  'Norway': 'NO',
  'Finland': 'FI',
  'Poland': 'PL',
  'Ireland': 'IE',
  'Portugal': 'PT',
  'Greece': 'GR',
  'Czech Republic': 'CZ',
  'New Zealand': 'NZ',
  'Singapore': 'SG',
  'Japan': 'JP',
  'Mexico': 'MX',
  'Brazil': 'BR',
};

function getCountryCode(country: string | undefined): string {
  if (!country) return 'US';

  if (country.length === 2) {
    return country.toUpperCase();
  }

  return COUNTRY_CODE_MAP[country] || country.toUpperCase().slice(0, 2);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  let orderId: string | null = null;

  try {
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

    const body = await req.json();
    orderId = body.orderId;

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
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('printify_id')
        .eq('id', item.product_id)
        .maybeSingle();

      if (productError) {
        console.error(`Error fetching product ${item.product_id}:`, productError);
        continue;
      }

      if (!product?.printify_id) {
        console.warn(`Product ${item.product_id} has no Printify ID, skipping`);
        continue;
      }

      let printifyVariantId = null;
      if (item.variant_id) {
        const { data: variant, error: variantError } = await supabase
          .from('variants')
          .select('printify_variant_id')
          .eq('id', item.variant_id)
          .maybeSingle();

        if (variantError) {
          console.error(`Error fetching variant ${item.variant_id}:`, variantError);
        }

        printifyVariantId = variant?.printify_variant_id;

        if (!printifyVariantId) {
          console.error(`Variant ${item.variant_id} has no Printify variant ID`);
          throw new Error(`Missing Printify variant ID for variant ${item.variant_id}`);
        }
      }

      const lineItem: any = {
        product_id: product.printify_id,
        quantity: item.quantity,
      };

      if (printifyVariantId) {
        lineItem.variant_id = parseInt(printifyVariantId);
      }

      lineItems.push(lineItem);
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

    const nameParts = order.customer_name?.split(' ') || [];
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    const countryCode = getCountryCode(address.country);
    const region = address.state || address.region || '';
    const address1 = address.line1 || address.address1 || '';
    const city = address.city || '';
    const zip = address.postal_code || address.zip || '';

    if (!order.email) {
      throw new Error('Customer email is required');
    }

    if (!address1 || !city || !zip) {
      const missing = [];
      if (!address1) missing.push('street address');
      if (!city) missing.push('city');
      if (!zip) missing.push('postal code');
      throw new Error(`Missing required address fields: ${missing.join(', ')}`);
    }

    const printifyOrderData = {
      external_id: order.id,
      label: `Order ${order.id.slice(0, 8)}`,
      line_items: lineItems,
      shipping_method: 1,
      send_shipping_notification: true,
      address_to: {
        first_name: firstName,
        last_name: lastName,
        email: order.email,
        phone: order.customer_phone || '',
        country: countryCode,
        region: region,
        address1: address1,
        address2: address.line2 || address.address2 || '',
        city: city,
        zip: zip,
      },
    };

    console.log('=== CREATING PRINTIFY ORDER ===');
    console.log('Order ID:', order.id);
    console.log('External ID:', printifyOrderData.external_id);
    console.log('Line items count:', lineItems.length);
    console.log('Line items:', JSON.stringify(lineItems, null, 2));
    console.log('Shipping address:');
    console.log('  Name:', `${firstName} ${lastName}`);
    console.log('  Email:', order.email);
    console.log('  Phone:', order.customer_phone || '(none)');
    console.log('  Country:', countryCode);
    console.log('  Address:', address1);
    console.log('  City/State/Zip:', `${city}, ${region} ${zip}`);

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
      console.error('❌ PRINTIFY ORDER CREATION FAILED');
      console.error(`Status: ${printifyResponse.status}`);
      console.error(`Response: ${errorText}`);
      console.error(`Order ID: ${orderId}`);

      await supabase
        .from('orders')
        .update({
          fulfillment_status: 'failed',
          metadata: {
            ...order.metadata,
            printify_error: errorText,
            printify_request: printifyOrderData,
            printify_error_status: printifyResponse.status,
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
    console.log('✅ Printify order created successfully:', printifyOrder.id);

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

    if (orderId) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        await supabase
          .from('orders')
          .update({
            fulfillment_status: 'failed',
            metadata: {
              error_type: 'validation_error',
              error_message: error.message,
              error_timestamp: new Date().toISOString(),
            },
          })
          .eq('id', orderId);
      } catch (dbError) {
        console.error('Failed to update order status:', dbError);
      }
    }

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