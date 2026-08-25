-- Temporal history for reproducible cost snapshots.
CREATE TABLE IF NOT EXISTS "cost_history_metadata" (
    "id" integer PRIMARY KEY,
    "tracking_started_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "cost_history_metadata" ("id") VALUES (1)
ON CONFLICT ("id") DO NOTHING;

CREATE TABLE IF NOT EXISTS "cost_configuration_history" (
    "id" serial PRIMARY KEY,
    "entity_type" varchar(40) NOT NULL,
    "entity_key" varchar(80) NOT NULL,
    "snapshot" jsonb NOT NULL,
    "valid_from" timestamp NOT NULL,
    "valid_to" timestamp,
    "recorded_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "cost_configuration_history_period_idx"
    ON "cost_configuration_history" ("entity_type", "valid_from", "valid_to");
CREATE UNIQUE INDEX IF NOT EXISTS "cost_configuration_history_open_idx"
    ON "cost_configuration_history" ("entity_type", "entity_key")
    WHERE "valid_to" IS NULL;

INSERT INTO "cost_configuration_history" ("entity_type", "entity_key", "snapshot", "valid_from")
SELECT 'cost_item', "id"::text, to_jsonb(c), COALESCE("updated_at", "created_at", CURRENT_TIMESTAMP)
FROM "cost_items" c
ON CONFLICT DO NOTHING;

INSERT INTO "cost_configuration_history" ("entity_type", "entity_key", "snapshot", "valid_from")
SELECT 'supply', "id"::text, to_jsonb(s), COALESCE("updated_at", "created_at", CURRENT_TIMESTAMP)
FROM "supplies" s
ON CONFLICT DO NOTHING;

INSERT INTO "cost_configuration_history" ("entity_type", "entity_key", "snapshot", "valid_from")
SELECT 'product_cost_item', "id"::text, to_jsonb(pci), COALESCE("created_at", CURRENT_TIMESTAMP)
FROM "product_cost_items" pci
ON CONFLICT DO NOTHING;

INSERT INTO "cost_configuration_history" ("entity_type", "entity_key", "snapshot", "valid_from")
SELECT 'product_supply', "id"::text, to_jsonb(ps), COALESCE("updated_at", "created_at", CURRENT_TIMESTAMP)
FROM "product_supplies" ps
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION record_cost_configuration_history()
RETURNS trigger AS $$
DECLARE
    history_entity_type varchar(40);
    history_entity_key varchar(80);
    history_snapshot jsonb;
BEGIN
    history_entity_type := CASE TG_TABLE_NAME
        WHEN 'cost_items' THEN 'cost_item'
        WHEN 'supplies' THEN 'supply'
        WHEN 'product_cost_items' THEN 'product_cost_item'
        WHEN 'product_supplies' THEN 'product_supply'
    END;
    history_snapshot := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
    history_entity_key := history_snapshot->>'id';

    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        UPDATE "cost_configuration_history"
        SET "valid_to" = CURRENT_TIMESTAMP
        WHERE "entity_type" = history_entity_type
          AND "entity_key" = history_entity_key
          AND "valid_to" IS NULL;
    END IF;

    IF TG_OP <> 'DELETE' THEN
        INSERT INTO "cost_configuration_history" ("entity_type", "entity_key", "snapshot", "valid_from")
        VALUES (history_entity_type, history_entity_key, to_jsonb(NEW), CURRENT_TIMESTAMP);
        RETURN NEW;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "cost_items_history_trigger" ON "cost_items";
CREATE TRIGGER "cost_items_history_trigger"
AFTER INSERT OR UPDATE OR DELETE ON "cost_items"
FOR EACH ROW EXECUTE FUNCTION record_cost_configuration_history();

DROP TRIGGER IF EXISTS "supplies_history_trigger" ON "supplies";
CREATE TRIGGER "supplies_history_trigger"
AFTER INSERT OR UPDATE OR DELETE ON "supplies"
FOR EACH ROW EXECUTE FUNCTION record_cost_configuration_history();

DROP TRIGGER IF EXISTS "product_cost_items_history_trigger" ON "product_cost_items";
CREATE TRIGGER "product_cost_items_history_trigger"
AFTER INSERT OR UPDATE OR DELETE ON "product_cost_items"
FOR EACH ROW EXECUTE FUNCTION record_cost_configuration_history();

DROP TRIGGER IF EXISTS "product_supplies_history_trigger" ON "product_supplies";
CREATE TRIGGER "product_supplies_history_trigger"
AFTER INSERT OR UPDATE OR DELETE ON "product_supplies"
FOR EACH ROW EXECUTE FUNCTION record_cost_configuration_history();
