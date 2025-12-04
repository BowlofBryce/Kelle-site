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
