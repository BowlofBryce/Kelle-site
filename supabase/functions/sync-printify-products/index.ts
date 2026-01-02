import { createClient } from 'npm:@supabase/supabase-js@2';
import { PrintifyClient } from '../_shared/printifyClient.ts';

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
    const printify = new PrintifyClient(printifyToken, printifyShopId);
    const debugLog = true;

    console.log('Starting Printify product sync...');
    console.log(`Shop ID: ${printifyShopId}`);

    const productList = await printify.getProductsPaginated();
    console.log(`Found ${productList.length} products from Printify`);

    const syncedProducts: { id: string; printify_id: string }[] = [];
    const pendingImages: string[] = [];

    for (const productSummary of productList) {
      try {
        console.log(`Processing: ${productSummary.title} (${productSummary.id})`);

        const details = await printify.getProduct(productSummary.id);
        if (debugLog) {
          console.log(
            'Printify product snapshot:',
            JSON.stringify(
              {
                id: details.id,
                title: details.title,
                visible: details.visible,
                is_locked: details.is_locked,
                blueprint_id: details.blueprint_id,
                variant_count: details.variants?.length ?? 0,
              },
              null,
              2
            )
          );
        }

        if (!details.images || details.images.length === 0) {
          console.warn(`Product ${productSummary.id} has no images yet; will retry on next sync`);
          pendingImages.push(productSummary.id);
          continue;
        }

        const thumbnail = details.images?.[0]?.src || '';
        const images = details.images?.map(img => img.src) || [];

        const enabledVariants = details.variants.filter(v => v.is_enabled && v.is_available);

        if (enabledVariants.length === 0) {
          console.log(`No enabled/available variants, skipping product ${productSummary.id}`);
          continue;
        }

        const priceInCents = enabledVariants[0]?.price || 2999;

        const slug = details.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

        // Preserve local flags if product already exists
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id, active, featured, publish_state')
          .eq('printify_id', productSummary.id)
          .maybeSingle();

        const resolvedActive = existingProduct?.active ?? true;
        const resolvedFeatured = existingProduct?.featured ?? false;
        const resolvedPublishState = existingProduct?.publish_state ?? 'published';

        const { data: upsertedProduct, error: upsertError } = await supabase
          .from('products')
          .upsert(
            {
              printify_id: productSummary.id,
              printify_shop_id: details.shop_id?.toString?.() || printifyShopId,
              name: details.title,
              slug,
              description: details.description || '',
              price_cents: priceInCents,
              thumbnail_url: thumbnail,
              images,
              active: resolvedActive,
              featured: resolvedFeatured,
              publish_state: resolvedPublishState,
              category: 'merch',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'printify_id' }
          )
          .select()
          .single();

        if (upsertError || !upsertedProduct) {
          console.error(`Upsert error for ${productSummary.id}:`, upsertError);
          continue;
        }

        syncedProducts.push({ id: upsertedProduct.id, printify_id: productSummary.id });

        const variantsToUpsert = enabledVariants.map(variant => {
          const previewUrl = printify.getVariantImage(variant, details.images);
          const { size, color, optionValues } = printify.parseVariantName(variant, details.options);

          return {
            product_id: upsertedProduct.id,
            printify_variant_id: variant.id.toString(),
            name: `${size} / ${color}`,
            size,
            color,
            option_values: optionValues,
            sku: variant.sku || `${productSummary.id}-${variant.id}`,
            price_cents: variant.price,
            available: true,
            stock: 100,
            preview_url: previewUrl || thumbnail,
          };
        });

        const { error: variantsUpsertError } = await supabase
          .from('variants')
          .upsert(variantsToUpsert, { onConflict: 'printify_variant_id' });

        if (variantsUpsertError) {
          console.error(`Variants upsert error for ${productSummary.id}:`, variantsUpsertError);
        }

        // Remove stale variants that no longer exist / are no longer enabled
        const syncedVariantIds = enabledVariants.map(v => v.id.toString());
        const { data: existingVariants } = await supabase
          .from('variants')
          .select('id, printify_variant_id')
          .eq('product_id', upsertedProduct.id);

        if (existingVariants) {
          const staleVariants = existingVariants.filter(
            ev => ev.printify_variant_id && !syncedVariantIds.includes(ev.printify_variant_id)
          );

          if (staleVariants.length > 0) {
            const staleIds = staleVariants.map(v => v.id);
            await supabase.from('variants').delete().in('id', staleIds);
            console.log(`Deleted ${staleVariants.length} stale variants for ${productSummary.id}`);
          }
        }
      } catch (error) {
        console.error(`Error processing product ${productSummary.id}:`, error);
        // IMPORTANT: Do NOT call publishing_failed / publishing_succeeded here.
        continue;
      }
    }

    console.log(`Sync complete! Synced ${syncedProducts.length} products`);

    return new Response(
      JSON.stringify({
        success: true,
        synced: syncedProducts.length,
        products: syncedProducts,
        pendingImages,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (e) {
    console.error('Sync failed:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
