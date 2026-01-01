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
    const siteUrl = (Deno.env.get('PUBLIC_SITE_URL') || Deno.env.get('SITE_URL') || '').replace(/\/+$/, '');
    const handleBase = siteUrl || '';

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

      const handle = handleBase && product.slug
        ? `${handleBase}/product/${product.slug}`
        : handleBase && `${handleBase}/product/${printifyId}` || undefined;

      try {
        // Best-effort: if the product is stuck, try clearing with publishing_failed first, then succeed.
        try {
          await printify.markPublishingFailed(printifyId, 'Reset publish state from custom store');
        } catch (err) {
          console.warn(`Ignore reset failure for ${printifyId}:`, err instanceof Error ? err.message : err);
        }

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
