-- Durable queue for Mercado Libre order notifications.
CREATE TABLE IF NOT EXISTS "meli_order_import_queue" (
    "id" serial PRIMARY KEY,
    "meli_order_id" varchar(50) NOT NULL UNIQUE,
    "user_id" varchar(50) NOT NULL,
    "status" varchar(20) NOT NULL DEFAULT 'pending',
    "attempts" integer NOT NULL DEFAULT 0,
    "next_attempt_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_error" text,
    "payload" jsonb,
    "received_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" timestamp,
    "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "meli_order_import_queue_due_idx"
    ON "meli_order_import_queue" ("status", "next_attempt_at");
