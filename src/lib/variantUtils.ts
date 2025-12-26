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

export interface ColorInfo {
  name: string;
  previewUrl: string | null;
  hexColor: string;
}

const colorMap: Record<string, string> = {
  'black': '#000000',
  'white': '#FFFFFF',
  'navy': '#0B1F3A',
  'royal': '#4169E1',
  'red': '#DC143C',
  'dark heather': '#5A5A5A',
  'sport grey': '#C0C0C0',
  'light blue': '#ADD8E6',
  'charcoal': '#36454F',
  'maroon': '#800000',
  'forest green': '#228B22',
  'irish green': '#009A49',
  'military green': '#4B5320',
  'pink': '#FFB6C1',
  'light pink': '#FFB6C1',
  'hot pink': '#FF69B4',
  'purple': '#800080',
  'orange': '#FFA500',
  'yellow': '#FFD700',
  'natural': '#F5F5DC',
  'sand': '#C2B280',
  'ash': '#B2BEB5',
  'heather grey': '#B2BEB5',
  'heather gray': '#B2BEB5',
  'heather forest': '#2E4A2E',
  'heather navy': '#2C3E50',
  'heather royal': '#4169E1',
  'heather red': '#B22222',
  'dark chocolate': '#3C2F2F',
  'brown': '#8B4513',
  'tan': '#D2B48C',
  'olive': '#808000',
  'gold': '#FFD700',
  'silver': '#C0C0C0',
  'teal': '#008080',
  'aqua': '#00FFFF',
  'mint': '#98FF98',
  'lime': '#32CD32',
  'cream': '#FFFDD0',
  'off white': '#FAF9F6',
  'ivory': '#FFFFF0',
  'grey': '#808080',
  'gray': '#808080',
  'dark grey': '#A9A9A9',
  'dark gray': '#A9A9A9',
  'light grey': '#D3D3D3',
  'light gray': '#D3D3D3',
  'charcoal heather': '#36454F',
  'heather dark grey': '#696969',
  'heather dark gray': '#696969',
  'heather black': '#1C1C1C',
  'heather white': '#F8F8FF',
  'heather orange': '#FF8C00',
  'heather purple': '#8A2BE2',
  'heather green': '#2E8B57',
  'heather yellow': '#EEE8AA',
  'cardinal': '#C41E3A',
  'cardinal red': '#C41E3A',
  'heather scarlet red': '#CD5C5C',
  'burgundy': '#800020',
  'heather sport dark maroon': '#5B1A28',
  'garnet': '#733635',
  'pink lemonade': '#FFB3D9',
  'heliconia': '#D62598',
};

function parseVariant(variant: Variant): ParsedVariant | null {
  // Prefer explicit fields written by Printify sync (variants.size / variants.color)
  const sizeField = (variant as any).size;
  const colorField = (variant as any).color;

  const size = typeof sizeField === 'string' ? sizeField.trim() : '';
  const color = typeof colorField === 'string' ? colorField.trim() : '';

  if (size && color) {
    return { size, color, variant };
  }

  // Fallback for legacy rows (before size/color columns existed)
  const parts = (variant.name || '').split('/').map(p => p.trim()).filter(Boolean);
  if (parts.length === 2) {
    return { size: parts[0], color: parts[1], variant };
  }

  return null;
}

export function organizeVariants(variants: Variant[]): VariantOptions {
  const parsed = variants.map(parseVariant).filter((v): v is ParsedVariant => v !== null);

  const colorsSet = new Set<string>();
  const sizesSet = new Set<string>();
  const variantMap = new Map<string, Variant>();

  const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];

  parsed.forEach(({ color, size, variant }) => {
    if (!color || !size) return;
    colorsSet.add(color);
    sizesSet.add(size);
    variantMap.set(`${size}|${color}`, variant);
  });

  const sizes = Array.from(sizesSet).sort((a, b) => {
    const aIndex = sizeOrder.indexOf(a.toUpperCase());
    const bIndex = sizeOrder.indexOf(b.toUpperCase());

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

export function getColorInfo(colorName: string, variants: Variant[], _sizes: string[]): ColorInfo {
  // Prefer an in-stock variant image for this color; fall back to any variant image.
  const availableVariant = variants.find(v => {
    const parsed = parseVariant(v);
    return parsed && parsed.color === colorName && !!v.available;
  });

  const anyVariant = variants.find(v => {
    const parsed = parseVariant(v);
    return parsed && parsed.color === colorName;
  });

  const variant = availableVariant || anyVariant;

  return {
    name: colorName,
    previewUrl: variant?.preview_url || null,
    hexColor: getColorHex(colorName),
  };
}

export function getColorHex(colorName: string): string {
  const normalized = (colorName || '').toLowerCase().trim();
  return colorMap[normalized] || '#808080';
}
