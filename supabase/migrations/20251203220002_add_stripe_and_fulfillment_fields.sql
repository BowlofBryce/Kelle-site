/*
  # Add Stripe and Fulfillment Tracking

  ## Overview
  Enhances the orders table with Stripe session tracking and fulfillment status.
  Adds webhook event logging for debugging and monitoring.

  ## Changes

  ### 1. Orders Table Updates
    - Add `stripe_session_id` (text) - Stripe Checkout Session ID
    - Add `fulfillment_status` (text) - Tracks order through fulfillment pipeline
    - Add `customer_phone` (text) - Phone number for shipping
    - Add `metadata` (jsonb) - Flexible field for additional data

  ### 2. Webhook Events Table
    - `id` (uuid, primary key)
    - `event_type` (text) - Stripe event type
    - `event_id` (text) - Stripe event ID (unique)
    - `payload` (jsonb) - Full event payload
    - `processed` (boolean) - Processing status
    - `error_message` (text) - Error if processing failed
    - `created_at` (timestamptz)

  ## Security
  - Enable RLS on webhook_events table
  - Only admins can view webhook events
  - Anyone can insert (for webhook endpoint)
*/

-- Add new columns to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'stripe_session_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN stripe_session_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'fulfillment_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN fulfillment_status text DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE orders ADD COLUMN metadata jsonb DEFAULT '{}';
  END IF;
END $$;

-- Create webhook_events table
CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  event_id text UNIQUE NOT NULL,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on webhook_events
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhook_events
CREATE POLICY "Anyone can create webhook events"
  ON webhook_events FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can view webhook events"
  ON webhook_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update webhook events"
  ON webhook_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

-- Add comment for fulfillment_status values
COMMENT ON COLUMN orders.fulfillment_status IS 'Order fulfillment status: pending, processing, shipped, delivered, failed';