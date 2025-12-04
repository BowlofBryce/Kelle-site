import type { Database } from './database.types';

type Variant = Database['public']['Tables']['variants']['Row'];

export interface ParsedVariant {
  size: string;
  color: string;
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
  'vintage white': '#F5F5DC',
  'navy': '#001f3f',
  'royal': '#0074D9',
  'sky': '#87CEEB',
  'light blue': '#ADD8E6',
  'carolina blue': '#7BAFD4',
  'indigo blue': '#4B0082',
  'sapphire': '#0F52BA',
  'antique sapphire': '#2F5F8F',
  'heather sport royal': '#4169E1',
  'heather sport dark navy': '#1C2841',
  'red': '#FF4136',
  'cherry red': '#DE3163',
  'antique cherry red': '#9B2D30',
  'cardinal red': '#C41E3A',
  'heather scarlet red': '#CD5C5C',
  'burgundy': '#800020',
  'maroon': '#85144b',
  'heather sport dark maroon': '#5B1A28',
  'garnet': '#733635',
  'pink': '#FFB6C1',
  'light pink': '#FFB6C1',
  'safety pink': '#FF69B4',
  'pink lemonade': '#FFB3D9',
  'heliconia': '#D62598',
  'forest green': '#228B22',
  'irish green': '#009A49',
  'military green': '#4B5320',
  'safety green': '#7FFF00',
  'lime': '#32CD32',
  'yellow': '#FFEB3B',
  'yellow haze': '#F4E87C',
  'mustard': '#FFDB58',
  'gold': '#FFD700',
  'orange': '#FF851B',
  'safety orange': '#FF6600',
  'daisy': '#FFEB3B',
  'purple': '#B10DC9',
  'lavender': '#E6E6FA',
  'brown': '#8B4513',
  'dark chocolate': '#5C4033',
  'cocoa': '#6F4E37',
  'sand': '#C2B280',
  'heather grey': '#B0B0B0',
  'sport grey': '#A8A9AD',
  'grey': '#808080',
  'dark heather': '#616161',
  'graphite heather': '#424242',
  'charcoal': '#36454F',
  'ash': '#B2BEB5',
};

export function parseVariant(variant: Variant): ParsedVariant | null {
  const parts = variant.name.split('/').map(p => p.trim());

  if (parts.length === 2) {
    return {
      size: parts[0],
      color: parts[1],
      variant,
    };
  }

  return null;
}

export interface ColorInfo {
  name: string;
  previewUrl: string | null;
  hexColor: string;
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
    variantMap.set(`${size}|${color}`, variant);
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

export function getColorInfo(colorName: string, variants: Variant[], sizes: string[]): ColorInfo {
  const firstSize = sizes[0];
  const variant = variants.find(v => {
    const parsed = parseVariant(v);
    return parsed && parsed.color === colorName && parsed.size === firstSize;
  });

  return {
    name: colorName,
    previewUrl: variant?.preview_url || null,
    hexColor: getColorHex(colorName),
  };
}

export function getColorHex(colorName: string): string {
  const normalized = colorName.toLowerCase();
  return colorMap[normalized] || '#808080';
}
