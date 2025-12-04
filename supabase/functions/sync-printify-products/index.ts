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

    console.log(`📦 Found ${printifyProducts.data?.length || 0} products from Printify`);

    const fetchProductDetails = async (product: any) => {
      try {
        const detailResponse = await fetch(
          `https://api.printify.com/v1/shops/${printifyShopId}/products/${product.id}.json`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${printifyToken}`,
            },
          }
        );

        if (!detailResponse.ok) {
          console.error(`❌ Failed to fetch details for product ${product.id}`);
          return null;
        }

        return await detailResponse.json();
      } catch (error) {
        console.error(`❌ Error fetching product ${product.id}:`, error);
        return null;
      }
    };

    console.log(`🚀 Fetching product details in parallel...`);
    const detailsPromises = (printifyProducts.data || []).map(fetchProductDetails);
    const allDetails = await Promise.all(detailsPromises);

    console.log(`✅ Fetched all product details`);

    for (let i = 0; i < allDetails.length; i++) {
      const details = allDetails[i];
      const product = printifyProducts.data[i];

      if (!details) {
        continue;
      }

      console.log(`\n🔄 Processing: ${details.title}`);

      const thumbnail = details.images?.[0]?.src || '';
      const images = details.images?.map((img: any) => img.src) || [];
      const priceInCents = details.variants?.[0]?.price || 2999;

      const slug = details.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const { data: upsertedProduct, error: upsertError } = await supabase
        .from('products')
        .upsert(
          {
            printify_id: product.id,
            name: details.title,
            slug: slug,
            description: details.description || '',
            price_cents: priceInCents,
            thumbnail_url: thumbnail,
            images: images,
            active: details.visible,
            featured: false,
            category: 'merch',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'printify_id' }
        )
        .select()
        .single();

      if (upsertError || !upsertedProduct) {
        console.error(`   ❌ Upsert error:`, upsertError);
        continue;
      }

      console.log(`   ✅ Synced product: ${upsertedProduct.id}`);
      syncedProducts.push({ id: upsertedProduct.id, printify_id: product.id });

      const currentProductId = upsertedProduct.id;

      if (details.variants && details.variants.length > 0) {
        console.log(`   🎨 Batch upserting ${details.variants.length} variants`);

        const colorImageMap = new Map<string, string>();

        if (details.images && details.images.length > 0) {
          for (const img of details.images) {
            if (img.variant_ids && img.variant_ids.length > 0) {
              for (const variantId of img.variant_ids) {
                if (!colorImageMap.has(variantId.toString())) {
                  colorImageMap.set(variantId.toString(), img.src);
                }
              }
            }
          }
        }

        const variantsToUpsert = details.variants.map((variant: any) => {
          const previewUrl = colorImageMap.get(variant.id.toString()) || images[0] || thumbnail;

          return {
            product_id: currentProductId,
            printify_variant_id: variant.id.toString(),
            name: variant.title || 'Default',
            price_cents: variant.price,
            available: variant.is_available,
            preview_url: previewUrl,
          };
        });

        const { error: variantsUpsertError } = await supabase
          .from('variants')
          .upsert(variantsToUpsert, { onConflict: 'printify_variant_id' });

        if (variantsUpsertError) {
          console.error(`   ❌ Variants upsert error:`, variantsUpsertError);
        } else {
          console.log(`   ✅ Synced ${variantsToUpsert.length} variants`);
        }
      }
    }

    console.log(`\n✅ Sync complete! Processed ${syncedProducts.length} products`);

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