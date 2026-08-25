-- Persist the seller-funded Mercado Envíos cost used by profitability.
ALTER TABLE IF EXISTS "meli_orders"
    ADD COLUMN IF NOT EXISTS "shipping_seller_cost" numeric(12, 2) DEFAULT 0;
