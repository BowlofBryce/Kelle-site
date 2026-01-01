import { createClient } from 'npm:@supabase/supabase-js@2';

interface ProductData {
  printify_id: string;
  name: string;
  description: string;
  price_cents: number;
  thumbnail_url: string;
  images: string[];
  category?: string;
  active?: boolean;
  featured?: boolean;
  publish_state?: string;
  variants: Array<{
    printify_variant_id: string;
    name: string;
    size: string;
    color: string;
    sku: string;
    price_cents: number;
    available?: boolean;
    stock?: number;
    preview_url?: string;
    option_values?: Record<string, string>;
  }>;
}

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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { githubUrl } = await req.json();

    if (!githubUrl) {
      return new Response(
        JSON.stringify({ error: 'githubUrl is required in request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Fetching products from GitHub: ${githubUrl}`);

    const response = await fetch(githubUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch from GitHub: ${response.status} ${response.statusText}`);
    }

    const products: ProductData[] = await response.json();
    console.log(`Found ${products.length} products to import`);

    const importedProducts: Array<{ id: string; name: string }> = [];

    for (const productData of products) {
      try {
        console.log(`Processing: ${productData.name}`);

        const slug = productData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

        const { data: upsertedProduct, error: upsertError } = await supabase
          .from('products')
          .upsert(
            {
              printify_id: productData.printify_id,
              name: productData.name,
              slug: slug,
              description: productData.description || '',
              price_cents: productData.price_cents,
              thumbnail_url: productData.thumbnail_url,
              images: productData.images || [],
              active: productData.active ?? true,
              featured: productData.featured ?? false,
              publish_state: productData.publish_state ?? 'published',
              category: productData.category || 'merch',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'printify_id' }
          )
          .select()
          .single();

        if (upsertError || !upsertedProduct) {
          console.error(`Failed to import product ${productData.name}:`, upsertError);
          continue;
        }

        console.log(`Imported product: ${upsertedProduct.id}`);
        importedProducts.push({ id: upsertedProduct.id, name: upsertedProduct.name });

        if (productData.variants && productData.variants.length > 0) {
          console.log(`Processing ${productData.variants.length} variants`);

          const variantsToUpsert = productData.variants.map(variant => ({
            product_id: upsertedProduct.id,
            printify_variant_id: variant.printify_variant_id,
            name: variant.name,
            size: variant.size,
            color: variant.color,
            option_values: variant.option_values || {},
            sku: variant.sku,
            price_cents: variant.price_cents,
            available: variant.available ?? true,
            stock: variant.stock ?? 100,
            preview_url: variant.preview_url || productData.thumbnail_url,
          }));

          const { error: variantsUpsertError } = await supabase
            .from('variants')
            .upsert(variantsToUpsert, { onConflict: 'printify_variant_id' });

          if (variantsUpsertError) {
            console.error(`Failed to import variants:`, variantsUpsertError);
          } else {
            console.log(`Imported ${variantsToUpsert.length} variants`);
          }
        }
      } catch (error) {
        console.error(`Error processing product ${productData.name}:`, error);
        continue;
      }
    }

    console.log(`Import complete! Processed ${importedProducts.length} products`);

    return new Response(
      JSON.stringify({
        success: true,
        imported: importedProducts.length,
        products: importedProducts,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error importing from GitHub:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to import from GitHub',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
