import type { Database } from './database.types';

type Variant = Database['public']['Tables']['variants']['Row'];

export interface ParsedVariant {
  color: string;
  size: string;
  variant: Variant;
}

export interface VariantOptions {
  colors: string[];
  sizes: string[];
  variantMap: Map<string, Variant>;
}

const colorMap: Record<string, string> = {
  'black': '#000000',
  'white': '#FFFFFF',
  'navy': '#001f3f',
  'royal': '#0074D9',
  'sky': '#87CEEB',
  'red': '#FF4136',
  'maroon': '#85144b',
  'pink': '#FFB6C1',
  'pink lemonade': '#FFB3D9',
  'forest green': '#228B22',
  'lime': '#32CD32',
  'yellow': '#FFEB3B',
  'yellow haze': '#F4E87C',
  'mustard': '#FFDB58',
  'orange': '#FF851B',
  'daisy': '#FFEB3B',
  'purple': '#B10DC9',
  'lavender': '#E6E6FA',
  'brown': '#8B4513',
  'cocoa': '#6F4E37',
  'sand': '#C2B280',
  'heather grey': '#B0B0B0',
  'grey': '#808080',
  'charcoal': '#36454F',
  'ash': '#B2BEB5',
};

export function parseVariant(variant: Variant): ParsedVariant | null {
  const parts = variant.name.split('/').map(p => p.trim());

  if (parts.length === 2) {
    return {
      color: parts[0],
      size: parts[1],
      variant,
    };
  }

  return null;
}

export function organizeVariants(variants: Variant[]): VariantOptions {
  const parsed = variants.map(parseVariant).filter((v): v is ParsedVariant => v !== null);

  const colorsSet = new Set<string>();
  const sizesSet = new Set<string>();
  const variantMap = new Map<string, Variant>();

  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];

  parsed.forEach(({ color, size, variant }) => {
    colorsSet.add(color);
    sizesSet.add(size);
    variantMap.set(`${color}|${size}`, variant);
  });

  const sizes = Array.from(sizesSet).sort((a, b) => {
    const aIndex = sizeOrder.indexOf(a);
    const bIndex = sizeOrder.indexOf(b);

    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;

    return aIndex - bIndex;
  });

  return {
    colors: Array.from(colorsSet),
    sizes,
    variantMap,
  };
}

export function getColorHex(colorName: string): string {
  const normalized = colorName.toLowerCase();
  return colorMap[normalized] || '#808080';
}
