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

    const printifyResponse = await fetch(
      `https://api.printify.com/v1/shops/${printifyShopId}/products.json`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${printifyToken}`,
        },
      }
    );

    if (!printifyResponse.ok) {
      const errorText = await printifyResponse.text();
      return new Response(
        JSON.stringify({ error: 'Failed to fetch Printify products', details: errorText }),
        {
          status: printifyResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const printifyProducts = await printifyResponse.json();
    const syncedProducts = [];

    for (const product of printifyProducts.data || []) {
      const detailResponse = await fetch(
        `https://api.printify.com/v1/shops/${printifyShopId}/products/${product.id}.json`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${printifyToken}`,
          },
        }
      );

      if (!detailResponse.ok) continue;

      const details = await detailResponse.json();

      const thumbnail = details.images?.[0]?.src || '';
      const priceInCents = details.variants?.[0]?.price ? Math.round(details.variants[0].price * 100) : 2999;

      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('printify_id', product.id)
        .maybeSingle();

      if (existingProduct) {
        const { error: updateError } = await supabase
          .from('products')
          .update({
            name: details.title,
            description: details.description || '',
            price_cents: priceInCents,
            thumbnail_url: thumbnail,
            active: details.visible,
            updated_at: new Date().toISOString(),
          })
          .eq('printify_id', product.id);

        if (!updateError) {
          syncedProducts.push({ id: existingProduct.id, action: 'updated', printify_id: product.id });
        }
      } else {
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert({
            printify_id: product.id,
            name: details.title,
            description: details.description || '',
            price_cents: priceInCents,
            thumbnail_url: thumbnail,
            active: details.visible,
            featured: false,
            category: 'merch',
          })
          .select()
          .single();

        if (!insertError && newProduct) {
          syncedProducts.push({ id: newProduct.id, action: 'created', printify_id: product.id });
        }
      }

      if (details.variants && details.variants.length > 0) {
        for (const variant of details.variants) {
          const { data: existingVariant } = await supabase
            .from('variants')
            .select('id')
            .eq('printify_variant_id', variant.id.toString())
            .maybeSingle();

          const variantData = {
            product_id: existingProduct?.id,
            printify_variant_id: variant.id.toString(),
            name: variant.title || 'Default',
            price_cents: Math.round(variant.price * 100),
            available: variant.is_available,
          };

          if (existingVariant) {
            await supabase
              .from('variants')
              .update(variantData)
              .eq('printify_variant_id', variant.id.toString());
          } else if (existingProduct) {
            await supabase.from('variants').insert(variantData);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: syncedProducts.length,
        products: syncedProducts,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error syncing Printify products:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to sync Printify products',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});