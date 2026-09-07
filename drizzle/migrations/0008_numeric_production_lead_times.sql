-- Numeric production lead times. Existing text values and historical rows are preserved.
ALTER TABLE "products"
    ADD COLUMN IF NOT EXISTS "production_min_business_days" integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "production_max_business_days" integer NOT NULL DEFAULT 0;

ALTER TABLE "production_time_rules"
    ADD COLUMN IF NOT EXISTS "production_min_business_days" integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "production_max_business_days" integer NOT NULL DEFAULT 0;

ALTER TABLE "order_items"
    ADD COLUMN IF NOT EXISTS "production_min_business_days" integer,
    ADD COLUMN IF NOT EXISTS "production_max_business_days" integer;
