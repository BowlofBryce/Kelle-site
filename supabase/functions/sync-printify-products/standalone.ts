import { createClient } from 'npm:@supabase/supabase-js@2';

interface PrintifyVariant {
  id: number;
  sku: string;
  cost: number;
  price: number;
  title: string;
  grams: number;
  is_enabled: boolean;
  is_default: boolean;
  is_available: boolean;
  options: number[];
}

interface PrintifyOption {
  name: string;
  type: string;
  values: Array<{
    id: number;
    title: string;
    colors?: string[];
    hex_colors?: string[];
  }>;
}

interface PrintifyImage {
  src: string;
  variant_ids: number[];
  position: string;
  is_default: boolean;
}

interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  tags: string[];
  options: PrintifyOption[];
  variants: PrintifyVariant[];
  images: PrintifyImage[];
  created_at: string;
  updated_at: string;
  visible: boolean;
  is_locked: boolean;
  blueprint_id: number;
  user_id: number;
  shop_id: number;
  print_provider_id: number;
}

interface PrintifyProductSummary {
  id: string;
  title: string;
  description: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  visible: boolean;
}

class PrintifyClient {
  private apiKey: string;
  private shopId: string;
  private baseUrl = 'https://api.printify.com/v1';

  constructor(apiKey: string, shopId: string) {
    this.apiKey = apiKey;
    this.shopId = shopId;
  }

  private async fetchWithRetry<T>(
    endpoint: string,
    init: RequestInit = {},
    attempt = 0,
    maxAttempts = 5
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`Printify API Request: ${init.method || 'GET'} ${url}`);

    const response = await fetch(url, {
      ...init,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });

    if (response.ok) {
      const text = await response.text();
      return text ? JSON.parse(text) : (undefined as unknown as T);
    }

    const shouldRetry =
      response.status === 429 ||
      (response.status >= 500 && response.status < 600);

    if (shouldRetry && attempt < maxAttempts - 1) {
      const retryAfter = parseFloat(response.headers.get('Retry-After') || '0');
      const backoff = Math.min(1000 * 2 ** attempt, 8000);
      const jitter = Math.random() * 250;
      const delay = retryAfter > 0 ? retryAfter * 1000 : backoff + jitter;
      console.warn(`Printify API retry ${attempt + 1}/${maxAttempts} after ${delay}ms (status ${response.status})`);
      await new Promise(r => setTimeout(r, delay));
      return this.fetchWithRetry<T>(endpoint, init, attempt + 1, maxAttempts);
    }

    const errorText = await response.text();
    console.error(`Printify API Error Details:`);
    console.error(`  URL: ${url}`);
    console.error(`  Status: ${response.status} ${response.statusText}`);
    console.error(`  Response: ${errorText}`);
    console.error(`  Shop ID: ${this.shopId}`);
    throw new Error(`Printify API request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  async getProductsPaginated(limit = 50): Promise<PrintifyProductSummary[]> {
    const results: PrintifyProductSummary[] = [];
    let page = 1;
    while (true) {
      const data = await this.fetchWithRetry<{ data: PrintifyProductSummary[] }>(
        `/shops/${this.shopId}/products.json?page=${page}&limit=${limit}`,
        { method: 'GET' }
      );
      const pageData = data.data || [];
      results.push(...pageData);
      if (pageData.length < limit) break;
      page += 1;
    }
    return results;
  }

  async getProduct(productId: string): Promise<PrintifyProduct> {
    return this.fetchWithRetry<PrintifyProduct>(
      `/shops/${this.shopId}/products/${productId}.json`,
      { method: 'GET' }
    );
  }

  parseVariantName(
    variant: PrintifyVariant,
    options: PrintifyOption[]
  ): { size: string; color: string; optionValues: Record<string, string> } {
    const optionLookup = new Map<number, { title: string; name: string; type: string }>();
    options.forEach(opt => {
      opt.values.forEach(v => optionLookup.set(v.id, { title: v.title, name: opt.name, type: opt.type }));
    });

    const optionValues: Record<string, string> = {};
    variant.options.forEach(id => {
      const found = optionLookup.get(id);
      if (found) optionValues[found.name] = found.title;
    });

    const sizeOpt =
      options.find(o => o.type === 'size') ??
      options.find(o => /size/i.test(o.name));
    const colorOpt =
      options.find(o => o.type === 'color') ??
      options.find(o => /color/i.test(o.name));

    let size = sizeOpt ? (optionValues[sizeOpt.name] ?? '') : '';
    let color = colorOpt ? (optionValues[colorOpt.name] ?? '') : '';

    if (!size || !color) {
      variant.options.forEach((id, idx) => {
        const opt = options[idx];
        const value = opt?.values?.find(v => v.id === id);
        if (opt && value) {
          if (!size && (opt.type === 'size' || /size/i.test(opt.name))) size = value.title;
          if (!color && (opt.type === 'color' || /color/i.test(opt.name))) color = value.title;
          optionValues[opt.name] = value.title;
        }
      });
    }

    if (!size || !color) {
      const parts = (variant.title || '').split('/').map(p => p.trim()).filter(Boolean);
      if (parts.length === 2) {
        if (!size) size = parts[0];
        if (!color) color = parts[1];
      }
    }

    return {
      size: size || 'One Size',
      color: color || 'Default',
      optionValues,
    };
  }

  getVariantImage(variant: PrintifyVariant, images: PrintifyImage[]): string | null {
    const variantImage = images.find(img =>
      Array.isArray(img.variant_ids) && img.variant_ids.includes(variant.id) && img.position === 'front'
    );
    const anyVariantImage = images.find(img =>
      Array.isArray(img.variant_ids) && img.variant_ids.includes(variant.id)
    );
    return variantImage?.src || anyVariantImage?.src || images?.[0]?.src || null;
  }
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
    console.log(`Shop ID: ${printifyShopId}`);
    console.log(`API Token configured: ${printifyToken ? 'Yes' : 'No'}`);

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
