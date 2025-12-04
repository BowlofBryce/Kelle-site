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

  private async fetch<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Printify API Error: ${response.status} - ${text}`);
      throw new Error(`Printify API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getProducts(): Promise<PrintifyProductSummary[]> {
    const data = await this.fetch<{ data: PrintifyProductSummary[] }>(
      `/shops/${this.shopId}/products.json`
    );
    return data.data;
  }

  async getProduct(productId: string): Promise<PrintifyProduct> {
    return this.fetch<PrintifyProduct>(
      `/shops/${this.shopId}/products/${productId}.json`
    );
  }

  parseVariantName(variant: PrintifyVariant, options: PrintifyOption[]): { size: string; color: string } {
    const parts = variant.title.split('/').map(s => s.trim());

    if (parts.length === 2) {
      return { size: parts[0], color: parts[1] };
    }

    const sizeOption = options.find(opt => opt.type === 'size');
    const colorOption = options.find(opt => opt.type === 'color');

    let size = '';
    let color = '';

    variant.options.forEach(optionId => {
      if (sizeOption) {
        const sizeValue = sizeOption.values.find(v => v.id === optionId);
        if (sizeValue) size = sizeValue.title;
      }
      if (colorOption) {
        const colorValue = colorOption.values.find(v => v.id === optionId);
        if (colorValue) color = colorValue.title;
      }
    });

    return { size: size || 'One Size', color: color || 'Default' };
  }

  getVariantImage(variant: PrintifyVariant, images: PrintifyImage[]): string | null {
    const variantImage = images.find(img =>
      img.variant_ids.includes(variant.id) && img.position === 'front'
    );
    return variantImage?.src || null;
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

    const productList = await printify.getProducts();
    console.log(`Found ${productList.length} products from Printify`);

    const syncedProducts = [];

    for (const productSummary of productList) {
      try {
        console.log(`Processing: ${productSummary.title}`);

        const details = await printify.getProduct(productSummary.id);

        const thumbnail = details.images?.[0]?.src || '';
        const images = details.images?.map(img => img.src) || [];

        const enabledVariants = details.variants.filter(v => v.is_enabled && v.is_available);

        if (enabledVariants.length === 0) {
          console.log(`No enabled variants, skipping product`);
          continue;
        }

        const priceInCents = enabledVariants[0]?.price || 2999;

        const slug = details.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

        const { data: upsertedProduct, error: upsertError } = await supabase
          .from('products')
          .upsert(
            {
              printify_id: productSummary.id,
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
          console.error(`Upsert error:`, upsertError);
          continue;
        }

        console.log(`Synced product: ${upsertedProduct.id}`);
        syncedProducts.push({ id: upsertedProduct.id, printify_id: productSummary.id });

        console.log(`Processing ${enabledVariants.length} enabled variants`);

        const variantsToUpsert = enabledVariants.map(variant => {
          const previewUrl = printify.getVariantImage(variant, details.images);
          const { size, color } = printify.parseVariantName(variant, details.options);

          return {
            product_id: upsertedProduct.id,
            printify_variant_id: variant.id.toString(),
            name: `${size} / ${color}`,
            sku: variant.sku || `${productSummary.id}-${variant.id}`,
            price_cents: variant.price,
            available: variant.is_available && variant.is_enabled,
            stock: variant.is_available ? 100 : 0,
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

        await supabase
          .from('variants')
          .delete()
          .eq('product_id', upsertedProduct.id)
          .not('printify_variant_id', 'in', `(${enabledVariants.map(v => v.id).join(',')})`);

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