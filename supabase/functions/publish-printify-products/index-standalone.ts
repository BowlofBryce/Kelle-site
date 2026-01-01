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
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });

    if (response.ok) {
      const text = await response.text();
      return text ? JSON.parse(text) : (undefined as unknown as T);
    }

    const shouldRetry = response.status === 429 || (response.status >= 500 && response.status < 600);

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
    console.error(`Printify API Error: ${response.status} ${response.statusText} - ${errorText}`);
    throw new Error(`Printify API request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  private logAckResult(productId: string, action: 'succeeded' | 'failed', handle?: string) {
    const handleInfo = handle ? ` (handle: ${handle})` : '';
    console.log(`Printify publishing_${action} acknowledged for product ${productId}${handleInfo}`);
  }

  async markPublishingSucceeded(productId: string, external?: { id: string; handle?: string }) {
    const body = external?.handle ? { external: { id: external.id, handle: external.handle } } : { external: { id: external?.id || productId } };
    await this.fetchWithRetry(
      `/shops/${this.shopId}/products/${productId}/publishing_succeeded.json`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
    this.logAckResult(productId, 'succeeded', external?.handle);
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

    let siteUrl = '';
    try {
      const { data: siteContent } = await supabase
        .from('site_content')
        .select('value')
        .eq('key', 'site_url')
        .maybeSingle();

      if (siteContent?.value) {
        siteUrl = typeof siteContent.value === 'string'
          ? JSON.parse(siteContent.value)
          : siteContent.value;
      }
    } catch (error) {
      console.warn('Could not fetch site URL from database:', error);
    }

    if (!siteUrl) {
      siteUrl = Deno.env.get('PUBLIC_SITE_URL') || Deno.env.get('SITE_URL') || '';
    }

    siteUrl = siteUrl.replace(/\/+$/, '');
    console.log(`Using site URL: ${siteUrl || '(none)'}`);

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, slug, printify_id')
      .not('printify_id', 'is', null);

    if (productsError) {
      throw productsError;
    }

    const successes: { printify_id: string; handle?: string }[] = [];
    const failures: { printify_id: string; error: string }[] = [];

    for (const product of products || []) {
      const printifyId = product.printify_id;
      if (!printifyId) continue;

      const handle =
        siteUrl && product.slug
          ? `${siteUrl}/product/${product.slug}`
          : undefined;

      try {
        await printify.markPublishingSucceeded(printifyId, { id: product.id, handle });
        successes.push({ printify_id: printifyId, handle });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Publish ack failed for ${printifyId}:`, message);
        failures.push({ printify_id: printifyId, error: message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        published: successes.length,
        failed: failures.length,
        successes,
        failures,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Publish function failed:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to publish to Printify',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
