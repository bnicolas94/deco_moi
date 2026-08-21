-- Unified sales channels and Mercado Libre profitability snapshots.
-- Idempotent on purpose: this project historically used drizzle-kit push and
-- some installations already have the integration tables outside migrations.

ALTER TABLE IF EXISTS "orders" ADD COLUMN IF NOT EXISTS "sales_channel" varchar(30) NOT NULL DEFAULT 'app';
ALTER TABLE IF EXISTS "orders" ADD COLUMN IF NOT EXISTS "external_order_id" varchar(100);
ALTER TABLE IF EXISTS "orders" ADD COLUMN IF NOT EXISTS "external_status" varchar(50);
ALTER TABLE IF EXISTS "orders" ADD COLUMN IF NOT EXISTS "financial_status" varchar(30) NOT NULL DEFAULT 'provisional';
ALTER TABLE IF EXISTS "orders" ADD COLUMN IF NOT EXISTS "paid_at" timestamp;
ALTER TABLE IF EXISTS "orders" ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp;
CREATE UNIQUE INDEX IF NOT EXISTS "orders_channel_external_order_idx" ON "orders" ("sales_channel", "external_order_id");

ALTER TABLE IF EXISTS "order_items" ADD COLUMN IF NOT EXISTS "external_item_id" varchar(50);
ALTER TABLE IF EXISTS "order_items" ADD COLUMN IF NOT EXISTS "external_variation_id" varchar(50);
ALTER TABLE IF EXISTS "order_items" ADD COLUMN IF NOT EXISTS "pack_quantity" integer NOT NULL DEFAULT 1;
ALTER TABLE IF EXISTS "order_items" ADD COLUMN IF NOT EXISTS "internal_units" integer;
ALTER TABLE IF EXISTS "order_items" ADD COLUMN IF NOT EXISTS "gross_amount" numeric(12, 2);
ALTER TABLE IF EXISTS "order_items" ADD COLUMN IF NOT EXISTS "discount_amount" numeric(12, 2) DEFAULT 0;
ALTER TABLE IF EXISTS "order_items" ADD COLUMN IF NOT EXISTS "net_revenue" numeric(12, 2);
UPDATE "order_items" SET "internal_units" = "quantity" WHERE "internal_units" IS NULL;
UPDATE "order_items" SET "gross_amount" = "subtotal" WHERE "gross_amount" IS NULL;
UPDATE "order_items" SET "net_revenue" = "subtotal" WHERE "net_revenue" IS NULL;

ALTER TABLE IF EXISTS "cost_items" ADD COLUMN IF NOT EXISTS "category" varchar(50) NOT NULL DEFAULT 'operational';
ALTER TABLE IF EXISTS "cost_items" ADD COLUMN IF NOT EXISTS "applies_to_channels" json NOT NULL DEFAULT '["app","mercadolibre"]'::json;

ALTER TABLE IF EXISTS "order_item_costs" ADD COLUMN IF NOT EXISTS "cost_code" varchar(80);
ALTER TABLE IF EXISTS "order_item_costs" ADD COLUMN IF NOT EXISTS "category" varchar(50) NOT NULL DEFAULT 'operational';
ALTER TABLE IF EXISTS "order_item_costs" ADD COLUMN IF NOT EXISTS "nature" varchar(20) NOT NULL DEFAULT 'variable';
ALTER TABLE IF EXISTS "order_item_costs" ADD COLUMN IF NOT EXISTS "calculation_basis" varchar(30) NOT NULL DEFAULT 'configured';
ALTER TABLE IF EXISTS "order_item_costs" ADD COLUMN IF NOT EXISTS "source" varchar(30) NOT NULL DEFAULT 'configuration';
ALTER TABLE IF EXISTS "order_item_costs" ADD COLUMN IF NOT EXISTS "sales_channel" varchar(30) NOT NULL DEFAULT 'app';
ALTER TABLE IF EXISTS "order_item_costs" ADD COLUMN IF NOT EXISTS "is_estimated" boolean NOT NULL DEFAULT true;
ALTER TABLE IF EXISTS "order_item_costs" ADD COLUMN IF NOT EXISTS "affects_profit" boolean NOT NULL DEFAULT true;
ALTER TABLE IF EXISTS "order_item_costs" ADD COLUMN IF NOT EXISTS "parent_cost_code" varchar(80);
ALTER TABLE IF EXISTS "order_item_costs" ADD COLUMN IF NOT EXISTS "external_reference" varchar(120);
ALTER TABLE IF EXISTS "order_item_costs" ADD COLUMN IF NOT EXISTS "effective_at" timestamp DEFAULT now();
UPDATE "order_item_costs" SET "nature" = CASE WHEN "cost_item_type" = 'fixed' THEN 'fixed' ELSE 'variable' END;

ALTER TABLE IF EXISTS "meli_pricing_config" ADD COLUMN IF NOT EXISTS "mp_commission_pct" numeric(5, 2) DEFAULT 0;
ALTER TABLE IF EXISTS "meli_pricing_config" ADD COLUMN IF NOT EXISTS "gross_income_tax_pct" numeric(5, 2) DEFAULT 0;

ALTER TABLE IF EXISTS "meli_orders" ADD COLUMN IF NOT EXISTS "taxes_amount" numeric(10, 2) DEFAULT 0;
ALTER TABLE IF EXISTS "meli_orders" ADD COLUMN IF NOT EXISTS "mp_fee_amount" numeric(10, 2) DEFAULT 0;
ALTER TABLE IF EXISTS "meli_orders" ADD COLUMN IF NOT EXISTS "mapping_status" varchar(30) NOT NULL DEFAULT 'pending';
ALTER TABLE IF EXISTS "meli_orders" ADD COLUMN IF NOT EXISTS "financial_status" varchar(30) NOT NULL DEFAULT 'provisional';
ALTER TABLE IF EXISTS "meli_orders" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();
