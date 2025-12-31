import { createClient } from 'npm:@supabase/supabase-js@2';
import { PrintifyClient } from '../_shared/printifyClient.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

type PublishState = 'publishing' | 'published' | 'failed';

async function updateProductPublishState(
  supabase: ReturnType<typeof createClient>,
  printifyId: string,
  state: PublishState
) {
  const updates: Record<string, unknown> = {
    publish_state: state,
    updated_at: new Date().toISOString(),
  };

  if (state === 'publishing') updates.active = false;
  if (state === 'published') updates.active = true;

  const { error } = await supabase
    .from('products')
    .update(updates)
    .eq('printify_id', printifyId);

  if (error) {
    console.error(`Failed to update publish_state for ${printifyId}`, error);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const printifyToken = Deno.env.get('PRINTIFY_API_TOKEN');
  const printifyShopId = Deno.env.get('PRINTIFY_SHOP_ID');

  if (!supabaseUrl || !supabaseKey) {
    return new Response('Missing Supabase configuration', { status: 500, headers: corsHeaders });
  }

  if (!printifyToken || !printifyShopId) {
    console.warn('Printify credentials missing; publish ack will be skipped');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const printify = printifyToken && printifyShopId ? new PrintifyClient(printifyToken, printifyShopId) : null;

  try {
    const payload = await req.json();
    const eventType: string | undefined = payload?.event || payload?.type;
    const productId: string | undefined =
      payload?.data?.product_id ||
      payload?.data?.id ||
      payload?.resource?.id ||
      payload?.product_id;

    if (!eventType || !productId) {
      console.error('Missing event type or product id', payload);
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Received Printify webhook: ${eventType} for product ${productId}`);

    if (eventType === 'product:publish:started') {
      await updateProductPublishState(supabase, productId, 'publishing');
      return new Response(JSON.stringify({ ok: true, state: 'publishing' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (eventType === 'product:publish:succeeded') {
      await updateProductPublishState(supabase, productId, 'published');
      if (printify) {
        try {
          await printify.markPublishingSucceeded(productId);
        } catch (err) {
          console.error('Failed to acknowledge publish success to Printify', err);
        }
      }
      return new Response(JSON.stringify({ ok: true, state: 'published' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (eventType === 'product:publish:failed') {
      const reason: string =
        payload?.data?.message ||
        payload?.data?.reason ||
        payload?.error ||
        'Publish failed';

      await updateProductPublishState(supabase, productId, 'failed');
      if (printify) {
        try {
          await printify.markPublishingFailed(productId, reason);
        } catch (err) {
          console.error('Failed to acknowledge publish failure to Printify', err);
        }
      }
      return new Response(JSON.stringify({ ok: true, state: 'failed' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ignore unrelated events, but acknowledge receipt.
    console.log(`Unhandled Printify event type: ${eventType}`);
    return new Response(JSON.stringify({ ok: true, ignored: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error handling Printify webhook:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
