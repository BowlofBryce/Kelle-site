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

    for (const product of printifyProducts.data || []) {
      console.log(`\n🔄 Processing Printify product: ${product.id}`);

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
        continue;
      }

      const details = await detailResponse.json();
      console.log(`   Title: ${details.title}`);

      const thumbnail = details.images?.[0]?.src || '';
      const images = details.images?.map((img: any) => img.src) || [];
      const priceInCents = details.variants?.[0]?.price || 2999;

      const slug = details.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('printify_id', product.id)
        .maybeSingle();

      let currentProductId: string;

      if (existingProduct) {
        console.log(`   ✏️  Updating existing product: ${existingProduct.id}`);

        const { error: updateError } = await supabase
          .from('products')
          .update({
            name: details.title,
            slug: slug,
            description: details.description || '',
            price_cents: priceInCents,
            thumbnail_url: thumbnail,
            images: images,
            active: details.visible,
            updated_at: new Date().toISOString(),
          })
          .eq('printify_id', product.id);

        if (updateError) {
          console.error(`   ❌ Update error:`, updateError);
        } else {
          console.log(`   ✅ Updated successfully`);
          syncedProducts.push({ id: existingProduct.id, action: 'updated', printify_id: product.id });
        }

        currentProductId = existingProduct.id;
      } else {
        console.log(`   ➕ Creating new product`);

        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert({
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
          })
          .select()
          .single();

        if (insertError) {
          console.error(`   ❌ Insert error:`, insertError);
          continue;
        }

        if (!newProduct) {
          console.error(`   ❌ No product returned after insert`);
          continue;
        }

        console.log(`   ✅ Created successfully: ${newProduct.id}`);
        syncedProducts.push({ id: newProduct.id, action: 'created', printify_id: product.id });
        currentProductId = newProduct.id;
      }

      if (details.variants && details.variants.length > 0) {
        console.log(`   🎨 Processing ${details.variants.length} variants`);

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

        for (const variant of details.variants) {
          const { data: existingVariant } = await supabase
            .from('variants')
            .select('id')
            .eq('printify_variant_id', variant.id.toString())
            .maybeSingle();

          const previewUrl = colorImageMap.get(variant.id.toString()) || images[0] || thumbnail;

          const variantData = {
            product_id: currentProductId,
            printify_variant_id: variant.id.toString(),
            name: variant.title || 'Default',
            price_cents: variant.price,
            available: variant.is_available,
            preview_url: previewUrl,
          };

          if (existingVariant) {
            const { error: variantUpdateError } = await supabase
              .from('variants')
              .update(variantData)
              .eq('printify_variant_id', variant.id.toString());

            if (variantUpdateError) {
              console.error(`      ❌ Variant update error:`, variantUpdateError);
            }
          } else {
            const { error: variantInsertError } = await supabase
              .from('variants')
              .insert(variantData);

            if (variantInsertError) {
              console.error(`      ❌ Variant insert error:`, variantInsertError);
            } else {
              console.log(`      ✅ Created variant: ${variant.title}`);
            }
          }
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