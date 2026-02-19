CREATE TABLE "product_variants" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"sku" varchar(50),
	"price" numeric(10, 2),
	"stock" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "product_variants_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mockup_templates" ALTER COLUMN "perspective_config" SET DEFAULT '{}'::json;--> statement-breakpoint
ALTER TABLE "mockup_templates" ALTER COLUMN "perspective_config" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "mockup_templates" ADD COLUMN "mockup_image_url" varchar(500) NOT NULL;--> statement-breakpoint
ALTER TABLE "mockup_templates" ADD COLUMN "surfaces" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "mockup_templates" ADD COLUMN "default_transform" json DEFAULT '{"scale":1,"rotation":0}'::json;--> statement-breakpoint
ALTER TABLE "mockup_templates" ADD COLUMN "metadata" json;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "variant_id" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_method" varchar(50) DEFAULT 'pickup';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "zipnova_shipment_id" varchar(100);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "weight" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "height" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "width" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "length" integer;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mockup_templates" DROP COLUMN "base_image_url";