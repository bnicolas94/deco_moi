CREATE TABLE "addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"street" varchar(255) NOT NULL,
	"number" varchar(20),
	"floor" varchar(20),
	"apartment" varchar(20),
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"postal_code" varchar(20) NOT NULL,
	"country" varchar(100) DEFAULT 'Argentina',
	"phone" varchar(20),
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"image" varchar(255),
	"parent_id" integer,
	"order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "mockup_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"base_image_url" varchar(500) NOT NULL,
	"perspective_config" json NOT NULL,
	"surface_config" json,
	"camera_config" json,
	"design_presets" json,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "mockup_templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" integer NOT NULL,
	"product_name" varchar(200) NOT NULL,
	"product_sku" varchar(50),
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"customization" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"user_id" uuid,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"shipping_cost" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"payment_status" varchar(50) DEFAULT 'pending',
	"shipping_address_id" integer,
	"shipping_data" json,
	"notes" text,
	"customization_details" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"method" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"transaction_id" varchar(255),
	"metadata" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "price_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"min_quantity" integer NOT NULL,
	"max_quantity" integer,
	"discount_percentage" numeric(5, 2),
	"fixed_price" numeric(10, 2),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"description" text,
	"short_description" varchar(500),
	"sku" varchar(50),
	"base_price" numeric(10, 2) NOT NULL,
	"category_id" integer NOT NULL,
	"images" json DEFAULT '[]'::json,
	"specifications" json DEFAULT '{}'::json,
	"customization_options" json DEFAULT '{}'::json,
	"min_order" integer DEFAULT 1,
	"production_time" varchar(50),
	"stock" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"is_on_sale" boolean DEFAULT false,
	"sale_price" numeric(10, 2),
	"tags" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"mockup_template_id" integer,
	"allows_mockup" boolean DEFAULT false,
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"user_id" uuid,
	"author_name" varchar(100),
	"rating" integer NOT NULL,
	"title" varchar(200),
	"comment" text,
	"is_verified" boolean DEFAULT false,
	"is_approved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "site_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" json,
	"description" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "site_config_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(100),
	"phone" varchar(20),
	"password_hash" varchar(255),
	"role" varchar(20) DEFAULT 'customer' NOT NULL,
	"is_guest" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "mockup_templates" ADD CONSTRAINT "mockup_templates_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;