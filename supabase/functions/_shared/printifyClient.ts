export interface PrintifyVariant {
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

export interface PrintifyOption {
  name: string;
  type: string;
  values: Array<{
    id: number;
    title: string;
    colors?: string[];
    hex_colors?: string[];
  }>;
}

export interface PrintifyImage {
  src: string;
  variant_ids: number[];
  position: string;
  is_default: boolean;
}

export interface PrintifyProduct {
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

export interface PrintifyProductSummary {
  id: string;
  title: string;
  description: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  visible: boolean;
}

export class PrintifyClient {
  private apiKey: string;
  private shopId: string;
  private baseUrl = 'https://api.printify.com/v1';

  constructor(apiKey: string, shopId: string) {
    this.apiKey = apiKey;
    this.shopId = shopId;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    return this.fetchWithRetry<T>(endpoint, { method: 'GET' });
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

  private logAckResult(productId: string, action: 'succeeded' | 'failed') {
    console.log(`Printify publishing_${action} acknowledged for product ${productId}`);
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

    // Primary resolution: by option lookup map.
    let size = sizeOpt ? (optionValues[sizeOpt.name] ?? '') : '';
    let color = colorOpt ? (optionValues[colorOpt.name] ?? '') : '';

    // Secondary resolution: by positional mapping of variant.options to options[] if sizes are missing.
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

    // Final fallback: parse the variant.title if Printify already concatenated it.
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

  async markPublishingSucceeded(productId: string) {
    await this.fetchWithRetry(
      `/shops/${this.shopId}/products/${productId}/publishing_succeeded.json`,
      { method: 'POST' }
    );
    this.logAckResult(productId, 'succeeded');
  }

  async markPublishingFailed(productId: string, reason: string) {
    await this.fetchWithRetry(
      `/shops/${this.shopId}/products/${productId}/publishing_failed.json`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );
    this.logAckResult(productId, 'failed');
  }
}
