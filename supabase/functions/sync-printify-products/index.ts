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

    console.log('Starting Printify product sync...');

    const productList = await printify.getProductsPaginated();
    console.log(`Found ${productList.length} products from Printify (paginated)`);

    const syncedProducts: { id: string; printify_id: string }[] = [];
    const pendingImages: string[] = [];

    for (const productSummary of productList) {
      try {
        console.log(`Processing: ${productSummary.title}`);

        const details = await printify.getProduct(productSummary.id);

        if (!details.images || details.images.length === 0) {
          console.warn(`Product ${productSummary.id} has no images yet; will retry on next sync`);
          pendingImages.push(productSummary.id);
          continue;
        }

        const thumbnail = details.images?.[0]?.src || '';
        const images = details.images?.map(img => img.src) || [];

        const enabledVariants = details.variants.filter(
          v => v.is_enabled && v.is_available
        );

        if (enabledVariants.length === 0) {
          console.log(`No enabled variants, skipping product`);
          continue;
        }

        const priceInCents = enabledVariants[0]?.price || 2999;

        const slug = details.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

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
              slug: slug,
              description: details.description || '',
              price_cents: priceInCents,
              thumbnail_url: thumbnail,
              images: images,
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
          console.error(`Upsert error:`, upsertError);
          continue;
        }

        console.log(`Synced product: ${upsertedProduct.id}`);
        syncedProducts.push({ id: upsertedProduct.id, printify_id: productSummary.id });

        console.log(`Processing ${enabledVariants.length} enabled variants`);

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
          console.error(`Variants upsert error:`, variantsUpsertError);
        } else {
          console.log(`Synced ${variantsToUpsert.length} variants`);
        }

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
            console.log(`Deleted ${staleVariants.length} stale variants`);
          }
        }

      } catch (error) {
        console.error(`Error processing product ${productSummary.title}:`, error);
        continue;
      }
    }

    console.log(`Sync complete! Processed ${syncedProducts.length} products`);

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
  } catch (error) {
    console.error('Error syncing Printify products:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to sync Printify products',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
