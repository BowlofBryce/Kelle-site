# Printify Integration Documentation

This document explains the complete Printify API integration for syncing products and ensuring only enabled variants are displayed.

## Architecture Overview

The integration consists of three main components:

1. **Printify Client Module** (`supabase/functions/_shared/printifyClient.ts`)
2. **Product Sync Edge Function** (`supabase/functions/sync-printify-products/index.ts`)
3. **Frontend Variant Display** (`src/routes/ProductDetail.tsx`)

---

## 1. Printify Client Module

### Location
`supabase/functions/_shared/printifyClient.ts`

### Purpose
Provides a reusable TypeScript client for interacting with the Printify V1 API.

### Key Features

- **Type-safe API calls** with proper TypeScript interfaces
- **Error handling** with detailed logging
- **Helper methods** for parsing variant names and extracting images

### Main Methods

```typescript
// Fetch all products from Printify
getProducts(): Promise<PrintifyProductSummary[]>

// Fetch detailed product information including variants
getProduct(productId: string): Promise<PrintifyProduct>

// Parse variant title into size and color
parseVariantName(variant, options): { size, color }

// Get the preview image for a specific variant
getVariantImage(variant, images): string | null
```

### Environment Variables Required

- `PRINTIFY_API_TOKEN` - Your Printify API key
- `PRINTIFY_SHOP_ID` - Your Printify shop ID

---

## 2. Product Sync Edge Function

### Location
`supabase/functions/sync-printify-products/index.ts`

### Purpose
Syncs products and variants from Printify to your Supabase database, ensuring only enabled and available variants are stored.

### How It Works

1. **Fetches all products** from Printify using the client
2. **For each product:**
   - Retrieves full product details including variants
   - **Filters variants** for `is_enabled: true` AND `is_available: true`
   - Skips products with no enabled variants
   - Extracts variant-specific preview images
   - Parses variant names into `size / color` format
   - Upserts product to database
   - Upserts only enabled variants
   - Deletes any variants that are no longer enabled

### Key Filtering Logic

```typescript
const enabledVariants = details.variants.filter(
  v => v.is_enabled && v.is_available
);
```

This ensures:
- ✅ **`is_enabled`** - Merchant wants to sell this variant
- ✅ **`is_available`** - Print provider has it in stock

### Variant Data Stored

```typescript
{
  product_id: string,
  printify_variant_id: string,
  name: "M / Black",           // Parsed from variant
  sku: string,
  price_cents: number,
  available: true,             // Only enabled variants stored
  stock: number,
  preview_url: string          // Variant-specific mockup image
}
```

### How to Run

Call the edge function endpoint:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/sync-printify-products \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

Or set up a scheduled job to run it periodically.

---

## 3. Frontend Variant Display

### Location
`src/routes/ProductDetail.tsx`

### Changes Made

#### A. Filter for Available Variants Only

```typescript
const { data: vars } = await supabase
  .from('variants')
  .select('*')
  .eq('product_id', prod.id)
  .eq('available', true);  // ← Only fetch enabled variants
```

#### B. Display Actual Variant Images as Color Swatches

Instead of generic colored circles, the color selector now shows:

- **Actual product mockup images** for each color
- Larger swatches (64x64px) for better visibility
- Image preview from the variant's `preview_url`
- Fallback to hex colors if images aren't available

```typescript
const colorInfo = getColorInfo(color, variants, variantOptions.sizes);

{colorInfo.previewUrl ? (
  <img src={colorInfo.previewUrl} alt={color} />
) : (
  <div style={{ backgroundColor: colorInfo.hexColor }} />
)}
```

#### C. Update Main Preview on Color/Size Change

When users select a different color or size:

1. Image index resets to 0
2. Selected variant updates
3. Main preview shows variant's `preview_url` first
4. Smooth transition animation plays

```typescript
const productImages = selectedVariant?.preview_url
  ? [selectedVariant.preview_url, ...baseImages]
  : baseImages;
```

---

## 4. Utility Functions

### Location
`src/lib/variantUtils.ts`

### New Export: `getColorInfo()`

Retrieves the preview image and hex color for a given color name:

```typescript
export function getColorInfo(
  colorName: string,
  variants: Variant[],
  sizes: string[]
): ColorInfo {
  // Finds the first variant with this color
  // Returns its preview_url and hex fallback
}
```

---

## Data Flow Diagram

```
Printify API
    ↓
PrintifyClient.getProducts()
    ↓
PrintifyClient.getProduct(id)
    ↓
Filter: is_enabled && is_available
    ↓
Extract preview images per variant
    ↓
Parse "Size / Color" from variant name
    ↓
Supabase Database
    ↓
Frontend Query (available = true)
    ↓
Display: Color swatches with images
    ↓
User Selection → Update preview
```

---

## What Was Fixed

### Problem 1: Wrong Colors Displayed
**Before:** Hardcoded color map showed random/incorrect colors
**After:** Actual Printify variant colors with real product images

### Problem 2: Too Many Color Options
**Before:** Showed all variants including disabled ones
**After:** Only shows variants where `is_enabled && is_available`

### Problem 3: Preview Not Updating
**Before:** Main image stayed static when changing colors
**After:** Variant-specific mockup image displays immediately

### Problem 4: Generic Color Circles
**Before:** Small colored dots (no visual product preview)
**After:** 64x64px swatches showing actual product appearance

---

## Testing the Integration

### 1. Sync Products from Printify

```bash
# Call the sync function
curl -X POST https://your-project.supabase.co/functions/v1/sync-printify-products

# Check logs in Supabase Dashboard → Edge Functions
```

### 2. Verify Database

```sql
-- Check products were synced
SELECT id, name, printify_id, active FROM products;

-- Check only enabled variants are stored
SELECT name, available, preview_url FROM variants WHERE product_id = 'some-id';
```

### 3. Test Frontend

1. Navigate to a product page
2. Verify color swatches show actual product images
3. Click different colors and confirm main preview updates
4. Confirm only enabled color/size combinations appear

---

## Troubleshooting

### No products syncing?
- Check `PRINTIFY_API_TOKEN` and `PRINTIFY_SHOP_ID` env vars
- Verify products are published and visible in Printify
- Check edge function logs for API errors

### Colors not showing images?
- Verify variants have `preview_url` in database
- Confirm Printify product has mockup images generated
- Check browser console for image loading errors

### Wrong variants displayed?
- Re-run sync function to update database
- Verify `available` column is true in variants table
- Check Printify dashboard - ensure variants are enabled

---

## Future Enhancements

- Add webhook support for real-time sync
- Implement variant stock tracking
- Add price update notifications
- Cache product data for performance
- Support for product variants with 3+ options

---

## API References

- [Printify API v1 Documentation](https://developers.printify.com/)
- [Printify Product Variants](https://developers.printify.com/#product-variant-properties)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
