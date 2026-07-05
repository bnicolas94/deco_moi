--
-- PostgreSQL database dump
--

-- Dumped from database version 17.7 (Debian 17.7-3.pgdg13+1)
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.supply_composition DROP CONSTRAINT IF EXISTS supply_composition_supply_id_supplies_id_fk;
ALTER TABLE IF EXISTS ONLY public.supply_composition DROP CONSTRAINT IF EXISTS supply_composition_parent_id_supplies_id_fk;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.product_variants DROP CONSTRAINT IF EXISTS product_variants_product_id_products_id_fk;
ALTER TABLE IF EXISTS ONLY public.product_supplies DROP CONSTRAINT IF EXISTS product_supplies_supply_id_supplies_id_fk;
ALTER TABLE IF EXISTS ONLY public.product_supplies DROP CONSTRAINT IF EXISTS product_supplies_product_id_products_id_fk;
ALTER TABLE IF EXISTS ONLY public.product_cost_items DROP CONSTRAINT IF EXISTS product_cost_items_product_id_products_id_fk;
ALTER TABLE IF EXISTS ONLY public.product_cost_items DROP CONSTRAINT IF EXISTS product_cost_items_cost_item_id_cost_items_id_fk;
ALTER TABLE IF EXISTS ONLY public.order_item_costs DROP CONSTRAINT IF EXISTS order_item_costs_order_item_id_order_items_id_fk;
ALTER TABLE IF EXISTS ONLY public.mockup_templates DROP CONSTRAINT IF EXISTS mockup_templates_product_id_products_id_fk;
ALTER TABLE IF EXISTS ONLY public.meli_item_links DROP CONSTRAINT IF EXISTS meli_item_links_product_id_products_id_fk;
DROP INDEX IF EXISTS public.meli_item_variation_idx;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_unique;
ALTER TABLE IF EXISTS ONLY public.unmatched_transfers DROP CONSTRAINT IF EXISTS unmatched_transfers_pkey;
ALTER TABLE IF EXISTS ONLY public.unmatched_transfers DROP CONSTRAINT IF EXISTS unmatched_transfers_mp_payment_id_unique;
ALTER TABLE IF EXISTS ONLY public.supply_composition DROP CONSTRAINT IF EXISTS supply_composition_pkey;
ALTER TABLE IF EXISTS ONLY public.supply_categories DROP CONSTRAINT IF EXISTS supply_categories_slug_unique;
ALTER TABLE IF EXISTS ONLY public.supply_categories DROP CONSTRAINT IF EXISTS supply_categories_pkey;
ALTER TABLE IF EXISTS ONLY public.supplies DROP CONSTRAINT IF EXISTS supplies_pkey;
ALTER TABLE IF EXISTS ONLY public.site_config DROP CONSTRAINT IF EXISTS site_config_pkey;
ALTER TABLE IF EXISTS ONLY public.site_config DROP CONSTRAINT IF EXISTS site_config_key_unique;
ALTER TABLE IF EXISTS ONLY public.shipping_real_costs DROP CONSTRAINT IF EXISTS shipping_real_costs_zone_unique;
ALTER TABLE IF EXISTS ONLY public.shipping_real_costs DROP CONSTRAINT IF EXISTS shipping_real_costs_pkey;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.reviews DROP CONSTRAINT IF EXISTS reviews_pkey;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_slug_unique;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_sku_unique;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_pkey;
ALTER TABLE IF EXISTS ONLY public.production_time_rules DROP CONSTRAINT IF EXISTS production_time_rules_pkey;
ALTER TABLE IF EXISTS ONLY public.product_variants DROP CONSTRAINT IF EXISTS product_variants_sku_unique;
ALTER TABLE IF EXISTS ONLY public.product_variants DROP CONSTRAINT IF EXISTS product_variants_pkey;
ALTER TABLE IF EXISTS ONLY public.product_supplies DROP CONSTRAINT IF EXISTS product_supplies_pkey;
ALTER TABLE IF EXISTS ONLY public.product_cost_items DROP CONSTRAINT IF EXISTS product_cost_items_pkey;
ALTER TABLE IF EXISTS ONLY public.price_rules DROP CONSTRAINT IF EXISTS price_rules_pkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_pkey;
ALTER TABLE IF EXISTS ONLY public.pages DROP CONSTRAINT IF EXISTS pages_slug_unique;
ALTER TABLE IF EXISTS ONLY public.pages DROP CONSTRAINT IF EXISTS pages_pkey;
ALTER TABLE IF EXISTS ONLY public.page_templates DROP CONSTRAINT IF EXISTS page_templates_pkey;
ALTER TABLE IF EXISTS ONLY public.orders DROP CONSTRAINT IF EXISTS orders_pkey;
ALTER TABLE IF EXISTS ONLY public.orders DROP CONSTRAINT IF EXISTS orders_order_number_unique;
ALTER TABLE IF EXISTS ONLY public.order_items DROP CONSTRAINT IF EXISTS order_items_pkey;
ALTER TABLE IF EXISTS ONLY public.order_item_costs DROP CONSTRAINT IF EXISTS order_item_costs_pkey;
ALTER TABLE IF EXISTS ONLY public.mockup_templates DROP CONSTRAINT IF EXISTS mockup_templates_slug_unique;
ALTER TABLE IF EXISTS ONLY public.mockup_templates DROP CONSTRAINT IF EXISTS mockup_templates_pkey;
ALTER TABLE IF EXISTS ONLY public.meli_sync_log DROP CONSTRAINT IF EXISTS meli_sync_log_pkey;
ALTER TABLE IF EXISTS ONLY public.meli_pricing_config DROP CONSTRAINT IF EXISTS meli_pricing_config_pkey;
ALTER TABLE IF EXISTS ONLY public.meli_orders DROP CONSTRAINT IF EXISTS meli_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.meli_orders DROP CONSTRAINT IF EXISTS meli_orders_meli_order_id_unique;
ALTER TABLE IF EXISTS ONLY public.meli_item_links DROP CONSTRAINT IF EXISTS meli_item_links_pkey;
ALTER TABLE IF EXISTS ONLY public.meli_credentials DROP CONSTRAINT IF EXISTS meli_credentials_pkey;
ALTER TABLE IF EXISTS ONLY public.home_blocks DROP CONSTRAINT IF EXISTS home_blocks_pkey;
ALTER TABLE IF EXISTS ONLY public.email_queue DROP CONSTRAINT IF EXISTS email_queue_pkey;
ALTER TABLE IF EXISTS ONLY public.cost_items DROP CONSTRAINT IF EXISTS cost_items_pkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_slug_unique;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE IF EXISTS ONLY public.addresses DROP CONSTRAINT IF EXISTS addresses_pkey;
ALTER TABLE IF EXISTS ONLY drizzle.__drizzle_migrations DROP CONSTRAINT IF EXISTS __drizzle_migrations_pkey;
ALTER TABLE IF EXISTS public.unmatched_transfers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.supply_composition ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.supply_categories ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.supplies ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.site_config ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.shipping_real_costs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.reviews ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.products ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.production_time_rules ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.product_variants ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.product_supplies ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.product_cost_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.price_rules ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.page_templates ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.order_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.order_item_costs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.mockup_templates ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.meli_sync_log ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.meli_pricing_config ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.meli_orders ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.meli_item_links ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.meli_credentials ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.home_blocks ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.email_queue ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.cost_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.categories ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.addresses ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS drizzle.__drizzle_migrations ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.unmatched_transfers_id_seq;
DROP TABLE IF EXISTS public.unmatched_transfers;
DROP SEQUENCE IF EXISTS public.supply_composition_id_seq;
DROP TABLE IF EXISTS public.supply_composition;
DROP SEQUENCE IF EXISTS public.supply_categories_id_seq;
DROP TABLE IF EXISTS public.supply_categories;
DROP SEQUENCE IF EXISTS public.supplies_id_seq;
DROP TABLE IF EXISTS public.supplies;
DROP SEQUENCE IF EXISTS public.site_config_id_seq;
DROP TABLE IF EXISTS public.site_config;
DROP SEQUENCE IF EXISTS public.shipping_real_costs_id_seq;
DROP TABLE IF EXISTS public.shipping_real_costs;
DROP TABLE IF EXISTS public.sessions;
DROP SEQUENCE IF EXISTS public.reviews_id_seq;
DROP TABLE IF EXISTS public.reviews;
DROP SEQUENCE IF EXISTS public.products_id_seq;
DROP TABLE IF EXISTS public.products;
DROP SEQUENCE IF EXISTS public.production_time_rules_id_seq;
DROP TABLE IF EXISTS public.production_time_rules;
DROP SEQUENCE IF EXISTS public.product_variants_id_seq;
DROP TABLE IF EXISTS public.product_variants;
DROP SEQUENCE IF EXISTS public.product_supplies_id_seq;
DROP TABLE IF EXISTS public.product_supplies;
DROP SEQUENCE IF EXISTS public.product_cost_items_id_seq;
DROP TABLE IF EXISTS public.product_cost_items;
DROP SEQUENCE IF EXISTS public.price_rules_id_seq;
DROP TABLE IF EXISTS public.price_rules;
DROP TABLE IF EXISTS public.payments;
DROP TABLE IF EXISTS public.pages;
DROP SEQUENCE IF EXISTS public.page_templates_id_seq;
DROP TABLE IF EXISTS public.page_templates;
DROP TABLE IF EXISTS public.orders;
DROP SEQUENCE IF EXISTS public.order_items_id_seq;
DROP TABLE IF EXISTS public.order_items;
DROP SEQUENCE IF EXISTS public.order_item_costs_id_seq;
DROP TABLE IF EXISTS public.order_item_costs;
DROP SEQUENCE IF EXISTS public.mockup_templates_id_seq;
DROP TABLE IF EXISTS public.mockup_templates;
DROP SEQUENCE IF EXISTS public.meli_sync_log_id_seq;
DROP TABLE IF EXISTS public.meli_sync_log;
DROP SEQUENCE IF EXISTS public.meli_pricing_config_id_seq;
DROP TABLE IF EXISTS public.meli_pricing_config;
DROP SEQUENCE IF EXISTS public.meli_orders_id_seq;
DROP TABLE IF EXISTS public.meli_orders;
DROP SEQUENCE IF EXISTS public.meli_item_links_id_seq;
DROP TABLE IF EXISTS public.meli_item_links;
DROP SEQUENCE IF EXISTS public.meli_credentials_id_seq;
DROP TABLE IF EXISTS public.meli_credentials;
DROP SEQUENCE IF EXISTS public.home_blocks_id_seq;
DROP TABLE IF EXISTS public.home_blocks;
DROP SEQUENCE IF EXISTS public.email_queue_id_seq;
DROP TABLE IF EXISTS public.email_queue;
DROP SEQUENCE IF EXISTS public.cost_items_id_seq;
DROP TABLE IF EXISTS public.cost_items;
DROP SEQUENCE IF EXISTS public.categories_id_seq;
DROP TABLE IF EXISTS public.categories;
DROP SEQUENCE IF EXISTS public.addresses_id_seq;
DROP TABLE IF EXISTS public.addresses;
DROP SEQUENCE IF EXISTS drizzle.__drizzle_migrations_id_seq;
DROP TABLE IF EXISTS drizzle.__drizzle_migrations;
DROP SCHEMA IF EXISTS drizzle;
--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: postgres
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO postgres;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: postgres
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO postgres;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: postgres
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.addresses (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    street character varying(255) NOT NULL,
    number character varying(20),
    floor character varying(20),
    apartment character varying(20),
    city character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    postal_code character varying(20) NOT NULL,
    country character varying(100) DEFAULT 'Argentina'::character varying,
    phone character varying(20),
    is_default boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.addresses OWNER TO postgres;

--
-- Name: addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.addresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.addresses_id_seq OWNER TO postgres;

--
-- Name: addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.addresses_id_seq OWNED BY public.addresses.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    image character varying(255),
    parent_id integer,
    "order" integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: cost_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cost_items (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    value numeric(10,2) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    is_global boolean DEFAULT false
);


ALTER TABLE public.cost_items OWNER TO postgres;

--
-- Name: cost_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cost_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cost_items_id_seq OWNER TO postgres;

--
-- Name: cost_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cost_items_id_seq OWNED BY public.cost_items.id;


--
-- Name: email_queue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_queue (
    id integer NOT NULL,
    order_id uuid NOT NULL,
    recipient_role character varying(20) NOT NULL,
    recipient_email character varying(255) NOT NULL,
    subject character varying(255) NOT NULL,
    html_body text NOT NULL,
    status character varying(50) DEFAULT 'failed'::character varying,
    error_log text,
    attempts integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.email_queue OWNER TO postgres;

--
-- Name: email_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.email_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_queue_id_seq OWNER TO postgres;

--
-- Name: email_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.email_queue_id_seq OWNED BY public.email_queue.id;


--
-- Name: home_blocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.home_blocks (
    id integer NOT NULL,
    type character varying(50) NOT NULL,
    settings json DEFAULT '{}'::json,
    "order" integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.home_blocks OWNER TO postgres;

--
-- Name: home_blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.home_blocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.home_blocks_id_seq OWNER TO postgres;

--
-- Name: home_blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.home_blocks_id_seq OWNED BY public.home_blocks.id;


--
-- Name: meli_credentials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.meli_credentials (
    id integer NOT NULL,
    ml_user_id character varying(50) NOT NULL,
    ml_user_nickname character varying(100),
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    app_id character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.meli_credentials OWNER TO postgres;

--
-- Name: meli_credentials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.meli_credentials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.meli_credentials_id_seq OWNER TO postgres;

--
-- Name: meli_credentials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.meli_credentials_id_seq OWNED BY public.meli_credentials.id;


--
-- Name: meli_item_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.meli_item_links (
    id integer NOT NULL,
    product_id integer NOT NULL,
    meli_item_id character varying(50) NOT NULL,
    meli_title character varying(255),
    meli_category_id character varying(50),
    meli_listing_type character varying(50),
    last_sync_at timestamp without time zone,
    sync_enabled boolean DEFAULT true,
    last_synced_price numeric(10,2),
    last_synced_stock integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    meli_variation_id character varying(50),
    pack_quantity integer DEFAULT 1
);


ALTER TABLE public.meli_item_links OWNER TO postgres;

--
-- Name: meli_item_links_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.meli_item_links_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.meli_item_links_id_seq OWNER TO postgres;

--
-- Name: meli_item_links_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.meli_item_links_id_seq OWNED BY public.meli_item_links.id;


--
-- Name: meli_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.meli_orders (
    id integer NOT NULL,
    meli_order_id character varying(50) NOT NULL,
    internal_order_id uuid,
    status character varying(30) NOT NULL,
    buyer_nickname character varying(100),
    buyer_email character varying(255),
    total_amount numeric(10,2) NOT NULL,
    net_amount numeric(10,2),
    ml_commission_amount numeric(10,2),
    currency character varying(10) DEFAULT 'ARS'::character varying,
    items json,
    payment_id character varying(50),
    shipping_id character varying(50),
    date_created timestamp without time zone NOT NULL,
    raw_data json,
    imported_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.meli_orders OWNER TO postgres;

--
-- Name: meli_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.meli_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.meli_orders_id_seq OWNER TO postgres;

--
-- Name: meli_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.meli_orders_id_seq OWNED BY public.meli_orders.id;


--
-- Name: meli_pricing_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.meli_pricing_config (
    id integer NOT NULL,
    scope character varying(20) DEFAULT 'global'::character varying NOT NULL,
    scope_id character varying(50),
    scope_label character varying(100),
    commission_pct numeric(5,2) NOT NULL,
    fixed_cost_threshold1 numeric(10,2) DEFAULT '15000'::numeric,
    fixed_cost_amount1 numeric(10,2) DEFAULT '1115'::numeric,
    fixed_cost_threshold2 numeric(10,2) DEFAULT '25000'::numeric,
    fixed_cost_amount2 numeric(10,2) DEFAULT '2300'::numeric,
    fixed_cost_threshold3 numeric(10,2) DEFAULT '33000'::numeric,
    fixed_cost_amount3 numeric(10,2) DEFAULT '2810'::numeric,
    extra_margin_pct numeric(5,2) DEFAULT '0'::numeric,
    installments_cost_pct numeric(5,2) DEFAULT '0'::numeric,
    rounding_strategy character varying(20) DEFAULT 'round'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    free_shipping_threshold numeric(10,2) DEFAULT '30000'::numeric,
    free_shipping_cost numeric(10,2) DEFAULT '5000'::numeric
);


ALTER TABLE public.meli_pricing_config OWNER TO postgres;

--
-- Name: meli_pricing_config_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.meli_pricing_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.meli_pricing_config_id_seq OWNER TO postgres;

--
-- Name: meli_pricing_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.meli_pricing_config_id_seq OWNED BY public.meli_pricing_config.id;


--
-- Name: meli_sync_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.meli_sync_log (
    id integer NOT NULL,
    type character varying(30) NOT NULL,
    direction character varying(10) NOT NULL,
    product_id integer,
    meli_item_id character varying(50),
    meli_order_id character varying(50),
    status character varying(20) NOT NULL,
    details json,
    error_message text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.meli_sync_log OWNER TO postgres;

--
-- Name: meli_sync_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.meli_sync_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.meli_sync_log_id_seq OWNER TO postgres;

--
-- Name: meli_sync_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.meli_sync_log_id_seq OWNED BY public.meli_sync_log.id;


--
-- Name: mockup_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mockup_templates (
    id integer NOT NULL,
    product_id integer,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    mockup_image_url character varying(500) NOT NULL,
    perspective_config json DEFAULT '{}'::json,
    surface_config json,
    camera_config json,
    design_presets json,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    surfaces json DEFAULT '[]'::json,
    default_transform json DEFAULT '{"scale":1,"rotation":0}'::json,
    metadata json
);


ALTER TABLE public.mockup_templates OWNER TO postgres;

--
-- Name: mockup_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mockup_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mockup_templates_id_seq OWNER TO postgres;

--
-- Name: mockup_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mockup_templates_id_seq OWNED BY public.mockup_templates.id;


--
-- Name: order_item_costs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_item_costs (
    id integer NOT NULL,
    order_item_id integer NOT NULL,
    cost_item_name character varying(255) NOT NULL,
    cost_item_type character varying(50) NOT NULL,
    configured_value numeric(10,2) NOT NULL,
    calculated_amount numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.order_item_costs OWNER TO postgres;

--
-- Name: order_item_costs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_item_costs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_item_costs_id_seq OWNER TO postgres;

--
-- Name: order_item_costs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_item_costs_id_seq OWNED BY public.order_item_costs.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id uuid NOT NULL,
    product_id integer NOT NULL,
    product_name character varying(200) NOT NULL,
    product_sku character varying(50),
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    customization json,
    created_at timestamp without time zone DEFAULT now(),
    variant_id integer,
    production_time character varying(100)
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_id_seq OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_number character varying(50) NOT NULL,
    user_id uuid,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    discount_amount numeric(10,2) DEFAULT '0'::numeric,
    shipping_cost numeric(10,2) DEFAULT '0'::numeric,
    total numeric(10,2) NOT NULL,
    payment_method character varying(50) NOT NULL,
    payment_status character varying(50) DEFAULT 'pending'::character varying,
    shipping_address_id integer,
    shipping_data json,
    notes text,
    customization_details json,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    shipping_method character varying(50) DEFAULT 'pickup'::character varying,
    zipnova_shipment_id character varying(100)
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: page_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.page_templates (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    thumbnail character varying(255),
    blocks json DEFAULT '[]'::json,
    category character varying(50),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.page_templates OWNER TO postgres;

--
-- Name: page_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.page_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.page_templates_id_seq OWNER TO postgres;

--
-- Name: page_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.page_templates_id_seq OWNED BY public.page_templates.id;


--
-- Name: pages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(200) NOT NULL,
    slug character varying(200) NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying,
    blocks json DEFAULT '[]'::json,
    seo_title character varying(60),
    seo_description character varying(160),
    og_image character varying(255),
    published_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.pages OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    method character varying(50) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    amount numeric(10,2) NOT NULL,
    transaction_id character varying(255),
    metadata json,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: price_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.price_rules (
    id integer NOT NULL,
    product_id integer NOT NULL,
    min_quantity integer NOT NULL,
    max_quantity integer,
    discount_percentage numeric(5,2),
    fixed_price numeric(10,2),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.price_rules OWNER TO postgres;

--
-- Name: price_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.price_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.price_rules_id_seq OWNER TO postgres;

--
-- Name: price_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.price_rules_id_seq OWNED BY public.price_rules.id;


--
-- Name: product_cost_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_cost_items (
    id integer NOT NULL,
    product_id integer NOT NULL,
    cost_item_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.product_cost_items OWNER TO postgres;

--
-- Name: product_cost_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_cost_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_cost_items_id_seq OWNER TO postgres;

--
-- Name: product_cost_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_cost_items_id_seq OWNED BY public.product_cost_items.id;


--
-- Name: product_supplies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_supplies (
    id integer NOT NULL,
    product_id integer NOT NULL,
    supply_id integer NOT NULL,
    quantity numeric(10,3) DEFAULT '0'::numeric NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    parts_used numeric(10,3),
    parts_total numeric(10,3)
);


ALTER TABLE public.product_supplies OWNER TO postgres;

--
-- Name: product_supplies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_supplies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_supplies_id_seq OWNER TO postgres;

--
-- Name: product_supplies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_supplies_id_seq OWNED BY public.product_supplies.id;


--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_variants (
    id integer NOT NULL,
    product_id integer NOT NULL,
    name character varying(100) NOT NULL,
    sku character varying(50),
    price numeric(10,2),
    stock integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    images json DEFAULT '[]'::json
);


ALTER TABLE public.product_variants OWNER TO postgres;

--
-- Name: product_variants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_variants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_variants_id_seq OWNER TO postgres;

--
-- Name: product_variants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_variants_id_seq OWNED BY public.product_variants.id;


--
-- Name: production_time_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.production_time_rules (
    id integer NOT NULL,
    product_id integer NOT NULL,
    min_quantity integer NOT NULL,
    max_quantity integer,
    production_time character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.production_time_rules OWNER TO postgres;

--
-- Name: production_time_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.production_time_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.production_time_rules_id_seq OWNER TO postgres;

--
-- Name: production_time_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.production_time_rules_id_seq OWNED BY public.production_time_rules.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    slug character varying(200) NOT NULL,
    description text,
    short_description text,
    sku character varying(50),
    base_price numeric(10,2) NOT NULL,
    category_id integer NOT NULL,
    images json DEFAULT '[]'::json,
    specifications json DEFAULT '{}'::json,
    customization_options json DEFAULT '{}'::json,
    min_order integer DEFAULT 1,
    production_time character varying(50),
    stock integer DEFAULT 0,
    is_active boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    is_on_sale boolean DEFAULT false,
    sale_price numeric(10,2),
    tags json DEFAULT '[]'::json,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    mockup_template_id integer,
    allows_mockup boolean DEFAULT false,
    weight integer,
    height integer,
    width integer,
    length integer,
    show_discount_ranges boolean DEFAULT true
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    product_id integer NOT NULL,
    user_id uuid,
    author_name character varying(100),
    rating integer NOT NULL,
    title character varying(200),
    comment text,
    is_verified boolean DEFAULT false,
    is_approved boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reviews_id_seq OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id character varying(255) NOT NULL,
    user_id uuid NOT NULL,
    expires_at timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: shipping_real_costs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shipping_real_costs (
    id integer NOT NULL,
    zone character varying(150) NOT NULL,
    real_cost numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.shipping_real_costs OWNER TO postgres;

--
-- Name: shipping_real_costs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shipping_real_costs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shipping_real_costs_id_seq OWNER TO postgres;

--
-- Name: shipping_real_costs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shipping_real_costs_id_seq OWNED BY public.shipping_real_costs.id;


--
-- Name: site_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.site_config (
    id integer NOT NULL,
    key character varying(100) NOT NULL,
    value json,
    description text,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.site_config OWNER TO postgres;

--
-- Name: site_config_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.site_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.site_config_id_seq OWNER TO postgres;

--
-- Name: site_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.site_config_id_seq OWNED BY public.site_config.id;


--
-- Name: supplies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supplies (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    category character varying(50) NOT NULL,
    unit character varying(20) NOT NULL,
    unit_cost numeric(10,2) NOT NULL,
    stock integer DEFAULT 0,
    supplier character varying(100),
    link character varying(500),
    notes text,
    is_active boolean DEFAULT true,
    updated_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    parent_id integer,
    pack_price numeric(10,2),
    pack_quantity numeric(10,3),
    yield_ratio numeric(10,3),
    min_stock integer DEFAULT 20,
    last_scraped_price numeric(10,2),
    last_scraped_at timestamp without time zone
);


ALTER TABLE public.supplies OWNER TO postgres;

--
-- Name: supplies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.supplies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.supplies_id_seq OWNER TO postgres;

--
-- Name: supplies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.supplies_id_seq OWNED BY public.supplies.id;


--
-- Name: supply_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supply_categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    icon character varying(20),
    "order" integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.supply_categories OWNER TO postgres;

--
-- Name: supply_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.supply_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.supply_categories_id_seq OWNER TO postgres;

--
-- Name: supply_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.supply_categories_id_seq OWNED BY public.supply_categories.id;


--
-- Name: supply_composition; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supply_composition (
    id integer NOT NULL,
    supply_id integer NOT NULL,
    parent_id integer NOT NULL,
    yield_ratio numeric(10,3) DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.supply_composition OWNER TO postgres;

--
-- Name: supply_composition_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.supply_composition_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.supply_composition_id_seq OWNER TO postgres;

--
-- Name: supply_composition_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.supply_composition_id_seq OWNED BY public.supply_composition.id;


--
-- Name: unmatched_transfers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unmatched_transfers (
    id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    sender_dni character varying(50),
    mp_payment_id character varying(255),
    payment_date timestamp without time zone,
    raw_metadata json,
    status character varying(50) DEFAULT 'pending_review'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.unmatched_transfers OWNER TO postgres;

--
-- Name: unmatched_transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.unmatched_transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unmatched_transfers_id_seq OWNER TO postgres;

--
-- Name: unmatched_transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.unmatched_transfers_id_seq OWNED BY public.unmatched_transfers.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(100),
    phone character varying(20),
    password_hash character varying(255),
    is_guest boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    role character varying(20) DEFAULT 'customer'::character varying NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: postgres
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: addresses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses ALTER COLUMN id SET DEFAULT nextval('public.addresses_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: cost_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cost_items ALTER COLUMN id SET DEFAULT nextval('public.cost_items_id_seq'::regclass);


--
-- Name: email_queue id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_queue ALTER COLUMN id SET DEFAULT nextval('public.email_queue_id_seq'::regclass);


--
-- Name: home_blocks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_blocks ALTER COLUMN id SET DEFAULT nextval('public.home_blocks_id_seq'::regclass);


--
-- Name: meli_credentials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meli_credentials ALTER COLUMN id SET DEFAULT nextval('public.meli_credentials_id_seq'::regclass);


--
-- Name: meli_item_links id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meli_item_links ALTER COLUMN id SET DEFAULT nextval('public.meli_item_links_id_seq'::regclass);


--
-- Name: meli_orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meli_orders ALTER COLUMN id SET DEFAULT nextval('public.meli_orders_id_seq'::regclass);


--
-- Name: meli_pricing_config id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meli_pricing_config ALTER COLUMN id SET DEFAULT nextval('public.meli_pricing_config_id_seq'::regclass);


--
-- Name: meli_sync_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meli_sync_log ALTER COLUMN id SET DEFAULT nextval('public.meli_sync_log_id_seq'::regclass);


--
-- Name: mockup_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mockup_templates ALTER COLUMN id SET DEFAULT nextval('public.mockup_templates_id_seq'::regclass);


--
-- Name: order_item_costs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item_costs ALTER COLUMN id SET DEFAULT nextval('public.order_item_costs_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: page_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.page_templates ALTER COLUMN id SET DEFAULT nextval('public.page_templates_id_seq'::regclass);


--
-- Name: price_rules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_rules ALTER COLUMN id SET DEFAULT nextval('public.price_rules_id_seq'::regclass);


--
-- Name: product_cost_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_cost_items ALTER COLUMN id SET DEFAULT nextval('public.product_cost_items_id_seq'::regclass);


--
-- Name: product_supplies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_supplies ALTER COLUMN id SET DEFAULT nextval('public.product_supplies_id_seq'::regclass);


--
-- Name: product_variants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variants ALTER COLUMN id SET DEFAULT nextval('public.product_variants_id_seq'::regclass);


--
-- Name: production_time_rules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_time_rules ALTER COLUMN id SET DEFAULT nextval('public.production_time_rules_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: shipping_real_costs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping_real_costs ALTER COLUMN id SET DEFAULT nextval('public.shipping_real_costs_id_seq'::regclass);


--
-- Name: site_config id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_config ALTER COLUMN id SET DEFAULT nextval('public.site_config_id_seq'::regclass);


--
-- Name: supplies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplies ALTER COLUMN id SET DEFAULT nextval('public.supplies_id_seq'::regclass);


--
-- Name: supply_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supply_categories ALTER COLUMN id SET DEFAULT nextval('public.supply_categories_id_seq'::regclass);


--
-- Name: supply_composition id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supply_composition ALTER COLUMN id SET DEFAULT nextval('public.supply_composition_id_seq'::regclass);


--
-- Name: unmatched_transfers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unmatched_transfers ALTER COLUMN id SET DEFAULT nextval('public.unmatched_transfers_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: postgres
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
\.


--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.addresses (id, user_id, name, street, number, floor, apartment, city, state, postal_code, country, phone, is_default, created_at) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, slug, description, image, parent_id, "order", is_active, created_at, updated_at) FROM stdin;
5	Velas	velas	Velas aromáticas artesanales	\N	2	19	t	2026-02-11 13:49:58.094854	2026-02-11 13:49:58.094854
6	Tejidos	tejidos	Tejidos artesanales personalizados	\N	2	20	t	2026-02-11 13:49:58.330665	2026-02-11 13:49:58.330665
7	Estampitas	estampitas	Estampitas personalizadas	\N	2	21	t	2026-02-11 13:49:58.5645	2026-02-11 13:49:58.5645
3	Presentes	presentes	Regalos y presentes especiales	\N	1	22	t	2026-02-11 13:49:57.624404	2026-02-11 13:49:57.624404
20	Casuales	casuales	\N	\N	3	23	t	2026-02-20 17:10:23.297184	2026-02-20 17:10:23.297184
21	Premium	premium	\N	\N	3	24	t	2026-02-20 17:10:23.771151	2026-02-20 17:10:23.771151
17	Casuales	presentes-casuales	Regalos casuales para toda ocasión	\N	3	25	t	2026-02-11 13:50:00.871338	2026-02-11 13:50:00.871338
18	Premium	presentes-premium	Regalos premium de alta calidad	\N	3	26	t	2026-02-11 13:50:01.1088	2026-02-11 13:50:01.1088
19	Sin categorizar	sin-categorizar	\N	\N	\N	1	t	2026-02-20 17:10:21.842756	2026-02-20 17:10:21.842756
1	Productos	productos	Todos nuestros productos	\N	\N	2	t	2026-02-11 13:49:57.163948	2026-02-11 13:49:57.163948
22	Souvenirs	souvenir	\N	\N	1	3	t	2026-02-20 17:10:24.473295	2026-02-20 17:10:24.473295
23	Chocos Sueltos	chocos-sueltos	\N	\N	22	4	t	2026-02-20 17:10:26.100856	2026-02-20 17:10:26.100856
2	Souvenirs	souvenirs	Souvenirs personalizados para todo tipo de eventos	\N	1	5	t	2026-02-11 13:49:57.394379	2026-02-11 13:49:57.394379
4	Chocolates	chocolates	Chocolates personalizados artesanales	\N	2	6	t	2026-02-11 13:49:57.857267	2026-02-11 13:49:57.857267
8	Sueltos	chocolates-sueltos	Chocolates sueltos personalizados	\N	4	7	t	2026-02-11 13:49:58.794575	2026-02-11 13:49:58.794575
9	Cajitas de 2	cajitas-de-2	Cajas con 2 chocolates	\N	4	8	t	2026-02-11 13:49:59.024783	2026-02-11 13:49:59.024783
10	Cajitas de 4	cajitas-de-4	Cajas con 4 chocolates	\N	4	9	t	2026-02-11 13:49:59.254022	2026-02-11 13:49:59.254022
11	Cajitas de 6	cajitas-de-6	Cajas con 6 chocolates	\N	4	10	t	2026-02-11 13:49:59.485036	2026-02-11 13:49:59.485036
25	Clásicas	clasicas	\N	\N	11	11	t	2026-02-20 17:10:27.028985	2026-02-20 17:10:27.028985
26	Deluxe	deluxe	\N	\N	11	12	t	2026-02-20 17:10:27.490702	2026-02-20 17:10:27.490702
24	Gold	gold	\N	\N	11	13	t	2026-02-20 17:10:26.562618	2026-02-20 17:10:26.562618
14	Clásicas	cajitas-6-clasicas	Cajitas de 6 versión clásica	\N	11	14	t	2026-02-11 13:50:00.179435	2026-02-11 13:50:00.179435
15	Gold	cajitas-6-gold	Cajitas de 6 versión metalizada	\N	11	15	t	2026-02-11 13:50:00.409179	2026-02-11 13:50:00.409179
16	Deluxe	cajitas-6-deluxe	Cajitas de 6 versión premium	\N	11	16	t	2026-02-11 13:50:00.638863	2026-02-11 13:50:00.638863
12	Cajitas de 8	cajitas-de-8	Cajas con 8 chocolates	\N	4	17	t	2026-02-11 13:49:59.715251	2026-02-11 13:49:59.715251
13	Mini Recuerdos	mini-recuerdos	Mini souvenirs de chocolate	\N	4	18	t	2026-02-11 13:49:59.94786	2026-02-11 13:49:59.94786
\.


--
-- Data for Name: cost_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cost_items (id, name, type, value, is_active, created_at, updated_at, is_global) FROM stdin;
5	Comison MP	percentage	8.00	t	2026-02-21 17:18:48.659105	2026-02-21 17:18:48.659105	t
6	IIBB	percentage	3.00	t	2026-02-21 17:23:55.509013	2026-05-08 17:39:39.125	t
\.


--
-- Data for Name: email_queue; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_queue (id, order_id, recipient_role, recipient_email, subject, html_body, status, error_log, attempts, created_at, updated_at) FROM stdin;
1	543705b3-5d54-4db1-bd66-fecddd0b926a	admin	info@decomoi.com.ar	🛍️ Nueva venta confirmada — Orden #DEC-751910 — $9.900 ARS	\n    <!DOCTYPE html>\n    <html lang="es">\n    <head>\n        <meta charset="UTF-8">\n        <meta name="viewport" content="width=device-width, initial-scale=1.0">\n        <title>Nueva Venta Confirmada</title>\n        <style>\n            body { font-family: Arial, sans-serif; color: #1A1A1A; line-height: 1.6; }\n            .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n            .header { background-color: #8B7355; color: white; padding: 15px; text-align: center; font-size: 20px; font-weight: bold; }\n            .section { margin-top: 20px; }\n            .section-title { font-size: 18px; font-weight: bold; border-bottom: 2px solid #E8C4A6; padding-bottom: 5px; margin-bottom: 10px; }\n            table { width: 100%; border-collapse: collapse; margin-top: 10px; }\n            th { background-color: #f7f7f7; padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }\n            .button { display: inline-block; background-color: #8B7355; color: white !important; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 4px; margin-top: 20px; text-align: center; }\n            .totals { margin-top: 20px; text-align: right; }\n            .totals p { margin: 5px 0; }\n        </style>\n    </head>\n    <body>\n        <div class="container">\n            <div class="header">\n                🛍️ Nueva orden confirmada #DEC-751910\n            </div>\n            \n            <div style="text-align: center; margin-top: 10px; font-size: 14px; color: #555;">\n                Fecha: 20/2/2026, 06:51:53\n            </div>\n\n            <div class="section">\n                <div class="section-title">Datos del Cliente</div>\n                <p><strong>Nombre:</strong> Administrador</p>\n                <p><strong>Email:</strong> admin@decomoi.com</p>\n                <p><strong>Teléfono:</strong> 1138172431</p>\n            </div>\n\n            <div class="section">\n                <div class="section-title">Productos Comprados</div>\n                <table>\n                    <thead>\n                        <tr>\n                            <th>Producto</th>\n                            <th>SKU</th>\n                            <th>Cant.</th>\n                            <th>P. Unit.</th>\n                            <th>Subtotal</th>\n                            <th>Detalles</th>\n                        </tr>\n                    </thead>\n                    <tbody>\n                        \n        <tr>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">10 Choco Cintas</td>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">PROD-6959</td>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">1</td>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">$11.000</td>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">$11.000</td>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">\n                -\n            </td>\n        </tr>\n    \n                    </tbody>\n                </table>\n            </div>\n\n            <div class="totals">\n                <p><strong>Subtotal:</strong> $11.000</p>\n                \n                <p><strong>Costo de Envío:</strong> $0</p>\n                <p style="font-size: 18px; font-weight: bold;">Total Cobrado: $9.900</p>\n                <p><strong>Método de pago:</strong> transfer</p>\n            </div>\n\n            <div class="section">\n                <div class="section-title">Datos de Envío</div>\n                <p><strong>Dirección:</strong> Lincoln 1242  , Wilde, Bs As, undefined</p>\n                <p><strong>Zona / Método:</strong> pickup</p>\n                <p><strong>Tiempo estimado:</strong> No especificado</p>\n            </div>\n\n            \n\n            <div style="text-align: center;">\n                <a href="undefined/admin/orders/543705b3-5d54-4db1-bd66-fecddd0b926a" class="button">Ver orden en el admin</a>\n            </div>\n        </div>\n    </body>\n    </html>\n    	failed	Missing credentials for "PLAIN"	3	2026-02-20 21:53:42.064256	2026-02-20 21:53:42.064256
2	543705b3-5d54-4db1-bd66-fecddd0b926a	client	admin@decomoi.com	¡Tu pedido está confirmado! Orden #DEC-751910	\n    <!DOCTYPE html>\n    <html lang="es">\n    <head>\n        <meta charset="UTF-8">\n        <meta name="viewport" content="width=device-width, initial-scale=1.0">\n        <title>¡Tu pedido está confirmado!</title>\n        <style>\n            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1A1A1A; line-height: 1.6; background-color: #f9f9f9; padding: 20px; }\n            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }\n            .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #E8C4A6; }\n            .logo { width: 150px; height: auto; margin-bottom: 15px; } /* Usamos texto si no hay logo absoluto, o ajusta la URL */\n            .logo-text { font-size: 28px; font-weight: bold; color: #8B7355; letter-spacing: 2px; text-transform: uppercase; margin: 0; }\n            h1 { font-size: 24px; color: #8B7355; margin-bottom: 10px; }\n            .greeting { font-size: 16px; margin-bottom: 20px; }\n            .order-info { background-color: #fdfbf7; padding: 15px; border-radius: 6px; margin-bottom: 25px; font-size: 14px; }\n            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }\n            th { text-align: left; padding: 12px; font-size: 14px; color: #8B7355; border-bottom: 2px solid #E8C4A6; }\n            .totals { text-align: right; margin-top: 15px; }\n            .totals p { margin: 5px 0; font-size: 15px; }\n            .total-highlight { font-size: 18px; font-weight: bold; color: #8B7355; margin-top: 10px; padding-top: 10px; border-top: 1px solid #E8C4A6; }\n            .section-title { font-size: 18px; color: #8B7355; margin-top: 30px; margin-bottom: 10px; font-weight: bold; }\n            .shipping-info { background-color: #f5f5f5; padding: 15px; border-radius: 6px; }\n            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }\n            .footer a { color: #8B7355; text-decoration: none; font-weight: bold; }\n        </style>\n    </head>\n    <body>\n        <div class="container">\n            <div class="header">\n                <!-- <img src="URL_DEL_LOGO" alt="Deco Moi" class="logo"> -->\n                <p class="logo-text">Deco Moi</p>\n            </div>\n            \n            <div class="greeting">\n                <h1>¡Gracias por tu compra, Administrador!</h1>\n                <p>Tu pedido <strong>#DEC-751910</strong> está confirmado y ya estamos trabajando en él. 🎉</p>\n            </div>\n\n            <div class="order-info">\n                <strong>Número de orden:</strong> #DEC-751910<br>\n                <strong>Fecha:</strong> 20/2/2026<br>\n                <strong>Método de pago:</strong> Transferencia Bancaria\n            </div>\n\n            <table>\n                <thead>\n                    <tr>\n                        <th>Producto</th>\n                        <th style="text-align: center;">Cant.</th>\n                        <th style="text-align: right;">Unit.</th>\n                        <th style="text-align: right;">Subtotal</th>\n                    </tr>\n                </thead>\n                <tbody>\n                    \n        <tr>\n            <td style="padding: 12px; border-bottom: 1px solid #eee;">\n                10 Choco Cintas\n                \n            </td>\n            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">1</td>\n            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$11.000</td>\n            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$11.000</td>\n        </tr>\n    \n                </tbody>\n            </table>\n\n            <div class="totals">\n                <p>Subtotal: $11.000</p>\n                \n                <p>Costo de Envío: $0</p>\n                <div class="total-highlight">\n                    Total Pagado: $9.900\n                </div>\n            </div>\n\n            <div class="section-title">Datos de Envío</div>\n            <div class="shipping-info">\n                <p><strong>Dirección:</strong> Lincoln 1242  , Wilde, Bs As, undefined</p>\n                <p><strong>Zona y tiempo estimado:</strong> No especificado (pickup)</p>\n                <!-- <p><em>* Recuerda que el tiempo total suma los días de producción más el tiempo de envío.</em></p> -->\n            </div>\n\n            <div style="margin-top: 30px; background-color: #fdfbf7; padding: 15px; border-radius: 6px; text-align: center;">\n                <p style="margin: 0;"><strong>Próximos pasos:</strong> Te avisaremos por email cuando tu pedido esté listo para ser despachado o retirado según tu elección.</p>\n            </div>\n\n            <div class="footer">\n                <p>¿Tenés alguna duda? Contactanos por <a href="https://wa.me/undefined">WhatsApp</a> o en <a href="https://instagram.com/deco.moi">Instagram (@deco.moi)</a>.</p>\n                <p>&copy; 2026 Deco Moi. Todos los derechos reservados.</p>\n            </div>\n        </div>\n    </body>\n    </html>\n    	failed	Missing credentials for "PLAIN"	3	2026-02-20 21:53:43.748404	2026-02-20 21:53:43.748404
3	59efce92-3ae8-4971-9549-6998f22bfd54	client	nico.leo.busto@gmail.com	¡Tu pedido ya casi está! Orden #DEC-530932	\n    <!DOCTYPE html>\n    <html lang="es">\n    <head>\n        <meta charset="UTF-8">\n        <meta name="viewport" content="width=device-width, initial-scale=1.0">\n        <title>¡Tu pedido está confirmado!</title>\n        <style>\n            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1A1A1A; line-height: 1.6; background-color: #f9f9f9; padding: 20px; }\n            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }\n            .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #E8C4A6; }\n            .logo { width: 150px; height: auto; margin-bottom: 15px; } /* Usamos texto si no hay logo absoluto, o ajusta la URL */\n            .logo-text { font-size: 28px; font-weight: bold; color: #8B7355; letter-spacing: 2px; text-transform: uppercase; margin: 0; }\n            h1 { font-size: 24px; color: #8B7355; margin-bottom: 10px; }\n            .greeting { font-size: 16px; margin-bottom: 20px; }\n            .order-info { background-color: #fdfbf7; padding: 15px; border-radius: 6px; margin-bottom: 25px; font-size: 14px; }\n            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }\n            th { text-align: left; padding: 12px; font-size: 14px; color: #8B7355; border-bottom: 2px solid #E8C4A6; }\n            .totals { text-align: right; margin-top: 15px; }\n            .totals p { margin: 5px 0; font-size: 15px; }\n            .total-highlight { font-size: 18px; font-weight: bold; color: #8B7355; margin-top: 10px; padding-top: 10px; border-top: 1px solid #E8C4A6; }\n            .section-title { font-size: 18px; color: #8B7355; margin-top: 30px; margin-bottom: 10px; font-weight: bold; }\n            .shipping-info { background-color: #f5f5f5; padding: 15px; border-radius: 6px; }\n            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }\n            .footer a { color: #8B7355; text-decoration: none; font-weight: bold; }\n        </style>\n    </head>\n    <body>\n        <div class="container">\n            <div class="header">\n                <!-- <img src="URL_DEL_LOGO" alt="Deco Moi" class="logo"> -->\n                <p class="logo-text">Deco Moi</p>\n            </div>\n            \n            <div class="greeting">\n                <h1>¡Gracias por tu compra, 1!</h1>\n                <p>Tu pedido <strong>#DEC-530932</strong> está registrado y esperando tu pago.</p>\n            </div>\n\n            \n            <div style="background-color: #fdfaf6; padding: 20px; border-radius: 6px; margin-bottom: 25px; border: 1px solid #E8C4A6;">\n                <h2 style="font-size: 18px; color: #8B7355; margin-top: 0;">Realizá tu transferencia por $90</h2>\n                <p style="margin: 5px 0;"><strong>Titular:</strong> Magali Jessica Benua</p>\n                <p style="margin: 5px 0;"><strong>CVU / Alias:</strong> bnicolas.mp</p>\n                <p style="margin-top: 15px; font-size: 13px; color: #666; line-height: 1.4;">⚠️ <strong>Atención:</strong> Por favor, asegurate de transferir desde la cuenta a nombre del DNI que ingresaste en la compra. Nuestro sistema detectará el ingreso automáticamente. Si preferís asegurar, envíanos el comprobante al WhatsApp.</p>\n            </div>\n            \n\n            <div class="order-info">\n                <strong>Número de orden:</strong> #DEC-530932<br>\n                <strong>Fecha:</strong> 21/2/2026<br>\n                <strong>Método de pago:</strong> Transferencia Bancaria\n            </div>\n\n            <table>\n                <thead>\n                    <tr>\n                        <th>Producto</th>\n                        <th style="text-align: center;">Cant.</th>\n                        <th style="text-align: right;">Unit.</th>\n                        <th style="text-align: right;">Subtotal</th>\n                    </tr>\n                </thead>\n                <tbody>\n                    \n        <tr>\n            <td style="padding: 12px; border-bottom: 1px solid #eee;">\n                test\n                \n            </td>\n            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">1</td>\n            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$100</td>\n            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$100</td>\n        </tr>\n    \n                </tbody>\n            </table>\n\n            <div class="totals">\n                <p>Subtotal: $100</p>\n                \n                <p>Costo de Envío: $0</p>\n                <div class="total-highlight">\n                    Total Pagado: $90\n                </div>\n            </div>\n\n            <div class="section-title">Datos de Envío</div>\n            <div class="shipping-info">\n                <p><strong>Dirección:</strong> 1 1  , 1, 1, undefined</p>\n                <p><strong>Zona y tiempo estimado:</strong> No especificado (pickup)</p>\n                <!-- <p><em>* Recuerda que el tiempo total suma los días de producción más el tiempo de envío.</em></p> -->\n            </div>\n\n            <div style="margin-top: 30px; background-color: #fdfbf7; padding: 15px; border-radius: 6px; text-align: center;">\n                <p style="margin: 0;"><strong>Próximos pasos:</strong> Te avisaremos por email cuando tu pedido esté listo para ser despachado o retirado según tu elección.</p>\n            </div>\n\n            <div class="footer">\n                <p>¿Tenés alguna duda? Contactanos por <a href="https://wa.me/541138172431">WhatsApp</a> o en <a href="https://instagram.com/deco.moi">Instagram (@deco.moi)</a>.</p>\n                <p>&copy; 2026 Deco Moi. Todos los derechos reservados.</p>\n            </div>\n        </div>\n    </body>\n    </html>\n    	failed	Connection timeout	3	2026-02-21 18:04:45.661447	2026-02-21 18:04:45.661447
4	59efce92-3ae8-4971-9549-6998f22bfd54	admin	nico.leo.busto@gmail.com	🛍️ Nueva venta registrada — Orden #DEC-530932 — $90 ARS	\n    <!DOCTYPE html>\n    <html lang="es">\n    <head>\n        <meta charset="UTF-8">\n        <meta name="viewport" content="width=device-width, initial-scale=1.0">\n        <title>Nueva Venta Confirmada</title>\n        <style>\n            body { font-family: Arial, sans-serif; color: #1A1A1A; line-height: 1.6; }\n            .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n            .header { background-color: #8B7355; color: white; padding: 15px; text-align: center; font-size: 20px; font-weight: bold; }\n            .section { margin-top: 20px; }\n            .section-title { font-size: 18px; font-weight: bold; border-bottom: 2px solid #E8C4A6; padding-bottom: 5px; margin-bottom: 10px; }\n            table { width: 100%; border-collapse: collapse; margin-top: 10px; }\n            th { background-color: #f7f7f7; padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }\n            .button { display: inline-block; background-color: #8B7355; color: white !important; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 4px; margin-top: 20px; text-align: center; }\n            .totals { margin-top: 20px; text-align: right; }\n            .totals p { margin: 5px 0; }\n        </style>\n    </head>\n    <body>\n        <div class="container">\n            <div class="header">\n                🛍️ Nueva orden confirmada #DEC-530932\n            </div>\n            \n            <div style="text-align: center; margin-top: 10px; font-size: 14px; color: #555;">\n                Fecha: 21/2/2026, 05:52:39\n            </div>\n\n            <div class="section">\n                <div class="section-title">Datos del Cliente</div>\n                <p><strong>Nombre:</strong> 1</p>\n                <p><strong>Email:</strong> nico.leo.busto@gmail.com</p>\n                <p><strong>Teléfono:</strong> 1</p>\n            </div>\n\n            <div class="section">\n                <div class="section-title">Productos Comprados</div>\n                <table>\n                    <thead>\n                        <tr>\n                            <th>Producto</th>\n                            <th>SKU</th>\n                            <th>Cant.</th>\n                            <th>P. Unit.</th>\n                            <th>Subtotal</th>\n                            <th>Detalles</th>\n                        </tr>\n                    </thead>\n                    <tbody>\n                        \n        <tr>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">test</td>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">-</td>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">1</td>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">$100</td>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">$100</td>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">\n                -\n            </td>\n        </tr>\n    \n                    </tbody>\n                </table>\n            </div>\n\n            <div class="totals">\n                <p><strong>Subtotal:</strong> $100</p>\n                \n                <p><strong>Costo de Envío:</strong> $0</p>\n                <p style="font-size: 18px; font-weight: bold;">Total Cobrado: $90</p>\n                <p><strong>Método de pago:</strong> transfer</p>\n            </div>\n\n            <div class="section">\n                <div class="section-title">Datos de Envío</div>\n                <p><strong>Dirección:</strong> 1 1  , 1, 1, undefined</p>\n                <p><strong>Zona / Método:</strong> pickup</p>\n                <p><strong>Tiempo estimado:</strong> No especificado</p>\n            </div>\n\n            \n\n            <div style="text-align: center;">\n                <a href="https://decomoi.com.ar/admin/orders/59efce92-3ae8-4971-9549-6998f22bfd54" class="button">Ver orden en el admin</a>\n            </div>\n        </div>\n    </body>\n    </html>\n    	failed	Connection timeout	3	2026-02-21 18:04:45.815518	2026-02-21 18:04:45.815518
5	fc9d6575-ad4a-4814-8e2f-74e795a7e4fa	admin	nico.leo.busto@gmail.com	🛍️ Nueva venta registrada — Orden #DEC-297260 — $90 ARS	\n    <!DOCTYPE html>\n    <html lang="es">\n    <head>\n        <meta charset="UTF-8">\n        <meta name="viewport" content="width=device-width, initial-scale=1.0">\n        <title>Nueva Venta Confirmada</title>\n        <style>\n            body { font-family: Arial, sans-serif; color: #1A1A1A; line-height: 1.6; }\n            .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n            .header { background-color: #8B7355; color: white; padding: 15px; text-align: center; font-size: 20px; font-weight: bold; }\n            .section { margin-top: 20px; }\n            .section-title { font-size: 18px; font-weight: bold; border-bottom: 2px solid #E8C4A6; padding-bottom: 5px; margin-bottom: 10px; }\n            table { width: 100%; border-collapse: collapse; margin-top: 10px; }\n            th { background-color: #f7f7f7; padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }\n            .button { display: inline-block; background-color: #8B7355; color: white !important; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 4px; margin-top: 20px; text-align: center; }\n            .totals { margin-top: 20px; text-align: right; }\n            .totals p { margin: 5px 0; }\n        </style>\n    </head>\n    <body>\n        <div class="container">\n            <div class="header">\n                🛍️ Nueva orden confirmada #DEC-297260\n            </div>\n            \n            <div style="text-align: center; margin-top: 10px; font-size: 14px; color: #555;">\n                Fecha: 21/2/2026, 08:01:39\n            </div>\n\n            <div class="section">\n                <div class="section-title">Datos del Cliente</div>\n                <p><strong>Nombre:</strong> Nicolas Busto</p>\n                <p><strong>Email:</strong> nico.leo.busto@gmail.com</p>\n                <p><strong>Teléfono:</strong> 1138172431</p>\n            </div>\n\n            <div class="section">\n                <div class="section-title">Productos Comprados</div>\n                <table>\n                    <thead>\n                        <tr>\n                            <th>Producto</th>\n                            <th>SKU</th>\n                            <th>Cant.</th>\n                            <th>P. Unit.</th>\n                            <th>Subtotal</th>\n                            <th>Detalles</th>\n                        </tr>\n                    </thead>\n                    <tbody>\n                        \n        <tr>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">test</td>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">-</td>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">1</td>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">$100</td>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">$100</td>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">\n                -\n            </td>\n        </tr>\n    \n                    </tbody>\n                </table>\n            </div>\n\n            <div class="totals">\n                <p><strong>Subtotal:</strong> $100</p>\n                \n                <p><strong>Costo de Envío:</strong> $0</p>\n                <p style="font-size: 18px; font-weight: bold;">Total Cobrado: $90</p>\n                <p><strong>Método de pago:</strong> transfer</p>\n            </div>\n\n            <div class="section">\n                <div class="section-title">Datos de Envío</div>\n                <p><strong>Dirección:</strong> Lincoln 1242  , Wilde, Buenos Aires, undefined</p>\n                <p><strong>Zona / Método:</strong> pickup</p>\n                <p><strong>Tiempo estimado:</strong> No especificado</p>\n            </div>\n\n            \n\n            <div style="text-align: center;">\n                <a href="https://decomoi.com.ar/admin/orders/fc9d6575-ad4a-4814-8e2f-74e795a7e4fa" class="button">Ver orden en el admin</a>\n            </div>\n        </div>\n    </body>\n    </html>\n    	failed	Connection timeout	3	2026-02-21 20:13:45.653564	2026-02-21 20:13:45.653564
6	fc9d6575-ad4a-4814-8e2f-74e795a7e4fa	client	nico.leo.busto@gmail.com	¡Tu pedido ya casi está! Orden #DEC-297260	\n    <!DOCTYPE html>\n    <html lang="es">\n    <head>\n        <meta charset="UTF-8">\n        <meta name="viewport" content="width=device-width, initial-scale=1.0">\n        <title>¡Tu pedido está confirmado!</title>\n        <style>\n            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1A1A1A; line-height: 1.6; background-color: #f9f9f9; padding: 20px; }\n            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }\n            .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #E8C4A6; }\n            .logo { width: 150px; height: auto; margin-bottom: 15px; } /* Usamos texto si no hay logo absoluto, o ajusta la URL */\n            .logo-text { font-size: 28px; font-weight: bold; color: #8B7355; letter-spacing: 2px; text-transform: uppercase; margin: 0; }\n            h1 { font-size: 24px; color: #8B7355; margin-bottom: 10px; }\n            .greeting { font-size: 16px; margin-bottom: 20px; }\n            .order-info { background-color: #fdfbf7; padding: 15px; border-radius: 6px; margin-bottom: 25px; font-size: 14px; }\n            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }\n            th { text-align: left; padding: 12px; font-size: 14px; color: #8B7355; border-bottom: 2px solid #E8C4A6; }\n            .totals { text-align: right; margin-top: 15px; }\n            .totals p { margin: 5px 0; font-size: 15px; }\n            .total-highlight { font-size: 18px; font-weight: bold; color: #8B7355; margin-top: 10px; padding-top: 10px; border-top: 1px solid #E8C4A6; }\n            .section-title { font-size: 18px; color: #8B7355; margin-top: 30px; margin-bottom: 10px; font-weight: bold; }\n            .shipping-info { background-color: #f5f5f5; padding: 15px; border-radius: 6px; }\n            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }\n            .footer a { color: #8B7355; text-decoration: none; font-weight: bold; }\n        </style>\n    </head>\n    <body>\n        <div class="container">\n            <div class="header">\n                <!-- <img src="URL_DEL_LOGO" alt="Deco Moi" class="logo"> -->\n                <p class="logo-text">Deco Moi</p>\n            </div>\n            \n            <div class="greeting">\n                <h1>¡Gracias por tu compra, Nicolas Busto!</h1>\n                <p>Tu pedido <strong>#DEC-297260</strong> está registrado y esperando tu pago.</p>\n            </div>\n\n            \n            <div style="background-color: #fdfaf6; padding: 20px; border-radius: 6px; margin-bottom: 25px; border: 1px solid #E8C4A6;">\n                <h2 style="font-size: 18px; color: #8B7355; margin-top: 0;">Realizá tu transferencia por $90</h2>\n                <p style="margin: 5px 0;"><strong>Titular:</strong> Magali Jessica Benua</p>\n                <p style="margin: 5px 0;"><strong>CVU / Alias:</strong> decomoi.mp</p>\n                <p style="margin-top: 15px; font-size: 13px; color: #666; line-height: 1.4;">⚠️ <strong>Atención:</strong> Por favor, asegurate de transferir desde la cuenta a nombre del DNI que ingresaste en la compra. Nuestro sistema detectará el ingreso automáticamente. Si preferís asegurar, envíanos el comprobante al WhatsApp.</p>\n            </div>\n            \n\n            <div class="order-info">\n                <strong>Número de orden:</strong> #DEC-297260<br>\n                <strong>Fecha:</strong> 21/2/2026<br>\n                <strong>Método de pago:</strong> Transferencia Bancaria\n            </div>\n\n            <table>\n                <thead>\n                    <tr>\n                        <th>Producto</th>\n                        <th style="text-align: center;">Cant.</th>\n                        <th style="text-align: right;">Unit.</th>\n                        <th style="text-align: right;">Subtotal</th>\n                    </tr>\n                </thead>\n                <tbody>\n                    \n        <tr>\n            <td style="padding: 12px; border-bottom: 1px solid #eee;">\n                test\n                \n            </td>\n            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">1</td>\n            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$100</td>\n            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$100</td>\n        </tr>\n    \n                </tbody>\n            </table>\n\n            <div class="totals">\n                <p>Subtotal: $100</p>\n                \n                <p>Costo de Envío: $0</p>\n                <div class="total-highlight">\n                    Total Pagado: $90\n                </div>\n            </div>\n\n            <div class="section-title">Datos de Envío</div>\n            <div class="shipping-info">\n                <p><strong>Dirección:</strong> Lincoln 1242  , Wilde, Buenos Aires, undefined</p>\n                <p><strong>Zona y tiempo estimado:</strong> No especificado (pickup)</p>\n                <!-- <p><em>* Recuerda que el tiempo total suma los días de producción más el tiempo de envío.</em></p> -->\n            </div>\n\n            <div style="margin-top: 30px; background-color: #fdfbf7; padding: 15px; border-radius: 6px; text-align: center;">\n                <p style="margin: 0;"><strong>Próximos pasos:</strong> Te avisaremos por email cuando tu pedido esté listo para ser despachado o retirado según tu elección.</p>\n            </div>\n\n            <div class="footer">\n                <p>¿Tenés alguna duda? Contactanos por <a href="https://wa.me/541138172431">WhatsApp</a> o en <a href="https://instagram.com/deco.moi">Instagram (@deco.moi)</a>.</p>\n                <p>&copy; 2026 Deco Moi. Todos los derechos reservados.</p>\n            </div>\n        </div>\n    </body>\n    </html>\n    	failed	Connection timeout	3	2026-02-21 20:13:45.653988	2026-02-21 20:13:45.653988
7	fc9d6575-ad4a-4814-8e2f-74e795a7e4fa	admin	nico.leo.busto@gmail.com	🛍️ Nueva venta registrada — Orden #DEC-297260 — $90 ARS	\n    <!DOCTYPE html>\n    <html lang="es">\n    <head>\n        <meta charset="UTF-8">\n        <meta name="viewport" content="width=device-width, initial-scale=1.0">\n        <title>Nueva Venta Confirmada</title>\n        <style>\n            body { font-family: Arial, sans-serif; color: #1A1A1A; line-height: 1.6; }\n            .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n            .header { background-color: #8B7355; color: white; padding: 15px; text-align: center; font-size: 20px; font-weight: bold; }\n            .section { margin-top: 20px; }\n            .section-title { font-size: 18px; font-weight: bold; border-bottom: 2px solid #E8C4A6; padding-bottom: 5px; margin-bottom: 10px; }\n            table { width: 100%; border-collapse: collapse; margin-top: 10px; }\n            th { background-color: #f7f7f7; padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }\n            .button { display: inline-block; background-color: #8B7355; color: white !important; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 4px; margin-top: 20px; text-align: center; }\n            .totals { margin-top: 20px; text-align: right; }\n            .totals p { margin: 5px 0; }\n        </style>\n    </head>\n    <body>\n        <div class="container">\n            <div class="header">\n                🛍️ Nueva orden confirmada #DEC-297260\n            </div>\n            \n            <div style="text-align: center; margin-top: 10px; font-size: 14px; color: #555;">\n                Fecha: 21/2/2026, 08:03:56\n            </div>\n\n            <div class="section">\n                <div class="section-title">Datos del Cliente</div>\n                <p><strong>Nombre:</strong> Nicolas Busto</p>\n                <p><strong>Email:</strong> nico.leo.busto@gmail.com</p>\n                <p><strong>Teléfono:</strong> 1138172431</p>\n            </div>\n\n            <div class="section">\n                <div class="section-title">Productos Comprados</div>\n                <table>\n                    <thead>\n                        <tr>\n                            <th>Producto</th>\n                            <th>SKU</th>\n                            <th>Cant.</th>\n                            <th>P. Unit.</th>\n                            <th>Subtotal</th>\n                            <th>Detalles</th>\n                        </tr>\n                    </thead>\n                    <tbody>\n                        \n        <tr>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">test</td>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">-</td>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">1</td>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">$100</td>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">$100</td>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">\n                -\n            </td>\n        </tr>\n    \n                    </tbody>\n                </table>\n            </div>\n\n            <div class="totals">\n                <p><strong>Subtotal:</strong> $100</p>\n                \n                <p><strong>Costo de Envío:</strong> $0</p>\n                <p style="font-size: 18px; font-weight: bold;">Total Cobrado: $90</p>\n                <p><strong>Método de pago:</strong> transfer</p>\n            </div>\n\n            <div class="section">\n                <div class="section-title">Datos de Envío</div>\n                <p><strong>Dirección:</strong> Lincoln 1242  , Wilde, Buenos Aires, undefined</p>\n                <p><strong>Zona / Método:</strong> pickup</p>\n                <p><strong>Tiempo estimado:</strong> No especificado</p>\n            </div>\n\n            \n\n            <div style="text-align: center;">\n                <a href="https://decomoi.com.ar/admin/orders/fc9d6575-ad4a-4814-8e2f-74e795a7e4fa" class="button">Ver orden en el admin</a>\n            </div>\n        </div>\n    </body>\n    </html>\n    	failed	Connection timeout	3	2026-02-21 20:16:02.889212	2026-02-21 20:16:02.889212
8	fc9d6575-ad4a-4814-8e2f-74e795a7e4fa	client	nico.leo.busto@gmail.com	¡Tu pedido ya casi está! Orden #DEC-297260	\n    <!DOCTYPE html>\n    <html lang="es">\n    <head>\n        <meta charset="UTF-8">\n        <meta name="viewport" content="width=device-width, initial-scale=1.0">\n        <title>¡Tu pedido está confirmado!</title>\n        <style>\n            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1A1A1A; line-height: 1.6; background-color: #f9f9f9; padding: 20px; }\n            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }\n            .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #E8C4A6; }\n            .logo { width: 150px; height: auto; margin-bottom: 15px; } /* Usamos texto si no hay logo absoluto, o ajusta la URL */\n            .logo-text { font-size: 28px; font-weight: bold; color: #8B7355; letter-spacing: 2px; text-transform: uppercase; margin: 0; }\n            h1 { font-size: 24px; color: #8B7355; margin-bottom: 10px; }\n            .greeting { font-size: 16px; margin-bottom: 20px; }\n            .order-info { background-color: #fdfbf7; padding: 15px; border-radius: 6px; margin-bottom: 25px; font-size: 14px; }\n            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }\n            th { text-align: left; padding: 12px; font-size: 14px; color: #8B7355; border-bottom: 2px solid #E8C4A6; }\n            .totals { text-align: right; margin-top: 15px; }\n            .totals p { margin: 5px 0; font-size: 15px; }\n            .total-highlight { font-size: 18px; font-weight: bold; color: #8B7355; margin-top: 10px; padding-top: 10px; border-top: 1px solid #E8C4A6; }\n            .section-title { font-size: 18px; color: #8B7355; margin-top: 30px; margin-bottom: 10px; font-weight: bold; }\n            .shipping-info { background-color: #f5f5f5; padding: 15px; border-radius: 6px; }\n            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }\n            .footer a { color: #8B7355; text-decoration: none; font-weight: bold; }\n        </style>\n    </head>\n    <body>\n        <div class="container">\n            <div class="header">\n                <!-- <img src="URL_DEL_LOGO" alt="Deco Moi" class="logo"> -->\n                <p class="logo-text">Deco Moi</p>\n            </div>\n            \n            <div class="greeting">\n                <h1>¡Gracias por tu compra, Nicolas Busto!</h1>\n                <p>Tu pedido <strong>#DEC-297260</strong> está registrado y esperando tu pago.</p>\n            </div>\n\n            \n            <div style="background-color: #fdfaf6; padding: 20px; border-radius: 6px; margin-bottom: 25px; border: 1px solid #E8C4A6;">\n                <h2 style="font-size: 18px; color: #8B7355; margin-top: 0;">Realizá tu transferencia por $90</h2>\n                <p style="margin: 5px 0;"><strong>Titular:</strong> Magali Jessica Benua</p>\n                <p style="margin: 5px 0;"><strong>CVU / Alias:</strong> decomoi.mp</p>\n                <p style="margin-top: 15px; font-size: 13px; color: #666; line-height: 1.4;">⚠️ <strong>Atención:</strong> Por favor, asegurate de transferir desde la cuenta a nombre del DNI que ingresaste en la compra. Nuestro sistema detectará el ingreso automáticamente. Si preferís asegurar, envíanos el comprobante al WhatsApp.</p>\n            </div>\n            \n\n            <div class="order-info">\n                <strong>Número de orden:</strong> #DEC-297260<br>\n                <strong>Fecha:</strong> 21/2/2026<br>\n                <strong>Método de pago:</strong> Transferencia Bancaria\n            </div>\n\n            <table>\n                <thead>\n                    <tr>\n                        <th>Producto</th>\n                        <th style="text-align: center;">Cant.</th>\n                        <th style="text-align: right;">Unit.</th>\n                        <th style="text-align: right;">Subtotal</th>\n                    </tr>\n                </thead>\n                <tbody>\n                    \n        <tr>\n            <td style="padding: 12px; border-bottom: 1px solid #eee;">\n                test\n                \n            </td>\n            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">1</td>\n            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$100</td>\n            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$100</td>\n        </tr>\n    \n                </tbody>\n            </table>\n\n            <div class="totals">\n                <p>Subtotal: $100</p>\n                \n                <p>Costo de Envío: $0</p>\n                <div class="total-highlight">\n                    Total Pagado: $90\n                </div>\n            </div>\n\n            <div class="section-title">Datos de Envío</div>\n            <div class="shipping-info">\n                <p><strong>Dirección:</strong> Lincoln 1242  , Wilde, Buenos Aires, undefined</p>\n                <p><strong>Zona y tiempo estimado:</strong> No especificado (pickup)</p>\n                <!-- <p><em>* Recuerda que el tiempo total suma los días de producción más el tiempo de envío.</em></p> -->\n            </div>\n\n            <div style="margin-top: 30px; background-color: #fdfbf7; padding: 15px; border-radius: 6px; text-align: center;">\n                <p style="margin: 0;"><strong>Próximos pasos:</strong> Te avisaremos por email cuando tu pedido esté listo para ser despachado o retirado según tu elección.</p>\n            </div>\n\n            <div class="footer">\n                <p>¿Tenés alguna duda? Contactanos por <a href="https://wa.me/541138172431">WhatsApp</a> o en <a href="https://instagram.com/deco.moi">Instagram (@deco.moi)</a>.</p>\n                <p>&copy; 2026 Deco Moi. Todos los derechos reservados.</p>\n            </div>\n        </div>\n    </body>\n    </html>\n    	failed	Connection timeout	3	2026-02-21 20:16:03.031088	2026-02-21 20:16:03.031088
9	65bc0059-1bc1-45cf-ba94-e2e2f9abbaca	admin	nico.leo.busto@gmail.com	🛍️ Nueva venta registrada — Orden #DEC-692240 — $23.400 ARS	\n    <!DOCTYPE html>\n    <html lang="es">\n    <head>\n        <meta charset="UTF-8">\n        <meta name="viewport" content="width=device-width, initial-scale=1.0">\n        <title>Nueva Venta Confirmada</title>\n        <style>\n            body { font-family: Arial, sans-serif; color: #1A1A1A; line-height: 1.6; }\n            .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n            .header { background-color: #8B7355; color: white; padding: 15px; text-align: center; font-size: 20px; font-weight: bold; }\n            .section { margin-top: 20px; }\n            .section-title { font-size: 18px; font-weight: bold; border-bottom: 2px solid #E8C4A6; padding-bottom: 5px; margin-bottom: 10px; }\n            table { width: 100%; border-collapse: collapse; margin-top: 10px; }\n            th { background-color: #f7f7f7; padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }\n            .button { display: inline-block; background-color: #8B7355; color: white !important; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 4px; margin-top: 20px; text-align: center; }\n            .totals { margin-top: 20px; text-align: right; }\n            .totals p { margin: 5px 0; }\n        </style>\n    </head>\n    <body>\n        <div class="container">\n            <div class="header">\n                🛍️ Nueva orden confirmada #DEC-692240\n            </div>\n            \n            <div style="text-align: center; margin-top: 10px; font-size: 14px; color: #555;">\n                Fecha: 21/2/2026, 08:05:17\n            </div>\n\n            <div class="section">\n                <div class="section-title">Datos del Cliente</div>\n                <p><strong>Nombre:</strong> Nicolas Busto</p>\n                <p><strong>Email:</strong> nico.leo.busto@gmail.com</p>\n                <p><strong>Teléfono:</strong> 1138172431</p>\n            </div>\n\n            <div class="section">\n                <div class="section-title">Productos Comprados</div>\n                <table>\n                    <thead>\n                        <tr>\n                            <th>Producto</th>\n                            <th>SKU</th>\n                            <th>Cant.</th>\n                            <th>P. Unit.</th>\n                            <th>Subtotal</th>\n                            <th>Detalles</th>\n                        </tr>\n                    </thead>\n                    <tbody>\n                        \n        <tr>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">Vela Gold 100cc sin fragancia</td>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">PROD-3955</td>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">10</td>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">$2.600</td>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">$26.000</td>\n            <td style="padding: 10px; border-bottom: 1px solid #ddd;">\n                -\n            </td>\n        </tr>\n    \n                    </tbody>\n                </table>\n            </div>\n\n            <div class="totals">\n                <p><strong>Subtotal:</strong> $26.000</p>\n                \n                <p><strong>Costo de Envío:</strong> $0</p>\n                <p style="font-size: 18px; font-weight: bold;">Total Cobrado: $23.400</p>\n                <p><strong>Método de pago:</strong> transfer</p>\n            </div>\n\n            <div class="section">\n                <div class="section-title">Datos de Envío</div>\n                <p><strong>Dirección:</strong> Lincoln 1242  , Wilde, Bsas, undefined</p>\n                <p><strong>Zona / Método:</strong> pickup</p>\n                <p><strong>Tiempo estimado:</strong> No especificado</p>\n            </div>\n\n            \n\n            <div style="text-align: center;">\n                <a href="https://decomoi.com.ar/admin/orders/65bc0059-1bc1-45cf-ba94-e2e2f9abbaca" class="button">Ver orden en el admin</a>\n            </div>\n        </div>\n    </body>\n    </html>\n    	failed	Connection timeout	3	2026-02-21 20:17:23.607588	2026-02-21 20:17:23.607588
10	65bc0059-1bc1-45cf-ba94-e2e2f9abbaca	client	nico.leo.busto@gmail.com	¡Tu pedido ya casi está! Orden #DEC-692240	\n    <!DOCTYPE html>\n    <html lang="es">\n    <head>\n        <meta charset="UTF-8">\n        <meta name="viewport" content="width=device-width, initial-scale=1.0">\n        <title>¡Tu pedido está confirmado!</title>\n        <style>\n            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1A1A1A; line-height: 1.6; background-color: #f9f9f9; padding: 20px; }\n            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }\n            .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #E8C4A6; }\n            .logo { width: 150px; height: auto; margin-bottom: 15px; } /* Usamos texto si no hay logo absoluto, o ajusta la URL */\n            .logo-text { font-size: 28px; font-weight: bold; color: #8B7355; letter-spacing: 2px; text-transform: uppercase; margin: 0; }\n            h1 { font-size: 24px; color: #8B7355; margin-bottom: 10px; }\n            .greeting { font-size: 16px; margin-bottom: 20px; }\n            .order-info { background-color: #fdfbf7; padding: 15px; border-radius: 6px; margin-bottom: 25px; font-size: 14px; }\n            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }\n            th { text-align: left; padding: 12px; font-size: 14px; color: #8B7355; border-bottom: 2px solid #E8C4A6; }\n            .totals { text-align: right; margin-top: 15px; }\n            .totals p { margin: 5px 0; font-size: 15px; }\n            .total-highlight { font-size: 18px; font-weight: bold; color: #8B7355; margin-top: 10px; padding-top: 10px; border-top: 1px solid #E8C4A6; }\n            .section-title { font-size: 18px; color: #8B7355; margin-top: 30px; margin-bottom: 10px; font-weight: bold; }\n            .shipping-info { background-color: #f5f5f5; padding: 15px; border-radius: 6px; }\n            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }\n            .footer a { color: #8B7355; text-decoration: none; font-weight: bold; }\n        </style>\n    </head>\n    <body>\n        <div class="container">\n            <div class="header">\n                <!-- <img src="URL_DEL_LOGO" alt="Deco Moi" class="logo"> -->\n                <p class="logo-text">Deco Moi</p>\n            </div>\n            \n            <div class="greeting">\n                <h1>¡Gracias por tu compra, Nicolas Busto!</h1>\n                <p>Tu pedido <strong>#DEC-692240</strong> está registrado y esperando tu pago.</p>\n            </div>\n\n            \n            <div style="background-color: #fdfaf6; padding: 20px; border-radius: 6px; margin-bottom: 25px; border: 1px solid #E8C4A6;">\n                <h2 style="font-size: 18px; color: #8B7355; margin-top: 0;">Realizá tu transferencia por $23.400</h2>\n                <p style="margin: 5px 0;"><strong>Titular:</strong> Magali Jessica Benua</p>\n                <p style="margin: 5px 0;"><strong>CVU / Alias:</strong> decomoi.mp</p>\n                <p style="margin-top: 15px; font-size: 13px; color: #666; line-height: 1.4;">⚠️ <strong>Atención:</strong> Por favor, asegurate de transferir desde la cuenta a nombre del DNI que ingresaste en la compra. Nuestro sistema detectará el ingreso automáticamente. Si preferís asegurar, envíanos el comprobante al WhatsApp.</p>\n            </div>\n            \n\n            <div class="order-info">\n                <strong>Número de orden:</strong> #DEC-692240<br>\n                <strong>Fecha:</strong> 21/2/2026<br>\n                <strong>Método de pago:</strong> Transferencia Bancaria\n            </div>\n\n            <table>\n                <thead>\n                    <tr>\n                        <th>Producto</th>\n                        <th style="text-align: center;">Cant.</th>\n                        <th style="text-align: right;">Unit.</th>\n                        <th style="text-align: right;">Subtotal</th>\n                    </tr>\n                </thead>\n                <tbody>\n                    \n        <tr>\n            <td style="padding: 12px; border-bottom: 1px solid #eee;">\n                Vela Gold 100cc sin fragancia\n                \n            </td>\n            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">10</td>\n            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$2.600</td>\n            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$26.000</td>\n        </tr>\n    \n                </tbody>\n            </table>\n\n            <div class="totals">\n                <p>Subtotal: $26.000</p>\n                \n                <p>Costo de Envío: $0</p>\n                <div class="total-highlight">\n                    Total Pagado: $23.400\n                </div>\n            </div>\n\n            <div class="section-title">Datos de Envío</div>\n            <div class="shipping-info">\n                <p><strong>Dirección:</strong> Lincoln 1242  , Wilde, Bsas, undefined</p>\n                <p><strong>Zona y tiempo estimado:</strong> No especificado (pickup)</p>\n                <!-- <p><em>* Recuerda que el tiempo total suma los días de producción más el tiempo de envío.</em></p> -->\n            </div>\n\n            <div style="margin-top: 30px; background-color: #fdfbf7; padding: 15px; border-radius: 6px; text-align: center;">\n                <p style="margin: 0;"><strong>Próximos pasos:</strong> Te avisaremos por email cuando tu pedido esté listo para ser despachado o retirado según tu elección.</p>\n            </div>\n\n            <div class="footer">\n                <p>¿Tenés alguna duda? Contactanos por <a href="https://wa.me/541138172431">WhatsApp</a> o en <a href="https://instagram.com/deco.moi">Instagram (@deco.moi)</a>.</p>\n                <p>&copy; 2026 Deco Moi. Todos los derechos reservados.</p>\n            </div>\n        </div>\n    </body>\n    </html>\n    	failed	Connection timeout	3	2026-02-21 20:17:23.607597	2026-02-21 20:17:23.607597
\.


--
-- Data for Name: home_blocks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.home_blocks (id, type, settings, "order", is_active, created_at, updated_at) FROM stdin;
1	hero	{}	0	t	2026-05-11 20:51:23.718	2026-05-11 20:51:23.718
2	categories	{}	1	t	2026-05-11 20:51:23.982	2026-05-11 20:51:23.982
3	featured_products	{"limit":8}	2	t	2026-05-11 20:51:24.222	2026-05-11 20:51:24.222
4	testimonials	{}	3	t	2026-05-11 20:51:24.456	2026-05-11 20:51:24.456
5	cta	{}	4	t	2026-05-11 20:51:24.689	2026-05-11 20:51:24.689
\.


--
-- Data for Name: meli_credentials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.meli_credentials (id, ml_user_id, ml_user_nickname, access_token, refresh_token, expires_at, app_id, is_active, created_at, updated_at) FROM stdin;
3	66812347	\N	APP_USR-7655767424334006-022111-4d316356ed8188f1e52ad380bfbd896e-66812347	no_refresh_token_provided	2026-02-21 21:43:09.609	7655767424334006	f	2026-02-21 15:43:09.615163	2026-02-21 15:43:09.615163
4	66812347	\N	APP_USR-1435951944475357-022111-6b442c13cdaf7a4a4680fcbf88878931-66812347	TG-6999d5919e90cf0001e10e3d-66812347	2026-02-21 21:56:01.931	1435951944475357	f	2026-02-21 15:56:01.945067	2026-02-21 15:56:01.945067
5	201933453	\N	APP_USR-1435951944475357-042919-032c29e85e4c72846931d4613188913a-201933453	TG-69f294c2238ff7000179176e-201933453	2026-04-30 05:31:15.096	1435951944475357	t	2026-02-21 16:38:23.628247	2026-04-29 23:31:15.096
\.


--
-- Data for Name: meli_item_links; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.meli_item_links (id, product_id, meli_item_id, meli_title, meli_category_id, meli_listing_type, last_sync_at, sync_enabled, last_synced_price, last_synced_stock, created_at, updated_at, meli_variation_id, pack_quantity) FROM stdin;
30	22	MLA1147686470	\N	\N	\N	\N	t	6200.00	999	2026-05-11 20:56:02.155549	2026-05-11 20:56:02.155549	\N	1
36	30	MLA1560654451	\N	\N	\N	\N	t	35000.00	999	2026-06-07 23:05:55.032297	2026-06-07 23:05:55.032297	\N	1
\.


--
-- Data for Name: meli_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.meli_orders (id, meli_order_id, internal_order_id, status, buyer_nickname, buyer_email, total_amount, net_amount, ml_commission_amount, currency, items, payment_id, shipping_id, date_created, raw_data, imported_at) FROM stdin;
\.


--
-- Data for Name: meli_pricing_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.meli_pricing_config (id, scope, scope_id, scope_label, commission_pct, fixed_cost_threshold1, fixed_cost_amount1, fixed_cost_threshold2, fixed_cost_amount2, fixed_cost_threshold3, fixed_cost_amount3, extra_margin_pct, installments_cost_pct, rounding_strategy, is_active, created_at, updated_at, free_shipping_threshold, free_shipping_cost) FROM stdin;
1	global	\N	Configuración Global por Defecto	14.50	15000.00	1115.00	25000.00	2300.00	33000.00	2810.00	12.00	0.00	nearest_50	t	2026-02-21 14:41:28.163752	2026-02-23 03:02:15.256	33000.00	8000.00
\.


--
-- Data for Name: meli_sync_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.meli_sync_log (id, type, direction, product_id, meli_item_id, meli_order_id, status, details, error_message, created_at) FROM stdin;
1	price_sync	push	30	\N	\N	error	\N	Failed to update Meli item MLA1560654451: 403 {"message":"The caller is not authorized to access this resource","error":"forbidden","status":403,"cause":[]}	2026-02-21 16:18:11.548711
2	price_sync	push	30	\N	\N	error	\N	Failed to update Meli item MLA1560654451: 403 {"message":"The caller is not authorized to access this resource","error":"forbidden","status":403,"cause":[]}	2026-02-21 16:21:25.174807
3	price_sync	push	30	MLA1560654451	\N	success	\N	\N	2026-02-21 16:39:12.647081
4	price_sync	push	30	MLA1560654451	\N	success	\N	\N	2026-02-21 17:40:09.688394
5	price_sync	push	22	MLA1147686470	\N	success	\N	\N	2026-02-22 02:53:01.980887
6	price_sync	push	30	MLA1560654451	\N	success	\N	\N	2026-02-22 04:45:24.643543
7	price_sync	push	22	MLA1147686470	\N	success	{"variationId":null}	\N	2026-02-23 02:47:26.531665
8	price_sync	push	22	MLA1147686470	\N	success	{"variationId":null}	\N	2026-02-23 02:47:30.537383
9	price_sync	push	22	MLA1147686470	\N	success	{"variationId":null}	\N	2026-02-23 02:56:48.386282
10	price_sync	push	22	MLA1147686470	\N	success	{"variationId":null}	\N	2026-02-23 02:58:20.923759
11	price_sync	push	30	MLA1560654451	\N	success	{"variationId":null}	\N	2026-02-23 03:00:18.180401
12	price_sync	push	22	MLA1147686470	\N	success	{"variationId":null}	\N	2026-02-23 03:04:13.240154
13	price_sync	push	30	MLA1560654451	\N	success	{"variationId":null}	\N	2026-02-23 03:04:15.879861
\.


--
-- Data for Name: mockup_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mockup_templates (id, product_id, name, slug, mockup_image_url, perspective_config, surface_config, camera_config, design_presets, is_active, created_at, updated_at, surfaces, default_transform, metadata) FROM stdin;
\.


--
-- Data for Name: order_item_costs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_item_costs (id, order_item_id, cost_item_name, cost_item_type, configured_value, calculated_amount, created_at) FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, product_id, product_name, product_sku, quantity, unit_price, subtotal, customization, created_at, variant_id, production_time) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, order_number, user_id, status, subtotal, discount_amount, shipping_cost, total, payment_method, payment_status, shipping_address_id, shipping_data, notes, customization_details, created_at, updated_at, shipping_method, zipnova_shipment_id) FROM stdin;
\.


--
-- Data for Name: page_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.page_templates (id, name, thumbnail, blocks, category, created_at, updated_at) FROM stdin;
1	Landing de Ventas Mínima	\N	[{"id":"fe0ef38c-8ab2-47c2-9f19-055ce61b5c46","isVisible":true,"type":"hero","order":0,"props":{"title":"Oferta Especial de Primavera","subtitle":"Hasta 30% OFF en todos nuestros souvenirs y cajas de regalo.","align":"center","minHeight":500,"ctaText":"Ver Productos","ctaLink":"/productos","overlayOpacity":40,"backgroundImage":"https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1600"}},{"id":"e5abd46a-45c4-4aa8-9320-ce24924783ad","isVisible":true,"type":"features","order":1,"props":{"title":"¿Por qué elegirnos?","columns":3,"features":[{"title":"Hecho a mano","description":"Cada detalle es único."},{"title":"Envío rápido","description":"Despachamos en 24hs."},{"title":"Personalizado","description":"Grabamos tu nombre o logo."}]}},{"id":"be0df979-b7ab-4116-a9ae-196734d23a03","isVisible":true,"type":"product_grid","order":2,"props":{"title":"Productos Destacados","limit":4,"showCta":true}},{"id":"a62d99da-149a-4684-a2a9-0b701b18addc","isVisible":true,"type":"whatsapp_cta","order":3,"props":{"title":"¿Dudas con tu pedido mayorista?","buttonText":"Hablemos por WhatsApp"}}]	landing	2026-05-24 19:50:37.383138	2026-05-24 19:50:37.383138
2	Página de Contacto / Ayuda	\N	[{"id":"e4419043-b19b-4761-a793-5b4510e1ca98","isVisible":true,"type":"richtext","order":0,"props":{"content":"<h1 style=\\"text-align: center;\\">Centro de Ayuda</h1><p style=\\"text-align: center;\\">Estamos aquí para resolver todas tus dudas.</p>","align":"center"}},{"id":"e2d9c65b-1f39-4b1c-99ba-7782063cb062","isVisible":true,"type":"faq","order":1,"props":{"title":"Preguntas Frecuentes","items":[{"question":"¿Hacen envíos a todo el país?","answer":"Sí, enviamos a toda Argentina mediante Correo Argentino y OCA."},{"question":"¿Cuál es la compra mínima por mayor?","answer":"La compra mínima mayorista es de 20 unidades."}]}},{"id":"34599bd5-1d5a-4511-ba52-45047c819a16","isVisible":true,"type":"spacer","order":2,"props":{"height":40,"showLine":true}},{"id":"2d28f601-5340-4dd2-a3c7-8770b7c911b7","isVisible":true,"type":"contact_form","order":3,"props":{"title":"Envíanos un mensaje"}}]	info	2026-05-24 19:50:37.626588	2026-05-24 19:50:37.626588
\.


--
-- Data for Name: pages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pages (id, title, slug, status, blocks, seo_title, seo_description, og_image, published_at, created_at, updated_at) FROM stdin;
cb5c10cc-f429-4f9e-851f-d9a9eaff032a	Sobre Nosotros	sobre-nosotros	draft	[{"id":"bsz3gtb839t","type":"hero","order":0,"isVisible":true,"props":{"title":"Sobre Nosotros","align":"center","overlayOpacity":50,"minHeight":400}},{"id":"i8bqf9kb8z","type":"richtext","order":1,"isVisible":true,"props":{"content":"<p>Pagina principal</p>","maxWidth":"normal","align":"left"}},{"id":"2gntmduqoq4","type":"image_text","order":2,"isVisible":true,"props":{"title":"Imagen y Texto","content":"<p>Descripción aquí...</p>","image":"","imagePosition":"left"}},{"id":"6vkm0efd152","type":"features","order":3,"isVisible":true,"props":{"title":"Nuestras Ventajas","features":[]}},{"id":"lh7tbd2f0r","type":"faq","order":4,"isVisible":true,"props":{"title":"Preguntas Frecuentes","items":[]}},{"id":"3pvh4csv70x","type":"whatsapp_cta","order":5,"isVisible":true,"props":{"title":"¿Necesitas ayuda?","buttonText":"Contactar"}}]	\N	\N	\N	\N	2026-05-24 20:22:47.126722	2026-05-24 20:28:06.56
48bceb24-0dda-4f26-a4e2-352bd9f944cc	test	test	draft	[{"id":"pm0fndth5","isVisible":true,"type":"hero","order":0,"props":{"title":"Oferta Especial de Primavera","subtitle":"Hasta 30% OFF en todos nuestros souvenirs y cajas de regalo.","align":"center","minHeight":500,"ctaText":"Ver Productos","ctaLink":"/productos","overlayOpacity":40,"backgroundImage":"https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1600"}},{"id":"2pjjcd0q5cx","isVisible":true,"type":"features","order":1,"props":{"title":"¿Por qué elegirnos?","columns":3,"features":[{"title":"Hecho a mano","description":"Cada detalle es único."},{"title":"Envío rápido","description":"Despachamos en 24hs."},{"title":"Personalizado","description":"Grabamos tu nombre o logo."}]}},{"id":"6z0f86nx3m8","isVisible":true,"type":"product_grid","order":2,"props":{"title":"Productos Destacados","limit":4,"showCta":true}},{"id":"6kvfuqpzlno","isVisible":true,"type":"whatsapp_cta","order":3,"props":{"title":"¿Dudas con tu pedido mayorista?","buttonText":"Hablemos por WhatsApp"}}]	\N	\N	\N	\N	2026-05-24 20:28:55.139142	2026-05-24 20:28:55.139142
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, order_id, method, status, amount, transaction_id, metadata, created_at, updated_at) FROM stdin;
e577e4c0-26a5-4709-8db1-193e4c7c173f	bc19f00d-6e52-4046-89db-d6e9c45d11f2	mercadopago_transfer	approved	90.00	147150891222	{"notes":"Auto-detectado de MP: DNI 38425243"}	2026-02-21 05:47:46.197822	2026-02-21 05:47:46.197822
87f22ae5-b85a-40a1-b23c-be10ad5ab4f7	49069828-7c11-4674-85a0-cf89752bbda3	mercadopago_transfer	approved	90.00	146510999941	{"notes":"Auto-detectado de MP: DNI 38425243"}	2026-02-21 20:33:34.582681	2026-02-21 20:33:34.582681
fd099132-6650-41f2-91ac-a8c5c0a1423d	7952bdc8-7c34-4585-be84-345078e19315	mercadopago_transfer	approved	9.00	147236763516	{"notes":"Auto-detectado de MP: DNI 39549906"}	2026-02-21 21:27:03.649712	2026-02-21 21:27:03.649712
8d9780ac-300d-4075-bb33-b1f642a0fcca	957126e0-dd68-406a-ba4c-9993c4214655	mercadopago_transfer	approved	9.00	146809420377	{"notes":"Auto-detectado de MP: DNI 39549906"}	2026-02-24 01:25:10.310193	2026-02-24 01:25:10.310193
\.


--
-- Data for Name: price_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.price_rules (id, product_id, min_quantity, max_quantity, discount_percentage, fixed_price, created_at) FROM stdin;
7	2	1	49	0.00	\N	2026-02-11 13:50:05.987268
8	2	50	99	5.00	\N	2026-02-11 13:50:06.217352
9	2	100	199	10.00	\N	2026-02-11 13:50:06.448935
10	2	200	499	15.00	\N	2026-02-11 13:50:06.691376
11	2	500	2000	20.00	\N	2026-02-11 13:50:06.927171
12	3	1	49	0.00	\N	2026-02-11 13:50:07.160902
13	3	50	99	5.00	\N	2026-02-11 13:50:07.395473
14	3	100	199	10.00	\N	2026-02-11 13:50:07.627268
15	3	200	2000	15.00	\N	2026-02-11 13:50:07.85682
16	4	1	99	0.00	\N	2026-02-11 13:50:08.089203
17	4	100	199	5.00	\N	2026-02-11 13:50:08.320704
18	4	200	499	10.00	\N	2026-02-11 13:50:08.551032
19	4	500	2000	15.00	\N	2026-02-11 13:50:08.783498
20	5	1	49	0.00	\N	2026-02-11 13:50:09.015226
21	5	50	99	5.00	\N	2026-02-11 13:50:09.246791
22	5	100	199	10.00	\N	2026-02-11 13:50:09.48088
23	5	200	2000	15.00	\N	2026-02-11 13:50:09.713097
24	6	1	49	0.00	\N	2026-02-11 13:50:09.944501
25	6	50	99	5.00	\N	2026-02-11 13:50:10.183279
26	6	100	199	10.00	\N	2026-02-11 13:50:10.414599
27	6	200	2000	15.00	\N	2026-02-11 13:50:10.644721
30	30	49	99	5.00	\N	2026-06-07 23:05:55.617558
31	30	100	149	10.00	\N	2026-06-07 23:05:55.617558
\.


--
-- Data for Name: product_cost_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_cost_items (id, product_id, cost_item_id, created_at) FROM stdin;
\.


--
-- Data for Name: product_supplies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_supplies (id, product_id, supply_id, quantity, created_at, updated_at, parts_used, parts_total) FROM stdin;
230	26	20	1.000	2026-04-29 23:53:32.319833	2026-04-29 23:53:32.319833	\N	\N
231	26	22	1.000	2026-04-29 23:53:32.319833	2026-04-29 23:53:32.319833	\N	\N
232	26	19	190.000	2026-04-29 23:53:32.319833	2026-04-29 23:53:32.319833	\N	\N
385	24	3	1.000	2026-05-01 19:54:29.650163	2026-05-01 19:54:29.650163	\N	\N
386	24	63	1.000	2026-05-01 19:54:29.650163	2026-05-01 19:54:29.650163	\N	\N
157	17	12	1.000	2026-04-29 20:19:24.074131	2026-04-29 20:19:24.074131	\N	\N
158	17	2	6.000	2026-04-29 20:19:24.074131	2026-04-29 20:19:24.074131	\N	\N
159	17	53	6.000	2026-04-29 20:19:24.074131	2026-04-29 20:19:24.074131	\N	\N
160	17	54	1.000	2026-04-29 20:19:24.074131	2026-04-29 20:19:24.074131	\N	\N
161	17	48	0.000	2026-04-29 20:19:24.074131	2026-04-29 20:19:24.074131	\N	\N
233	26	29	0.300	2026-04-29 23:53:32.319833	2026-04-29 23:53:32.319833	\N	\N
234	34	2	1.000	2026-04-29 23:57:18.188877	2026-04-29 23:57:18.188877	\N	\N
235	34	53	1.000	2026-04-29 23:57:18.188877	2026-04-29 23:57:18.188877	\N	\N
315	38	61	0.040	2026-05-01 19:04:44.798279	2026-05-01 19:04:44.798279	\N	\N
316	38	2	1.000	2026-05-01 19:04:44.798279	2026-05-01 19:04:44.798279	\N	\N
317	38	53	1.000	2026-05-01 19:04:44.798279	2026-05-01 19:04:44.798279	\N	\N
321	29	38	1.000	2026-05-01 19:17:40.085808	2026-05-01 19:17:40.085808	\N	\N
322	29	2	4.000	2026-05-01 19:17:40.085808	2026-05-01 19:17:40.085808	\N	\N
323	29	53	4.000	2026-05-01 19:17:40.085808	2026-05-01 19:17:40.085808	\N	\N
252	27	10	67.000	2026-04-30 00:33:33.276942	2026-04-30 00:33:33.276942	\N	\N
253	27	69	50.000	2026-04-30 00:33:33.276942	2026-04-30 00:33:33.276942	\N	\N
254	27	35	5.000	2026-04-30 00:33:33.276942	2026-04-30 00:33:33.276942	\N	\N
328	37	2	1.000	2026-05-01 19:20:53.207526	2026-05-01 19:20:53.207526	\N	\N
329	37	16	70.000	2026-05-01 19:20:53.207526	2026-05-01 19:20:53.207526	\N	\N
330	37	60	1.000	2026-05-01 19:20:53.207526	2026-05-01 19:20:53.207526	\N	\N
255	27	9	1.000	2026-04-30 00:33:33.276942	2026-04-30 00:33:33.276942	\N	\N
256	27	27	1.000	2026-04-30 00:33:33.276942	2026-04-30 00:33:33.276942	\N	\N
257	27	11	1.000	2026-04-30 00:33:33.276942	2026-04-30 00:33:33.276942	\N	\N
258	27	23	0.040	2026-04-30 00:33:33.276942	2026-04-30 00:33:33.276942	\N	\N
331	37	53	1.000	2026-05-01 19:20:53.207526	2026-05-01 19:20:53.207526	\N	\N
425	22	12	1.000	2026-05-11 20:56:05.025297	2026-05-11 20:56:05.025297	\N	\N
426	22	2	6.000	2026-05-11 20:56:05.025297	2026-05-11 20:56:05.025297	\N	\N
427	22	27	6.000	2026-05-11 20:56:05.025297	2026-05-11 20:56:05.025297	\N	\N
428	22	23	1.000	2026-05-11 20:56:05.025297	2026-05-11 20:56:05.025297	\N	\N
429	22	26	1.000	2026-05-11 20:56:05.025297	2026-05-11 20:56:05.025297	\N	\N
501	20	39	1.000	2026-05-23 21:37:35.765531	2026-05-23 21:37:35.765531	\N	\N
502	20	3	2.000	2026-05-23 21:37:35.765531	2026-05-23 21:37:35.765531	\N	\N
503	20	63	2.000	2026-05-23 21:37:35.765531	2026-05-23 21:37:35.765531	\N	\N
504	20	54	1.000	2026-05-23 21:37:35.765531	2026-05-23 21:37:35.765531	\N	\N
505	36	58	1.000	2026-06-06 01:58:59.556124	2026-06-06 01:58:59.556124	\N	\N
506	36	2	1.000	2026-06-06 01:58:59.556124	2026-06-06 01:58:59.556124	\N	\N
507	36	53	1.000	2026-06-06 01:58:59.556124	2026-06-06 01:58:59.556124	\N	\N
513	30	44	1.000	2026-06-07 23:05:55.872355	2026-06-07 23:05:55.872355	\N	\N
514	30	31	0.500	2026-06-07 23:05:55.872355	2026-06-07 23:05:55.872355	\N	\N
442	39	61	0.040	2026-05-23 18:24:26.04727	2026-05-23 18:24:26.04727	\N	\N
443	39	2	1.000	2026-05-23 18:24:26.04727	2026-05-23 18:24:26.04727	\N	\N
444	39	53	1.000	2026-05-23 18:24:26.04727	2026-05-23 18:24:26.04727	\N	\N
359	35	65	1.000	2026-05-01 19:50:05.877057	2026-05-01 19:50:05.877057	\N	\N
360	35	2	6.000	2026-05-01 19:50:05.877057	2026-05-01 19:50:05.877057	\N	\N
361	35	53	6.000	2026-05-01 19:50:05.877057	2026-05-01 19:50:05.877057	\N	\N
362	35	23	1.000	2026-05-01 19:50:05.877057	2026-05-01 19:50:05.877057	\N	\N
225	25	20	1.000	2026-04-29 23:50:34.602824	2026-04-29 23:50:34.602824	\N	\N
226	25	22	1.000	2026-04-29 23:50:34.602824	2026-04-29 23:50:34.602824	\N	\N
227	25	66	1.000	2026-04-29 23:50:34.602824	2026-04-29 23:50:34.602824	\N	\N
228	25	19	190.000	2026-04-29 23:50:34.602824	2026-04-29 23:50:34.602824	\N	\N
229	25	29	0.300	2026-04-29 23:50:34.602824	2026-04-29 23:50:34.602824	\N	\N
515	30	2	44.000	2026-06-07 23:05:55.872355	2026-06-07 23:05:55.872355	\N	\N
516	30	4	0.500	2026-06-07 23:05:55.872355	2026-06-07 23:05:55.872355	\N	\N
517	30	53	44.000	2026-06-07 23:05:55.872355	2026-06-07 23:05:55.872355	\N	\N
304	23	2	1.000	2026-05-01 18:55:10.875544	2026-05-01 18:55:10.875544	\N	\N
305	23	53	1.000	2026-05-01 18:55:10.875544	2026-05-01 18:55:10.875544	\N	\N
380	21	12	1.000	2026-05-01 19:53:23.724954	2026-05-01 19:53:23.724954	\N	\N
381	21	3	2.000	2026-05-01 19:53:23.724954	2026-05-01 19:53:23.724954	\N	\N
382	21	51	70.000	2026-05-01 19:53:23.724954	2026-05-01 19:53:23.724954	\N	\N
383	21	63	2.000	2026-05-01 19:53:23.724954	2026-05-01 19:53:23.724954	\N	\N
384	21	54	1.000	2026-05-01 19:53:23.724954	2026-05-01 19:53:23.724954	\N	\N
\.


--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_variants (id, product_id, name, sku, price, stock, is_active, created_at, updated_at, images) FROM stdin;
15	38	25 de Mayo 	\N	\N	10000	t	2026-05-01 17:46:26.802203	2026-05-01 19:04:44.121	[]
23	29	Por Mayor	\N	3200.00	10000	t	2026-05-01 19:17:39.491247	2026-05-01 19:17:39.491247	[]
8	38	Navidad	\N	\N	100300	t	2026-05-01 17:46:26.802203	2026-05-01 19:04:44.11	["/uploads/products/variant-7516ec1d-c486-4ad9-a6c3-55bfa973f555.jpg"]
9	38	Año Nuevo	\N	\N	10001	t	2026-05-01 17:46:26.802203	2026-05-01 19:04:44.112	["/uploads/products/variant-8efc6031-634c-4edd-979a-4da6912d9591.jpg"]
10	38	Dia de la Madre	\N	\N	1000001	t	2026-05-01 17:46:26.802203	2026-05-01 19:04:44.113	["/uploads/products/variant-c8543680-6bb2-4345-97c3-ae85261ddf5d.jpg"]
11	38	Mundial	\N	\N	10000	t	2026-05-01 17:46:26.802203	2026-05-01 19:04:44.116	["/uploads/products/variant-afa3c306-fc39-4bd7-af31-8e4b4a9134a1.jpg"]
12	38	Día del Padre	\N	\N	10000	t	2026-05-01 17:46:26.802203	2026-05-01 19:04:44.117	["/uploads/products/variant-4a3066a6-a4e3-4237-abca-e136510812b0.jpg"]
13	38	Nacimientos	\N	\N	100010000	t	2026-05-01 17:46:26.802203	2026-05-01 19:04:44.119	["/uploads/products/variant-cf711f86-6824-42a5-afe8-9745eb05581f.jpg"]
14	38	Pascuas	\N	\N	48	t	2026-05-01 17:46:26.802203	2026-05-01 19:04:44.12	["/uploads/products/variant-0d5ea626-f582-4d34-b3b1-c833a91d3441.jpg"]
24	45	Rojo	Rojo	1.00	1	t	2026-05-01 19:47:45.067405	2026-05-01 20:01:24.449	["/uploads/products/variant-e95a676b-4fa1-479f-ac13-4caba1f72736.jpg"]
7	22	Celeste	\N	\N	1100	t	2026-04-29 20:27:36.784544	2026-05-11 20:56:01.719	["/uploads/products/variant-6b37017c-0284-4d39-bce3-80ab4cfae528.png","/uploads/products/variant-6de1778d-f120-4938-a310-aeb8849ead1a.png"]
17	39	Bodas	\N	\N	1000	t	2026-05-01 17:53:47.856638	2026-05-23 18:24:25.462	["/uploads/products/variant-1ad17a53-3fac-441c-923c-89af43801631.jpg"]
18	39	Nacimientos	\N	\N	1000	t	2026-05-01 17:53:47.856638	2026-05-23 18:24:25.467	["/uploads/products/variant-e21e0b29-b4d5-4ffa-9a9a-f41559c4bfb2.jpg"]
20	39	Bautismo - Comunión	\N	\N	10000	t	2026-05-01 17:53:47.856638	2026-05-23 18:24:25.473	["/uploads/products/variant-726539b3-3369-46e9-94a6-dc77ceac0e36.jpg"]
21	39	Cumpleaños Adultos	\N	\N	1000	t	2026-05-01 17:53:47.856638	2026-05-23 18:24:25.482	["/uploads/products/variant-c9c0c5d8-ff01-4ef9-95d1-f0877d511108.jpg","/uploads/products/variant-a1e436c0-ddbf-4567-9a31-96b0d4dd6753.jpg","/uploads/products/variant-736ed509-2456-4f16-9e3b-12784747d3e7.jpeg"]
31	39	Egresados	\N	\N	10	t	2026-05-02 17:00:03.934112	2026-05-23 18:24:25.495	["/uploads/products/variant-ed333131-ce22-4ca3-b3c3-7a5882775c72.jpg","/uploads/products/variant-9ca12dc5-c7c9-48e6-8003-4763ed92943a.jpg"]
22	39	Cumpleaños Infantiles	\N	\N	1000	t	2026-05-01 17:53:47.856638	2026-05-23 18:24:25.503	["/uploads/products/variant-f5df863a-04ef-4351-a6c3-def027cac9f8.webp"]
16	39	XV	\N	\N	100	t	2026-05-01 17:53:47.856638	2026-05-23 18:24:25.508	["/uploads/products/variant-da8c4eb7-57ba-4847-b8c3-8a9a77131436.jpg"]
26	20	Moño	\N	4700.00	10000	t	2026-05-01 19:48:47.24628	2026-05-23 21:37:35.219	["/uploads/products/variant-26bbc51e-5352-4a78-83b0-0971102ad527.jpg","/uploads/products/variant-6c04feab-770a-497e-99de-2a00eb66849a.jpg","/uploads/products/variant-5141223a-41e8-4aa2-a6b6-6e9bc6018d6d.jpg"]
5	30	Nacimientos	\N	\N	7	t	2026-04-29 19:38:56.601771	2026-06-07 23:05:55.034	["/uploads/products/variant-4002599b-52d8-460e-880c-1203b9f037d4.jpg"]
6	30	Navidad	\N	\N	5	t	2026-04-29 19:38:56.601771	2026-06-07 23:05:55.036	["/uploads/products/variant-e04b4a03-c954-43ff-8e16-a3a11a934e9a.jpg"]
35	30	Madre	\N	\N	5	t	2026-05-23 21:08:50.906307	2026-06-07 23:05:55.037	["/uploads/products/variant-548d5846-b0fe-4db6-b81c-ac83c05faff4.jpg"]
36	30	Para dedicar	\N	\N	10	t	2026-05-23 21:08:50.906307	2026-06-07 23:05:55.038	["/uploads/products/variant-ab8e5ac5-1516-43e3-91b7-73b49803903d.jpg"]
37	30	22 Chocos	\N	21000.00	5	t	2026-05-23 21:15:17.063631	2026-06-07 23:05:55.039	["/uploads/products/variant-cc59cb89-aa2d-4561-b195-ced470409522.jpg"]
\.


--
-- Data for Name: production_time_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.production_time_rules (id, product_id, min_quantity, max_quantity, production_time, created_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, slug, description, short_description, sku, base_price, category_id, images, specifications, customization_options, min_order, production_time, stock, is_active, is_featured, is_on_sale, sale_price, tags, created_at, updated_at, mockup_template_id, allows_mockup, weight, height, width, length, show_discount_ranges) FROM stdin;
25	Colgante Infinito + Florcitas	colgante-macrame	<p data-start="1466" data-end="1671"><strong data-start="1466" data-end="1514">Delicados colgantes hechos a mano en macramé</strong>, un recuerdo original y elegante para tus invitados.<br data-start="1567" data-end="1570" />Ideales para bodas, comuniones, bautismos, confirmaciones o incluso eventos empresariales con logo.</p>\r\n<p data-start="1673" data-end="1703"><strong data-start="1673" data-end="1701">La presentación incluye:</strong></p>\r\n\r\n<ul data-start="1704" data-end="1979">\r\n \t<li data-start="1704" data-end="1766">\r\n<p data-start="1706" data-end="1766">Colgante en macramé hecho a mano (medida aproximada XX cm)</p>\r\n</li>\r\n \t<li data-start="1767" data-end="1829">\r\n<p data-start="1769" data-end="1829">Tarjeta personalizada en papel texturado de <strong data-start="1813" data-end="1827">16 × 10 cm</strong></p>\r\n</li>\r\n \t<li data-start="1830" data-end="1859">\r\n<p data-start="1832" data-end="1859">Ramillete de flores secas</p>\r\n</li>\r\n \t<li data-start="1860" data-end="1895">\r\n<p data-start="1862" data-end="1895">Bolsita de celofán autoadhesiva</p>\r\n</li>\r\n</ul>\r\n<p data-start="1981" data-end="2003"><strong data-start="1981" data-end="2001">Personalización:</strong></p>\r\n\r\n<ul data-start="2004" data-end="2189">\r\n \t<li data-start="2004" data-end="2054">\r\n<p data-start="2006" data-end="2054">Podés elegir entre varios colores de colgante.</p>\r\n</li>\r\n \t<li data-start="2055" data-end="2105">\r\n<p data-start="2057" data-end="2105">Opción de combinar más de un color por pedido.</p>\r\n</li>\r\n \t<li data-start="2106" data-end="2189">\r\n<p data-start="2108" data-end="2189">Posibilidad de diseño <strong data-start="2130" data-end="2144">“Especial”</strong>, adaptado a tu logo o temática específica.</p>\r\n</li>\r\n</ul>\r\n<p data-start="2191" data-end="2208"><strong data-start="2191" data-end="2206">Beneficios:</strong></p>\r\n\r\n<ul data-start="2209" data-end="2378">\r\n \t<li data-start="2209" data-end="2302">\r\n<p data-start="2211" data-end="2302">Un recuerdo <strong data-start="2223" data-end="2246">duradero y práctico</strong>, que puede usarse como colgante decorativo o llavero.</p>\r\n</li>\r\n \t<li data-start="2303" data-end="2378">\r\n<p data-start="2305" data-end="2378"><strong data-start="2305" data-end="2326">Artesanal y único</strong>, elaborado cuidadosamente con técnica de macramé.</p>\r\n</li>\r\n</ul>\r\n<p data-start="2380" data-end="2413"><strong data-start="2380" data-end="2411">Producción y pedido mínimo:</strong></p>\r\n\r\n<ul data-start="2414" data-end="2498">\r\n \t<li data-start="2414" data-end="2448">\r\n<p data-start="2416" data-end="2448">Pedido mínimo: <strong data-start="2431" data-end="2446">10 unidades</strong></p>\r\n</li>\r\n \t<li data-start="2449" data-end="2498">\r\n<p data-start="2451" data-end="2498">Tiempo de elaboración: <strong>10 a 15 días hábiles</strong></p>\r\n</li>\r\n</ul>	<h3 data-start="214" data-end="290"><strong data-start="218" data-end="288">Colgantes de macramé con tarjeta personalizada</strong></h3><ul data-start="292" data-end="633"> \t<li data-start="292" data-end="344"><p data-start="294" data-end="344">Colgante hecho a mano con técnica de <strong data-start="331" data-end="342">macramé</strong></p></li> \t<li data-start="345" data-end="425"><p data-start="347" data-end="425">Presentación en <strong data-start="363" data-end="398">tarjeta text	PROD-4913	5000.00	6	["/uploads/products/AirBrush_20230412192101.jpg","/uploads/products/AirBrush_20230412192520.jpg","/uploads/products/AirBrush_20230429173050.jpg","/uploads/products/AirBrush_20230429111749.jpg","/uploads/products/AirBrush_20230412193115.jpg","/uploads/products/1.png","/uploads/products/2.png"]	{}	{}	10	\N	999	f	f	t	3500.00	[]	2026-02-20 17:11:35.221208	2026-04-29 23:50:33.829	\N	f	\N	\N	\N	\N	t
36	Señaladores con Choco	senaladores-con-choco	Señaladores firmes con chocolate a juego.\r\nEl acabado de la tarjeta es brillante.\r\nLa frase de la misma se puede cambiar por lo que desee.\r\n\r\nLos diseños pueden personalizarse y ofrecemos crear nuevos en caso de que se necesite acoplar a la temática del evento.\r\n\r\nSabor del chocolate: Chocolate con leche.\r\n(En caso de faltante de fábrica se enviará con semi amargo)\r\n\r\nVencimientos: Hasta 2 años de la fecha actual.	Medida de la tarjeta: 17cm de alto por 6cm de ancho.Chocolate con leche.Frase y diseño totalmente personalizado.Vencimiento hasta 2 años.	PROD-6955	1500.00	4	["/uploads/products/AirBrush_20251018194114.jpg","/uploads/products/AirBrush_20251018193933-e1762532433121.jpg","/uploads/products/AirBrush_20251018194500.jpg","/uploads/products/AirBrush_20251018193933-e1762532433121.jpg","/uploads/products/1497358e-1116-4ed8-ac1b-f9f6401eb901.jpg"]	{}	{}	10	\N	999	t	f	f	\N	[]	2026-02-20 17:11:41.541443	2026-06-06 01:58:58.828	\N	f	\N	\N	\N	\N	t
45	Test Product Upload	test-product-upload		\N	TEST-SKU	100.00	9	["/uploads/products/ff8c8acf-88a5-403f-b4a0-56c298fc6996.jpg"]	{}	{}	1	\N	100	t	f	f	\N	[]	2026-05-01 19:32:09.725022	2026-05-01 20:01:24.435	\N	f	\N	\N	\N	\N	t
20	Cajita 2 Chocos	caja-2-chocolates	<p><span style="font-size: 14px;">Cajitas de 9x9x1cm<br>Estilo fosforera.<br>Chocolates sabor: Blanco o con leche.<br><br>Los chocolates se personalizan a juego.<br>(Se pueden realizar mas diseños a parte de los mostrados)<br>Envianos la foto y nosotros hacemos la magia.</span><br></p>	<p><span style="font-size: 14px;"><em>"Una presentación delicada que combina diseño, con dos dulces detallitos".</em></span><br><br><span style="font-size: 14px;"><em>Adaptamos tu diseño, temática o invitación.<br>Elegí con libertad el color de los detalles en metalizado<br>y moño en caso de ser necesario.</em></span></p>	cd2	3900.00	4	["/uploads/products/AirBrush_20230116201443-e1675279835839.jpg","/uploads/products/AirBrush_20230116201016-e1675279936799.jpg","/uploads/products/AirBrush_20221129121445-e1669738155234.jpg","/uploads/products/WhatsApp-Image-2023-02-07-at-11.19.12-2.jpeg","/uploads/products/WhatsApp-Image-2023-02-07-at-11.19.12-1.jpeg","/uploads/products/WhatsApp-Image-2023-02-07-at-11.19.12.jpeg","/uploads/products/WhatsApp-Image-2023-02-07-at-11.19.11-1.jpeg","/uploads/products/WhatsApp-Image-2023-02-07-at-11.19.11.jpeg","/uploads/products/Diseno-Caja-Cuadrado-scaled.jpg","/uploads/products/Diseno-Caja-Cuadrado-2-scaled.jpg","/uploads/products/Diseno-Caja-Cuadrado-3-scaled.jpg"]	{}	{}	10	\N	999	t	f	f	\N	[]	2026-02-20 17:11:32.557049	2026-05-23 21:37:35.212	\N	f	\N	\N	\N	\N	t
31	Estampita "Letra"	estampita-letra		<ul>\r\n \t<li data-start="259" data-end="307">\r\n<p data-start="261" data-end="307"><strong data-start="269" data-end="305">Estampita personalizada 18 × 7 cm</strong></p>\r\n</li>\r\n \t<li data-start="465" data-end="499">\r\n<p data-start="467" data-end="499">Pedido mínimo: <strong data-start="482" data-end="497">10 unidades</strong></p>\r\n</li>\r\n \t<li data-start="500" data-end="538">\r\n<p data-start="502" data-end="538">Producción: <strong data-start="514" data-end="536">5 a 7 días.</strong></p>\r\n</li>\r\n 	PROD-6447	1275.00	7	["/uploads/products/AirBrush_20230903125423.jpg","/uploads/products/AirBrush_20230620220428.jpg"]	{}	{}	10	\N	999	f	f	f	\N	[]	2026-02-20 17:11:39.060993	2026-02-20 17:11:39.060993	\N	f	\N	\N	\N	\N	t
37	Choco Cintas	choco-cintas	La tendencia!\r\n\r\nLas clásicas cintas de 15 pero ahora con un dulce detalle.\r\nLa finalización de los chocos puede ser con strass o los dijes de mdf con la leyenda de "mis 15" "♥"\r\nLos colores de estos pueden elegirse. al igual que las cintas\r\n\r\nChocolates: Chocolate con leche.\r\nCintas de aprox 1 mt.	La mitad de las cintas son de raso de color y la otra mitad de lurex Dorado o Plateado.Vencimientos largos: Hasta 2 años.Los Dijes NO SE REPITEN.Así sean 10 o 30 unidades, trataremos de que los dijes sean diferentes y acordes al evento.No habrán religiosos a menos que nos lo pida.	PROD-6959	1500.37	4	["/uploads/products/AirBrush_20251017102917-e1762539973351.jpg","/uploads/products/AirBrush_20251022163605-1.jpg","/uploads/products/AirBrush_20251022163849-1.jpg"]	{}	{}	1	\N	999	t	f	f	\N	[]	2026-02-20 17:11:42.05874	2026-05-01 19:39:39.591	\N	f	\N	\N	\N	\N	t
18	Llavero + Tarjeta Bautismo/Comunión	tarjeta-llavero	<p data-start="499" data-end="748"><strong data-start="499" data-end="515">Presentación</strong><br data-start="515" data-end="518" />Souvenir de <strong data-start="530" data-end="578">llavero con cuentas metálicas y dije de cruz</strong>, acompañado de una <strong data-start="598" data-end="642">tarjeta personalizada en papel texturado</strong>. Un recuerdo delicado y práctico, pensado para acompañar celebraciones religiosas y eventos especiales.</p>\r\n\r\n\r\n<hr data-start="750" data-end="753" />\r\n<p data-start="755" data-end="788"><strong data-start="755" data-end="786">Opciones de personalización</strong></p>\r\n\r\n<ul data-start="789" data-end="1092">\r\n \t<li data-start="789" data-end="860">\r\n<p data-start="791" data-end="860">Colores de llavero: <strong data-start="811" data-end="857">Rosa, Blanco, Celeste, Beige, Lila o Negro</strong>.</p>\r\n</li>\r\n \t<li data-start="861" data-end="915">\r\n<p data-start="863" data-end="915">Terminación del gancho:  <strong data-start="900" data-end="912">Plateado</strong>.</p>\r\n</li>\r\n \t<li data-start="916" data-end="1092">\r\n<p data-start="918" data-end="1092">La tarjeta puede personalizarse con: nombre, tipo de evento, fecha, iglesia y frase elegida.<br data-start="1010" data-end="1013" /><em data-start="1013" data-end="1090">(Estos datos son opcionales, solo se incluirán los que desees que figuren).</em></p>\r\n</li>\r\n</ul>\r\n\r\n<hr data-start="1094" data-end="1097" />\r\n<p data-start="1099" data-end="1131"><strong data-start="1099" data-end="1129">Producción y pedido mínimo</strong></p>\r\n\r\n<ul data-start="1132" data-end="1218">\r\n \t<li data-start="1132" data-end="1182">\r\n<p data-start="1134" data-end="1182">Tiempo de elaboración: <strong data-start="1157" data-end="1179">2 a 3 días hábiles</strong>.</p>\r\n</li>\r\n \t<li data-start="1183" data-end="1218">\r\n<p data-start="1185" data-end="1218">Pedido mínimo: <strong data-start="1200" data-end="1215">10 unidades</strong>.</p>\r\n</li>\r\n</ul>\r\n\r\n<hr data-start="1220" data-end="1223" />\r\n<p data-start="1225" data-end="1248"><strong data-start="1225" data-end="1246">Usos recomendados</strong></p>\r\n\r\n<ul data-start="1249" data-end="1371">\r\n \t<li data-start="1249" data-end="1269">\r\n<p data-start="1251" data-end="1269">Primera comunión</p>\r\n</li>\r\n \t<li data-start="1270" data-end="1283">\r\n<p data-start="1272" data-end="1283">Bautismos</p>\r\n</li>\r\n \t<li data-start="1284" data-end="1302">\r\n<p data-start="1286" data-end="1302">Confirmaciones</p>\r\n</li>\r\n \t<li data-start="1303" data-end="1331">\r\n<p data-start="1305" data-end="1331">Otros eventos religiosos</p>\r\n</li>\r\n \t<li data-start="1332" data-end="1371">\r\n<p data-start="1334" data-end="1371">Recuerdos especiales para invitados</p>\r\n</li>\r\n</ul>	<h3 data-start="345" data-end="408"><strong data-start="349" data-end="406">Llavero con Tarjeta Personalizada</strong></h3>\r\n<ul data-start="410" data-end="709">\r\n \t<li data-start="410" data-end="461">\r\n<p data-start="412" data-end="461">Tarjetón telado de <strong data-start="431" data-end="444">9,5 × 13 cm</strong> personalizado.</p>\r\n</li>\r\n \t<li data-start="462" data-end="523">\r\n<p data-start="464" data-end="523">Incluye <strong data-start="472" data-end="520">llavero con cuentas metálicas y 	PROD-4283	3000.00	1	["/uploads/products/IMG_20230320_151039_958.webp","/uploads/products/IMG_20230320_151040_125.webp","/uploads/products/AirBrush_20220826162524.jpg","/uploads/products/IMG_20230320_151039_958.webp","/uploads/products/AirBrush_20220826162344.jpg","/uploads/products/24634552.jpg","/uploads/products/IMG_20230320_151040_086.webp"]	{}	{}	10	\N	999	f	f	f	\N	[]	2026-02-20 17:11:31.523555	2026-02-20 17:11:31.523555	\N	f	\N	\N	\N	\N	t
19	Tarro -40 Chocolatines-	tarro-40-chocolatines	PRESENTACION:\r\nTarro de cartón personalizado junto con 40 Chocolatines personalizados de Chocolate Semi Amargo o Con Leche\r\nChocolatines de 3,5cm de alto por 2,5cm de ancho\r\n___________________________________________________________\r\n\r\nPERSONALIZACIÓN:\r\nEstos chocolates pueden personalizarse en su exterior con el motivo que desee.\r\nSABORES: Semi Amargo o Con Leche.\r\n\r\nEl TEXTO no varía ni en su disposición, ni en sus fuentes, solo se personaliza con los datos necesarios.\r\n\r\nDETALLES: Los textos pueden hacerse de los siguientes colores metalizados: Dorado, Plateado, Plateado Mate, Negro, Azul, Celeste, Rose Gold, Fucsia, Rosa, Verde, Naranja y Rojo.\r\nO bien pueden hacerse de los colores originales pero sin metalizar.\r\n\r\n_____________________________________________________________\r\n\r\nDISEÑO:\r\nPara armar estos souvenirs, necesitaremos que, al finalizar la compra, nos envíe un mensajito mediante Whats App o Mail indicando: Nombre, Evento, Fecha, Frase y Diseño elegido y Color del texto.\r\n_____________________________________________________________\r\n\r\nENVIOS Y DEMORA:\r\nLos envíos mediante Correo Argentino al Interior demoran entre 3 a 7 días hábiles en llegar, (Según distancia de la provincia de destino)\r\nAl AMBA tiene una demora de 1 a 3 días hábiles\r\n\r\nLos envíos por particular se coordinan previamente y son únicamente en CABA (alrededores Consultar).	😍 40 chocolatinas sabor Chocolate con leche\r\nMedidas: 3,5cm de alto x 2cm de ancho\r\nVencimientos: 2026\r\n\r\n✅ Por las altas temperaturas, adoptamos medidas de protección y conservación para que lleguen en excelentes condiciones a cualquier destino del país.\r\n\r\n<b>Tiempo de elaboración 5-7 días </b>	PROD-4447	30200.00	4	["/uploads/products/AirBrush_20220912111650.jpg","/uploads/products/AirBrush_20220912112957.jpg"]	{}	{}	10	\N	999	f	f	f	\N	[]	2026-02-20 17:11:32.028771	2026-02-20 17:11:32.028771	\N	f	\N	\N	\N	\N	t
16	Vela Gold 100cc sin fragancia	vela-100cc	<h2>Especificaciones</h2>\r\n<ul>\r\n \t<li>Medidas: 5cm de diámetro, 7,2cm de alto.</li>\r\n \t<li>Horas de encendido: aprox. 25hs en total.</li>\r\n \t<li>Material: Vidrio.</li>\r\n \t<li>Relleno: Cera de Soja.</li>\r\n</ul>\r\n\r\n<hr />\r\n\r\n<h2 style="font-style: normal;">Tiempos de Envío:</h2>\r\n<p style="font-size: 16px; font-style: normal; font-weight: 400;">Mediante Correo Argentino:\r\nAl interior: de 3 a 7 días hábiles\r\nAMBA: de 1 a 3 dias</p>\r\n\r\n<h2><span style="font-size: 16px; font-style: normal; font-weight: 400;">Moto-mensajería AMBA: se pacta la entrega una vez finalizado el pedido. ($8000)</span></h2>\r\n<h2></h2>\r\n<h2>Diseño de las Etiquetas</h2>\r\nTambién puede enviarnos su diseño ya hecho en formato PNG o JPG en blanco y negro, con buena definición, sin sombras grises ya que el efecto no se logra en estas.\r\n\r\n<hr />\r\n\r\n<h2>Protección</h2>\r\nLas velas serán entregadas/despachadas cada una con su correspondiente cajita individual. Dentro de la caja contenedora de todas ellas, de relleno la caja contendrá viruta para resguardarla de los golpes ajenos. Finalmente la caja estará envuelta en papel film negro para protegerla de posibles lluvias con la leyenda de frágil en todo su exterior.\r\n\r\n<hr />	Velas Personalizadas diseño GOLD.🏅\r\n\r\nMedidas: 7,2cm de alto 5cm de diámetro.\r\n\r\n🔔 Una vez realizada la compra nos debe indicar los datos para personalizar las velitas.\r\n\r\n<b>Pedido Mínimo 10 unidades</b>\r\n<b>Tiempo de elaboración 5-7 días </b>	PROD-3955	3200.00	5	["/uploads/products/AirBrush_20220518162136.jpg","/uploads/products/AirBrush_20220518162032.jpg","/uploads/products/20210722_164006-scaled.jpg"]	{}	{}	10	\N	999	f	f	t	2600.00	[]	2026-02-20 17:10:28.978957	2026-02-20 17:10:28.978957	\N	f	\N	\N	\N	\N	t
26	Llavero Infinito	colgante-infinito	<p data-start="345" data-end="660"><strong data-start="345" data-end="361">Presentación</strong><br data-start="361" data-end="364" />Colgantes elaborados a mano con la técnica de macramé, un recuerdo original y elegante que tus invitados podrán conservar como detalle decorativo o práctico. Cada pieza se entrega en una <strong data-start="551" data-end="590">tarjeta personalizada de 16 × 10 cm</strong> y en una <strong data-start="600" data-end="635">bolsita de celofán autoadhesiva</strong>, lista para obsequiar.</p>\r\n\r\n\r\n<hr data-start="662" data-end="665" />\r\n<p data-start="667" data-end="688"><strong data-start="667" data-end="686">Personalización</strong></p>\r\n\r\n<ul data-start="689" data-end="1247">\r\n \t<li data-start="689" data-end="765">\r\n<p data-start="691" data-end="765">Colores disponibles en variedad de tonos, combinables según preferencia.</p>\r\n</li>\r\n \t<li data-start="766" data-end="928">\r\n<p data-start="768" data-end="928">Podés elegir más de un color en tu pedido. Luego de la compra, nos contactaremos por WhatsApp para coordinar todos los detalles junto con tu número de pedido.</p>\r\n</li>\r\n \t<li data-start="929" data-end="1066">\r\n<p data-start="931" data-end="1066">Los diseños de las tarjetas se adaptan a la temática de tu evento: bautismos, comuniones, bodas, cumpleaños o empresariales con logo.</p>\r\n</li>\r\n \t<li data-start="1067" data-end="1247">\r\n<p data-start="1069" data-end="1247">También contamos con la opción <strong data-start="1100" data-end="1114">“Especial”</strong>, pensada para pedidos personalizados fuera de los modelos publicados (ejemplo: souvenirs corporativos o adaptaciones específicas).</p>\r\n</li>\r\n</ul>\r\n\r\n<hr data-start="1249" data-end="1252" />\r\n<p data-start="1254" data-end="1281"><strong data-start="1254" data-end="1279">Detalles del producto</strong></p>\r\n\r\n<ul data-start="1282" data-end="1558">\r\n \t<li data-start="1282" data-end="1359">\r\n<p data-start="1284" data-end="1359"><strong data-start="1284" data-end="1310">Tarjeta personalizada:</strong> papel texturado, tamaño aproximado 16 × 10 cm.</p>\r\n</li>\r\n \t<li data-start="1360" data-end="1435">\r\n<p data-start="1362" data-end="1435"><strong data-start="1362" data-end="1386">Colgante en macramé:</strong> hecho a mano, con terminación en aro metálico.</p>\r\n</li>\r\n \t<li data-start="1436" data-end="1496">\r\n<p data-start="1438" data-end="1496"><strong data-start="1438" data-end="1461">Presentación final:</strong> bolsita de celofán autoadhesiva.</p>\r\n</li>\r\n</ul>\r\n<p data-start="1560" data-end="1680"><em data-start="1560" data-end="1567">Nota:</em> Al ser un trabajo artesanal, los largos y terminaciones pueden variar ligeramente. Cada colgante es <strong data-start="1668" data-end="1677">único</strong>.</p>\r\n\r\n\r\n<hr data-start="1682" data-end="1685" />\r\n<p data-start="1687" data-end="1719"><strong data-start="1687" data-end="1717">Producción y pedido mínimo</strong></p>\r\n\r\n<ul data-start="1720" data-end="1804">\r\n \t<li data-start="1720" data-end="1754">\r\n<p data-start="1722" data-end="1754">Pedido mínimo: <strong data-start="1737" data-end="1752">10 unidades</strong></p>\r\n</li>\r\n \t<li data-start="1755" data-end="1804">\r\n<p data-start="1757" data-end="1804">Tiempo de elaboración: <strong data-start="1780" data-end="1802">5 a 7 días hábiles</strong></p>\r\n</li>\r\n</ul>\r\n&nbsp;	<ul> \t<li data-start="206" data-end="258"><p data-start="208" data-end="258">Colgante hecho a mano con técnica de <strong data-start="245" data-end="256">macramé</strong></p></li> \t<li data-start="259" data-end="307"><p data-start="261" data-end="307">Incluye <strong data-start="269" data-end="305">tarjeta personalizada 16 × 10 cm</strong></p></li> \t<li data-start="308" data-end="363"><p data-start="310" data-end="363">Presentación en <strong data-start="326" data-end="361">bolsi	PROD-5028	3000.00	6	["/uploads/products/AirBrush_20230503165353c.jpg","/uploads/products/AirBrush_2023050317212923.jpg","/uploads/products/12.png","/uploads/products/13.png"]	{}	{}	10	\N	999	f	f	t	2500.00	[]	2026-02-20 17:11:35.723405	2026-04-29 23:53:31.644	\N	f	\N	\N	\N	\N	t
21	Cajita Con Moño	caja-2-chocolates-mono	\r\n	\N	cd2-moño	4700.00	4	["/uploads/products/AirBrush_20221125184121.jpg","/uploads/products/AirBrush_20221129122221-e1669738109784.jpg","/uploads/products/Diseno-Caja-Cuadrado-scaled.jpg","/uploads/products/Diseno-Caja-Cuadrado-2-scaled.jpg","/uploads/products/Diseno-Caja-Cuadrado-3-scaled.jpg"]	{}	{}	10	\N	999	t	f	f	\N	[]	2026-02-20 17:11:33.062498	2026-05-01 19:53:23.209	\N	f	\N	\N	\N	\N	t
24	Chocolatines Medianos	chocolatines-medianos		\N	PROD-4829	950.00	4	["/uploads/products/AirBrush_20230216164944.jpg","/uploads/products/AirBrush_20230216164749.jpg","/uploads/products/20230216_162939-scaled.jpg","/uploads/products/AirBrush_20230216164540.jpg","/uploads/products/20230216_162836-scaled.jpg"]	{}	{}	10	\N	999	t	f	f	\N	[]	2026-02-20 17:11:34.671248	2026-05-01 19:54:29.056	\N	f	\N	\N	\N	\N	t
32	Estampita "Gold"			<ul>\n \t<li data-start="259" data-end="307">\n<p data-start="261" data-end="307"><strong data-start="269" data-end="305">Estampita personalizada 18 × 7 cm</strong></p>\n</li>\n \t<li data-start="465" data-end="499">\n<p data-start="467" data-end="499">Pedido mínimo: <strong data-start="482" data-end="497">10 unidades</strong></p>\n</li>\n \t<li data-start="500" data-end="538">\n<p data-start="502" data-end="538">Producción: <strong data-start="514" data-end="536">5 a 7 días.</strong></p>\n</li>\n \t<li data-	PROD-6460	1275.00	7	["/uploads/products/AirBrush_20230903125423.jpg","/uploads/products/AirBrush_20230620220428.jpg"]	{}	{}	10	\N	999	f	f	f	\N	[]	2026-02-20 17:11:39.532949	2026-02-20 17:11:39.532949	\N	f	\N	\N	\N	\N	t
30	Box N°44 Chocolates	box-n44	<p>Los chocolates son:<br>SIN TACC<br>Apto Kosher.<br>Sabor Chocolate con Leche<br>Vencimiento finales del 2027.<br><br>Marca: Colonial.<br><br>Medidas de la caja: 18cm x 12cm<br>Profundidad: 3cm<br><br>Tapa Transparente, estilo fosforera (deslizable)<br></p>	<p>Caja con 44 o 22 chocos con frases surtidas ideal para regalar a Recientes Mamás, Quinceañeras, Amigos, Navidad, Año Nuevo. <br><br>Se puede personalizar la frase central compuesta por los 7 chocolates verticales y la "portada".<br>Especial para dedicar.<br></p>	PROD-6299	35000.00	1	["/uploads/products/AirBrush_20251018130127.jpg","/uploads/products/AirBrush_20251018125821.jpg","/uploads/products/AirBrush_20251018125838.jpg","/uploads/products/AirBrush_20251018125916.jpg"]	{}	{}	1	\N	999	t	f	f	\N	[]	2026-02-20 17:11:38.329386	2026-06-07 23:05:55.032	\N	f	\N	\N	\N	\N	t
34	Mini Chocos Full Color (Sueltos)	50-mini-chocos-full-color	<p data-start="511" data-end="532"><strong data-start="511" data-end="530">Personalización</strong></p>\r\n\r\n<ul data-start="533" data-end="906">\r\n \t<li data-start="533" data-end="710">\r\n<p data-start="535" data-end="710">Podés indicarnos la temática de tu evento o enviarnos el diseño de tu invitación / PDF del Candy Bar para lograr una personalización coherente con el resto de la decoración.</p>\r\n</li>\r\n \t<li data-start="711" data-end="813">\r\n<p data-start="713" data-end="813">También podés enviarnos un mensaje previo para confirmar si es posible realizar el diseño deseado.</p>\r\n</li>\r\n \t<li data-start="814" data-end="906">\r\n<p data-start="816" data-end="906">Cada chocolatín puede llevar nombre, logo, fecha, frase o ilustración, según la ocasión.</p>\r\n</li>\r\n</ul>\r\n<p data-start="913" data-end="938"><strong data-start="913" data-end="936">Sabores disponibles</strong></p>\r\n\r\n<ul data-start="939" data-end="1063">\r\n \t<li data-start="939" data-end="978">\r\n<p data-start="941" data-end="978"><strong data-start="941" data-end="964">Chocolate con leche</strong> (incluido).</p>\r\n</li>\r\n \t<li data-start="979" data-end="1021">\r\n<p data-start="981" data-end="1021"><strong data-start="981" data-end="1006">Chocolate semi amargo</strong> (consultar).</p>\r\n</li>\r\n \t<li data-start="1022" data-end="1063">\r\n<p data-start="1024" data-end="1063"><strong data-start="1024" data-end="1048">Chocolate sin azúcar</strong> (consultar).</p>\r\n</li>\r\n</ul>\r\n<p data-start="1070" data-end="1093"><strong data-start="1070" data-end="1091">Usos recomendados</strong></p>\r\n\r\n<ul data-start="1094" data-end="1289">\r\n \t<li data-start="1094" data-end="1173">\r\n<p data-start="1096" data-end="1173">Souvenirs para cumpleaños, bautismos, comuniones, quinceaños o casamientos.</p>\r\n</li>\r\n \t<li data-start="1174" data-end="1233">\r\n<p data-start="1176" data-end="1233">Detalles para empresas, ferias y lanzamientos de marca.</p>\r\n</li>\r\n \t<li data-start="1234" data-end="1289">\r\n<p data-start="1236" data-end="1289">Complemento para mesas dulces o bolsitas de regalo.</p>\r\n</li>\r\n</ul>\r\n<p data-start="753" data-end="770"><strong data-start="753" data-end="768">Beneficios:</strong></p>\r\n\r\n<ul data-start="771" data-end="1001">\r\n \t<li data-start="771" data-end="847">\r\n<p data-start="773" data-end="847"><strong data-start="773" data-end="797">Pequeños y prácticos</strong>, ideales para mesas dulces o bolsitas de regalo</p>\r\n</li>\r\n \t<li data-start="848" data-end="934">\r\n<p data-start="850" data-end="934"><strong data-start="850" data-end="881">Diseño totalmente adaptable</strong> a la temática de tu evento o identidad corporativa</p>\r\n</li>\r\n \t<li data-start="935" data-end="1001">\r\n<p data-start="937" data-end="1001"><strong data-start="937" data-end="963">Vencimiento prolongado</strong>, perfectos para compras en cantidad</p>\r\n</li>\r\n</ul>\r\n<p data-start="1003" data-end="1031"><strong data-start="1003" data-end="1029">Descuentos especiales:</strong></p>\r\n\r\n<ul data-start="1032" data-end="1064">\r\n \t<li data-start="1032" data-end="1064">\r\n<p data-start="1034" data-end="1064">A partir de <strong data-start="1046" data-end="1062">200/500/1000/2000 unidades</strong></p>\r\n</li>\r\n</ul>\r\n<p data-start="1296" data-end="1328"><strong data-start="1296" data-end="1326">Envíos y plazos de entrega</strong></p>\r\n\r\n<ul data-start="1329" data-end="1583">\r\n \t<li data-start="1329" data-end="1419">\r\n<p data-start="1331" data-end="1419"><strong data-start="1331" data-end="1372">Interior del país (Correo Argentino):</strong> entre 3 y 7 días hábiles según la provincia.</p>\r\n</li>\r\n \t<li data-start="1420" data-end="1459">\r\n<p data-start="1422" data-end="1459"><strong data-start="1422" data-end="1431">AMBA:</strong> entre 1 y 3 días hábiles.</p>\r\n</li>\r\n \t<li data-start="1460" data-end="1532">\r\n<p data-start="1462" data-end="1532"><strong data-start="1462" data-end="1485">CABA y alrededores:</strong> entregas con cadete a coordinar previamente.</p>\r\n</li>\r\n \t<li data-start="1533" data-end="1583">\r\n<p data-start="1535" data-end="1583">Tiempo de elaboración: <strong data-start="1558" data-end="1580">5 a 7 días hábiles</strong>.</p>\r\n</li>\r\n</ul>\r\n<p data-start="1585" data-end="1735">Contamos con medidas de protección y conservación para que los chocolates lleguen en perfectas condiciones, incluso en épocas de altas temperaturas.</p>\r\n&nbsp;	<p data-start="325" data-end="395">Un detalle dulce y versátil, adaptable a cualquier evento.</p><ul> \t<li data-start="325" data-end="395">Pedido mínimo 25 unidades</li></ul><p data-start="397" data-end="419"><strong data-start="397" data-end="417">Características:</strong></p><ul data-start="420" data-end="558"> \t<li data-start="420" data-end="467"><p data-start="422" data-end="467">Medida de cada chocolatín: <strong data-start="449" data-end="465">3,5 × 2,5 cm</strong></p><	chocos-sueltos-c	900.00	4	["/uploads/products/AirBrush_20251106202810-scaled-e1762478433873.jpg","/uploads/products/AirBrush_20251001152901.jpg","/uploads/products/20250325_145038-scaled.jpg","/uploads/products/AirBrush_20251106202826-scaled-e1762478493979.jpg","/uploads/products/AirBrush_20251106202810-scaled-e1762478433873.jpg","/uploads/products/20251031_160848-scaled-e1762477401370.jpg"]	{}	{}	10	\N	999	f	f	f	\N	[]	2026-02-20 17:11:40.55361	2026-05-01 19:39:39.571	\N	f	\N	\N	\N	\N	t
40	test	test		\N		10.00	20	[]	{}	{}	1	\N	1	t	f	f	\N	[]	2026-02-21 03:34:58.746071	2026-02-21 21:22:05.94	\N	f	\N	\N	\N	\N	t
27	Vela Gold 100cc con Aroma	vela-gold-100cc-con-aroma	<h2>Especificaciones</h2>\r\n<ul>\r\n \t<li>Medidas: 5cm de diámetro, 7,2cm de alto.</li>\r\n \t<li>Horas de encendido: aprox. 25hs en total.</li>\r\n \t<li>Material: Vidrio.</li>\r\n \t<li>Relleno: Cera de Soja.</li>\r\n</ul>\r\n\r\n<hr />\r\n\r\n<h2 style="font-style: normal;">Tiempos de Envío:</h2>\r\n<p style="font-size: 16px; font-style: normal; font-weight: 400;">Mediante Correo Argentino:\r\nAl interior: de 3 a 7 días hábiles\r\nAMBA: de 1 a 3 días</p>\r\n\r\n<h2><span style="font-size: 16px; font-style: normal; font-weight: 400;">Moto-mensajería AMBA: se pacta la entrega una vez finalizado el pedido. ($8000)</span></h2>\r\n<h2></h2>\r\n&nbsp;\r\n\r\n<hr />\r\n\r\n<h2>Protección</h2>\r\nLas velas serán entregadas/despachadas cada una con su correspondiente cajita individual. Dentro de la caja contenedora de todas ellas, de relleno la caja contendrá viruta para resguardarla de los golpes ajenos. Finalmente la caja estará envuelta en papel film negro para protegerla de posibles lluvias con la leyenda de frágil en todo su exterior.\r\n\r\n<hr />	Velas Personalizadas diseño GOLD.🏅Medidas: 7,2cm de alto 5cm de diámetro.🔔  Una vez realizada la compra nos debe indicar los datos para personalizar las Velitas.<b>Pedido Mínimo 10 unidades</b><b>Tiempo de elaboración 5-7 días </b>	PROD-5088	3500.00	5	["/uploads/products/AirBrush_20220518162136.jpg","/uploads/products/AirBrush_20220518162032.jpg","/uploads/products/20210722_164006-scaled.jpg"]	{}	{}	10	\N	999	f	f	t	3100.00	[]	2026-02-20 17:11:36.252406	2026-04-30 00:33:32.691	\N	f	\N	\N	\N	\N	t
38	Chocos Festivos	chocolates-tematicos	Chocolates de 3cm x 2cm.Sabor: Chocolate con leche.Vencimiento: NOV 2027 Diseños Surtidos. Entrega Inmediata.	Chocolatitos con diseños navideños ideales para regalar a amigos, familiares, clientes, empleados.  Una dulce atención en este mágico momento.  Personalizalos con tu logo o frase especial.	PROD-7110	820.00	1	["/uploads/products/AirBrush_20251217141920-2.jpg","/uploads/products/AirBrush_20251217142853-1.jpg","/uploads/products/AirBrush_20251205190437.jpg","/uploads/products/A4-24-scaled.png"]	{}	{}	1	\N	999	t	f	f	\N	[]	2026-02-20 17:11:42.606487	2026-05-01 19:39:39.576	\N	f	\N	\N	\N	\N	t
44	Mini Recuerdos	mini-recuerdos		Mini Recuerdos	\N	0.00	4	[]	{}	{}	1	\N	0	f	f	f	\N	[]	2026-02-23 19:33:25.657787	2026-02-23 19:33:25.657787	\N	f	\N	\N	\N	\N	t
17	Cajita Classic	cajita-con-chocolates	<p data-start="260" data-end="522"><strong data-start="260" data-end="276">Presentación</strong><br data-start="276" data-end="279" />Cajita de cartulina de <strong data-start="308" data-end="325">16 × 4 × 2 cm</strong>, personalizada con el diseño que elijas y adaptada a la temática de tu evento.<br data-start="404" data-end="407" />En su interior contiene <strong data-start="431" data-end="465">6 chocolatines de 3,5 × 2,5 cm</strong> cada uno, elaborados en delicioso chocolate con leche.</p>\r\n\r\n\r\n<hr data-start="524" data-end="527" />\r\n<p data-start="529" data-end="550"><strong data-start="529" data-end="548">Personalización</strong></p>\r\n\r\n<ul data-start="551" data-end="810">\r\n \t<li data-start="551" data-end="612">\r\n<p data-start="553" data-end="612">El diseño de la caja es totalmente adaptable a tu evento.</p>\r\n</li>\r\n \t<li data-start="613" data-end="734">\r\n<p data-start="615" data-end="734">Cada chocolatín puede llevar un mismo texto repetido o una frase dividida en las 6 unidades (a elección del cliente).</p>\r\n</li>\r\n \t<li data-start="735" data-end="810">\r\n<p data-start="737" data-end="810">Personalización disponible con nombre, fecha, frase y colores de texto.</p>\r\n</li>\r\n</ul>\r\n\r\n<hr data-start="812" data-end="815" />\r\n<p data-start="817" data-end="839"><strong data-start="817" data-end="837">Sabor disponible</strong></p>\r\n\r\n<ul data-start="840" data-end="864">\r\n \t<li data-start="840" data-end="864">\r\n<p data-start="842" data-end="864">Chocolate con leche.</p>\r\n</li>\r\n</ul>\r\n\r\n<hr data-start="866" data-end="869" />\r\n<p data-start="871" data-end="979"><strong data-start="871" data-end="895">Cómo hacer tu pedido</strong><br data-start="895" data-end="898" />Una vez realizada la compra, envíanos por WhatsApp o mail los siguientes datos:</p>\r\n\r\n<ul data-start="980" data-end="1101">\r\n \t<li data-start="980" data-end="1006">\r\n<p data-start="982" data-end="1006">Nombre del agasajado/a</p>\r\n</li>\r\n \t<li data-start="1007" data-end="1025">\r\n<p data-start="1009" data-end="1025">Tipo de evento</p>\r\n</li>\r\n \t<li data-start="1026" data-end="1035">\r\n<p data-start="1028" data-end="1035">Fecha</p>\r\n</li>\r\n \t<li data-start="1036" data-end="1062">\r\n<p data-start="1038" data-end="1062">Frase (si corresponde)</p>\r\n</li>\r\n \t<li data-start="1063" data-end="1081">\r\n<p data-start="1065" data-end="1081">Diseño elegido</p>\r\n</li>\r\n</ul>\r\n\r\n<hr data-start="1103" data-end="1106" />\r\n<p data-start="1108" data-end="1140"><strong data-start="1108" data-end="1138">Envíos y plazos de entrega</strong></p>\r\n\r\n<ul data-start="1141" data-end="1345">\r\n \t<li data-start="1141" data-end="1238">\r\n<p data-start="1143" data-end="1238"><strong data-start="1143" data-end="1184">Interior del país (Correo Argentino):</strong> 3 a 7 días hábiles (según la provincia de destino).</p>\r\n</li>\r\n \t<li data-start="1239" data-end="1272">\r\n<p data-start="1241" data-end="1272"><strong data-start="1241" data-end="1250">AMBA:</strong> 1 a 3 días hábiles.</p>\r\n</li>\r\n \t<li data-start="1273" data-end="1345">\r\n<p data-start="1275" data-end="1345"><strong data-start="1275" data-end="1298">CABA y alrededores:</strong> entregas por cadete a coordinar previamente.</p>\r\n</li>\r\n</ul>\r\n<p data-start="1347" data-end="1565">Tiempo de elaboración del pedido: <strong data-start="1381" data-end="1403"> 7 a 10 días hábiles</strong>.<br data-start="1404" data-end="1407" />Se toman medidas especiales de protección y conservación para que los chocolates lleguen en excelentes condiciones, incluso en épocas de altas temperaturas.</p>	<p data-start="226" data-end="354"><strong data-start="226" data-end="274">Cajita personalizada con 6 chocolatines.</strong><br data-start="274" data-end="277" />Un recuerdo elegante, ideal para todo tipo de eventos.</p><p data-start="356" data-end="377"><strong data-start="356" data-end="375">Características</strong></p><ul data-start="378" data-end="526"> \t<li data-start="378" data-end="428"><p data-start="380" data-end="428">Incluye 6 chocolatines de leche</p></li> \t<li data-sta	cajita-classic	5000.00	4	["/uploads/products/AirBrush_20220726185344-1.jpg","/uploads/products/AirBrush_20221116171913.jpg","/uploads/products/20250403_111821-scaled-e1756843398571.jpg","/uploads/products/IMG_20250306_203855_665-e1756843341903.webp","/uploads/products/IMG_20250325_170708_601-e1756843313907.webp","/uploads/products/IMG_20250304_153315_536-e1756843275549.webp","/uploads/products/IMG_20250404_174334_545-1-e1756843194563.webp"]	{}	{}	10	\N	999	t	f	f	\N	[]	2026-02-20 17:11:30.99904	2026-05-01 19:39:39.567	\N	f	\N	\N	\N	\N	t
29	Petit Box N°4	petit-box-n4		\N	petit-box-4	3500.00	4	["/uploads/products/AirBrush_20251012151822.jpg","/uploads/products/AirBrush_20251012152306.jpg","/uploads/products/AirBrush_20251012153519.jpg","/uploads/products/AirBrush_20251012151947.jpg","/uploads/products/AirBrush_20251012152441.jpg","/uploads/products/AirBrush_20251012151822.jpg"]	{}	{}	15	\N	999	t	f	f	\N	[]	2026-02-20 17:11:37.560771	2026-05-01 19:39:39.586	\N	f	\N	\N	\N	\N	t
22	Cajita "GOLD"	cajita-de-chocolates-gold-2	<p data-start="330" data-end="586"><strong data-start="330" data-end="346">Presentación</strong><br data-start="346" data-end="349" />Cajitas de cartulina firme de <strong data-start="379" data-end="396">16 × 4 × 2 cm</strong>, personalizadas con el diseño que elijas y adaptadas a la temática de tu evento.<br data-start="477" data-end="480" />En su interior contiene <strong data-start="504" data-end="538">6 chocolatines de 3,5 × 2,5 cm</strong>, elaborados en exquisito chocolate con leche.</p>\r\n<p data-start="588" data-end="793">Esta versión <strong data-start="601" data-end="609">GOLD</strong> se distingue por su acabado <strong data-start="638" data-end="663">totalmente metalizado</strong>, disponible en <strong data-start="679" data-end="711">dorado, plateado o rose gold</strong>, logrando un recuerdo sofisticado y llamativo que realza cualquier celebración.</p>\r\n\r\n\r\n<hr data-start="795" data-end="798" />\r\n<p data-start="800" data-end="821"><strong data-start="800" data-end="819">Personalización</strong></p>\r\n\r\n<ul data-start="822" data-end="1025">\r\n \t<li data-start="822" data-end="873">\r\n<p data-start="824" data-end="873">Cada chocolatín se adapta al diseño de la caja.</p>\r\n</li>\r\n \t<li data-start="874" data-end="957">\r\n<p data-start="876" data-end="957">Podés optar por un mismo texto repetido o una frase dividida en las 6 unidades.</p>\r\n</li>\r\n \t<li data-start="958" data-end="1025">\r\n<p data-start="960" data-end="1025">Personalización disponible con nombres, fechas, logos o frases.</p>\r\n</li>\r\n</ul>\r\n\r\n<hr data-start="1027" data-end="1030" />\r\n<p data-start="1032" data-end="1057"><strong data-start="1032" data-end="1055">Modelos disponibles</strong></p>\r\n\r\n<ul data-start="1058" data-end="1222">\r\n \t<li data-start="1058" data-end="1095">\r\n<p data-start="1060" data-end="1095"><strong data-start="1060" data-end="1072">Classic:</strong> diseño a todo color.</p>\r\n</li>\r\n \t<li data-start="1096" data-end="1149">\r\n<p data-start="1098" data-end="1149"><strong data-start="1098" data-end="1112">Deluxe:</strong> combinación de color y metalizado.</p>\r\n</li>\r\n \t<li data-start="1150" data-end="1222">\r\n<p data-start="1152" data-end="1222"><strong data-start="1152" data-end="1171">Gold:</strong> completamente metalizado, sin detalles en color.</p>\r\n</li>\r\n</ul>\r\n\r\n<hr data-start="1224" data-end="1227" />\r\n<p data-start="1229" data-end="1394"><strong data-start="1229" data-end="1244">Durabilidad</strong><br data-start="1244" data-end="1247" />Los chocolatines poseen un <strong data-start="1274" data-end="1311">vencimiento prolongado hasta 2027</strong>, lo que permite comprarlos con anticipación sin preocuparse por la conservación.</p>\r\n\r\n\r\n<hr data-start="1396" data-end="1399" />\r\n<p data-start="1401" data-end="1430"><strong data-start="1401" data-end="1428">Beneficios y descuentos</strong></p>\r\n\r\n<ul data-start="1431" data-end="1618">\r\n \t<li data-start="1431" data-end="1466">\r\n<p data-start="1433" data-end="1466">Pedido mínimo: <strong data-start="1448" data-end="1463">10 unidades</strong>.</p>\r\n</li>\r\n \t<li data-start="1467" data-end="1517">\r\n<p data-start="1469" data-end="1517">Tiempo de elaboración: <strong data-start="1492" data-end="1514">5 a 7 días hábiles</strong>.</p>\r\n</li>\r\n \t<li data-start="1518" data-end="1618">\r\n<p data-start="1520" data-end="1618"><strong data-start="1520" data-end="1545">Descuentos especiales</strong> a partir de <strong data-start="1558" data-end="1574">100 unidades</strong>, ideales para grandes eventos o empresas.</p>\r\n</li>\r\n</ul>\r\n\r\n<hr data-start="1620" data-end="1623" />\r\n<p data-start="1625" data-end="1737"><strong data-start="1625" data-end="1652">Cómo realizar tu pedido</strong><br data-start="1652" data-end="1655" />Una vez concretada la compra, enviános por WhatsApp o mail los siguientes datos:</p>\r\n\r\n<ul data-start="1738" data-end="1859">\r\n \t<li data-start="1738" data-end="1764">\r\n<p data-start="1740" data-end="1764">Nombre del agasajado/a</p>\r\n</li>\r\n \t<li data-start="1765" data-end="1783">\r\n<p data-start="1767" data-end="1783">Tipo de evento</p>\r\n</li>\r\n \t<li data-start="1784" data-end="1793">\r\n<p data-start="1786" data-end="1793">Fecha</p>\r\n</li>\r\n \t<li data-start="1794" data-end="1820">\r\n<p data-start="1796" data-end="1820">Frase (si corresponde)</p>\r\n</li>\r\n \t<li data-start="1821" data-end="1839">\r\n<p data-start="1823" data-end="1839">Diseño elegido</p>\r\n</li>\r\n \t<li data-start="1840" data-end="1859">\r\n<p data-start="1842" data-end="1859">Color del texto</p>\r\n</li>\r\n</ul>\r\n\r\n<hr data-start="1861" data-end="1864" />\r\n<p data-start="1866" data-end="1899"><strong data-start="1866" data-end="1897">Envíos y tiempos de entrega</strong></p>\r\n\r\n<ul data-start="1900" data-end="2105">\r\n \t<li data-start="1900" data-end="1992">\r\n<p data-start="1902" data-end="1992"><strong data-start="1902" data-end="1943">Interior del país (Correo Argentino):</strong> entre 3 y 7 días hábiles (según la provincia).</p>\r\n</li>\r\n \t<li data-start="1993" data-end="2032">\r\n<p data-start="1995" data-end="2032"><strong data-start="1995" data-end="2004">AMBA:</strong> entre 1 y 3 días hábiles.</p>\r\n</li>\r\n \t<li data-start="2033" data-end="2105">\r\n<p data-start="2035" data-end="2105"><strong data-start="2035" data-end="2058">CABA y alrededores:</strong> entregas con cadete a coordinar previamente.</p>\r\n</li>\r\n</ul>\r\n<p data-start="2107" data-end="2307">Todos los pedidos son preparados con medidas especiales de protección y conservación para garantizar que los chocolates lleguen en perfectas condiciones, incluso en temporadas de altas temperaturas.</p>	<p><strong>Cajita GOLD personalizada con 6 chocolatines 🍫</strong><br>Un souvenir premium, con acabado totalmente <strong>metalizado</strong> que resalta en cualquier evento. Disponible en <strong>dorado, plateado o rose gold</strong>, esta presentación es sinónimo de lujo y distinción.</p><p></p>	cgold	6200.00	4	["/uploads/products/AirBrush_20230408150440.jpg","/uploads/products/AirBrush_20230303200133.jpg","/uploads/products/AirBrush_20230303200911.jpg","/uploads/products/AirBrush_20230303195607.jpg","/uploads/products/AirBrush_20230303202238.jpg","/uploads/products/Cajas-Gold-scaled.jpg","/uploads/products/20251105_090244-scaled-e1762521056391.jpg"]	{}	{}	10	\N	999	t	t	f	\N	[]	2026-02-20 17:11:33.588773	2026-05-11 20:56:01.472	\N	f	\N	\N	\N	\N	t
23	Chocos con LOGO (+100)	mini-chocos-logo		Un detalle dulce y versátil, adaptable a cualquier evento. Pedido mínimo: 100 unidades. Medida de cada chocolatín:3,5 × 2,5 cm	chocos-sueltos	720.00	4	["/uploads/products/AirBrush_20250914192344-e1760397207588.jpg","/uploads/products/AirBrush_20251106202634-scaled.jpg","/uploads/products/AirBrush_20250914192344-e1760397207588.jpg","/uploads/products/AirBrush_20230320143655-e1760398401705.jpg","/uploads/products/AirBrush_20230320142850.jpg","/uploads/products/AirBrush_20250914192626-2.jpg","/uploads/products/20251104_123923-scaled.jpg"]	{}	{}	100	\N	999	t	f	f	\N	[]	2026-02-20 17:11:34.135248	2026-05-01 19:39:39.613	\N	f	\N	\N	\N	\N	t
39	Chocos sueltos Eventos	25-chocos-eventos-		Chocolates de 3cm x 2cm.Sabor: Chocolate con leche.Vencimiento: 2027Diseños Surtidos.Entrega Inmediata.	PROD-7299	820.00	1	["/uploads/products/7f8ecc3e-7c16-480d-9fa1-1a56b1bc9c9e.jpg","/uploads/products/6efd5131-8521-4a3b-a464-14b3844c40de.jpg","/uploads/products/678e7fc6-e852-45b7-85c6-55eaca5df98e.jpg","/uploads/products/58e21628-2d9f-463c-9d14-fa966b97ab38.jpg","/uploads/products/9d701845-e96f-4c5f-abe6-3695895faebf.jpg","/uploads/products/01c4067e-e9d0-49b1-915a-39369a4b2dfd.jpg","/uploads/products/cf506381-f023-4fc7-bd4a-8067a9fd624e.jpg"]	{}	{}	25	\N	999	t	f	f	\N	[]	2026-02-20 17:11:43.385465	2026-05-23 18:24:25.455	\N	f	\N	\N	\N	\N	t
35	Cajita "Black"	cajita-black		\N	cajita-black	6400.00	4	["/uploads/products/AirBrush_20251106202508-scaled.jpg","/uploads/products/AirBrush_20251106202441-scaled.jpg","/uploads/products/AirBrush_20251106202541-scaled.jpg","/uploads/products/20251105_183432-scaled-e1762519951902.jpg","/uploads/products/AirBrush_20251106202508-scaled.jpg","/uploads/products/AirBrush_20251106202810-scaled-e1762478433873.jpg","/uploads/products/20251031_160848-scaled-e1762477401370.jpg"]	{}	{}	10	\N	999	t	f	f	\N	[]	2026-02-20 17:11:41.046002	2026-05-01 19:50:05.283	\N	f	\N	\N	\N	\N	t
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, product_id, user_id, author_name, rating, title, comment, is_verified, is_approved, created_at) FROM stdin;
1	1	\N	Cristina Salas	5	\N	Super delicado todo. Nos encantó. Todo llegó en perfectas condiciones. Muchísimas gracias a todo el equipo. Super recomendables.	t	t	2026-02-11 13:50:10.878264
2	1	\N	Valeria Limonoff	5	\N	Excelente producto, atención y envoltorio con un diseño personalizado.	t	t	2026-02-11 13:50:11.113262
3	2	\N	Claudia V. González Díaz	5	\N	Excelente atención. Cumplieron con los tiempos de entrega, respondieron rápido las consultas y el resultado fue excelente. Muy recomendable.	t	t	2026-02-11 13:50:11.345076
4	3	\N	Natalia E. Vizgarra	5	\N	Super delicado el souvenir. Llegó en tiempo y forma según lo acordado.	t	t	2026-02-11 13:50:11.575555
5	1	\N	Sara Binder	5	\N	Excelente atención!! Los chocolates de calidad y la presentación, hermosa!! A partir de una idea, fueron consultándome sobre el diseño hasta que lo consideré adecuado.	t	t	2026-02-11 13:50:11.805489
6	5	\N	Magali Gesuelli	5	\N	Llegó en término y realmente muy bello presente. Muchas gracias por la dedicación... hermoso trabajo!	t	t	2026-02-11 13:50:12.037723
7	4	\N	Natalia Arona	5	\N	Unos genios, excelente atención y muy lindos diseños, los colores muy ricos.	t	t	2026-02-11 13:50:12.267374
8	9	\N	Erica Acosta	5	\N	Super super recomendables! Las botellitas son tal cual a las fotos que vi, la decoración quedó divina. Fueron muy atentos.	t	t	2026-02-11 13:50:12.499413
9	10	\N	Noelia Peralez	5	\N	Hermoso trabajo! Y la atención es excelente, encantada con los souvenirs 😍	t	t	2026-02-11 13:50:12.731168
10	6	\N	Natalia Hernández	5	\N	Súper recomendables, amables, destacable la predisposición para ayudar al cliente y brindar la mejor opción. Hermosos los diseños.	t	t	2026-02-11 13:50:12.973017
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, expires_at) FROM stdin;
818953641e9d6382adbb8fcc2670a42f7a0e3955b14e18fc57b4b25f5cf89467	4138358f-36c5-41cc-8741-dfa34563c400	2026-03-18 13:16:27.495
7e983f0dbf4c41964c753b8816f4015ebbfd572635483b3384ca1b301bc78bfd	4138358f-36c5-41cc-8741-dfa34563c400	2026-03-18 23:16:08.332
eb33e45fa91c85a254bc2f7a0232692e72255ffa191c07a6a550d67c175d6abd	4138358f-36c5-41cc-8741-dfa34563c400	2026-03-20 13:10:44.741
1cf494bbe569586cf7fa541ccb62a92f1a417b0f8bf445c73a9d7068ff4ae2f9	4138358f-36c5-41cc-8741-dfa34563c400	2026-03-20 13:34:24.116
97a10245d9745fdb98fe1c941dba4e27f94ca65afbba52652664589972972d20	4138358f-36c5-41cc-8741-dfa34563c400	2026-03-20 15:04:41.605
66c20602c51d7ca8dc3288adbc297b7ba7ef8290bfbba10f29bc78de1e368aa2	4138358f-36c5-41cc-8741-dfa34563c400	2026-03-22 17:20:53.579
a5f8b853e878f044e18fef91071bf54f7dc410e40c267718ac8881b406b08557	4138358f-36c5-41cc-8741-dfa34563c400	2026-03-22 21:49:16.423
5d337567924dc25d5f8a688da7e97efc2fba035c242c999991f7e305a2670112	4138358f-36c5-41cc-8741-dfa34563c400	2026-03-23 16:06:42.261
6a583d7a8497af3b8bb258d77e96e92800f35e362c89f73baf706592d9e8b11f	4138358f-36c5-41cc-8741-dfa34563c400	2026-03-25 21:16:22.102
19f744eb4eddedd9c7b970a53c85c91d65ee494c1fdd7a5395967e4cbc37e8a9	4138358f-36c5-41cc-8741-dfa34563c400	2026-03-26 01:17:34.109
abe43a18d9c2949ac1ecc18660231d97617c3dae873f7896121a5b9217e68673	4138358f-36c5-41cc-8741-dfa34563c400	2026-04-20 16:45:33.024
98a39c28f6fc3ae603dc6cc323b2afa26e784bbead4dc7f877ddf955a5711d98	4138358f-36c5-41cc-8741-dfa34563c400	2026-05-22 22:01:30.155
c9c6738316d7e340b6675c7d43472c4fd84ead8e50424891d9bd2900c2e721a7	4138358f-36c5-41cc-8741-dfa34563c400	2026-05-22 22:01:49.884
67de6731bca44b6ab36c154341f9b7bceedb4aaac8f20eb183a1621c1b60bfe3	4138358f-36c5-41cc-8741-dfa34563c400	2026-05-31 19:27:51.532
6e3cb44bdcfedbbce4132d2bf95a16defa1be33cb1eb3f27c3a00c9b1b464c69	4138358f-36c5-41cc-8741-dfa34563c400	2026-05-31 19:46:52.183
cdaf5a7d965a40e5ce4eb782ebb709357da506f4e53e412b10c4a848774509c8	4138358f-36c5-41cc-8741-dfa34563c400	2026-06-10 12:35:49.926
f687e84152c3f8ee53ec04b59744ddfe3146ccea41115c9dbbe385a57644b007	4138358f-36c5-41cc-8741-dfa34563c400	2026-06-10 21:19:33.152
4795876b58a61d6fb65d6dc7d08a126d98576fa20de893d595c9fe06caf6f1ac	4138358f-36c5-41cc-8741-dfa34563c400	2026-06-13 11:00:48.018
547afb67ceecfc03b96f9271675f7f154cfa5224c4ddd9b15433a9e446a00960	4138358f-36c5-41cc-8741-dfa34563c400	2026-06-21 23:31:42.897
967209105c8666d4e9e83c112507d012421099c69db6b94506a698893621775d	4138358f-36c5-41cc-8741-dfa34563c400	2026-06-23 19:59:22.577
4c7e92a9f6ec5f2b4264ab6537d8e8e241f1e2b220deb5d0bd5c67a8e8b47b2a	4138358f-36c5-41cc-8741-dfa34563c400	2026-06-27 13:28:56.156
7a87fbf54fe96733d54516c3a2a6df7f1627f0c38a718b0634bfb4a36a0b6722	4138358f-36c5-41cc-8741-dfa34563c400	2026-07-07 21:47:20.604
5ed2e65d5f5eafb5fb1111f636cb4674362fadf3662fb3ea33c0473581f2983b	4138358f-36c5-41cc-8741-dfa34563c400	2026-07-07 21:49:05.757
\.


--
-- Data for Name: shipping_real_costs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shipping_real_costs (id, zone, real_cost, updated_at) FROM stdin;
\.


--
-- Data for Name: site_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.site_config (id, key, value, description, updated_at) FROM stdin;
1	bank_transfer_data	{"cbu":"0000000000000000000000","alias":"DECOMOI.SOUVENIRS","holder":"NOMBRE TITULAR","bank":"NOMBRE BANCO","cuit":"XX-XXXXXXXX-X"}	Datos bancarios para transferencias	2026-02-11 13:50:13.206227
5	social_facebook	"https://www.facebook.com/decomoi"	Página de Facebook	2026-02-11 13:50:14.138876
6	promo_banner	"10% descuento por transferencia | Pedidos urgentes por WhatsApp"	Texto del banner promocional	2026-02-11 13:50:14.371062
7	free_shipping_threshold	50000	Monto mínimo para envío gratis	2026-02-11 13:50:14.601364
9	shipping_settings	{"enabled":true,"flatRateEnabled":false,"flatRate":0,"freeShippingEnabled":false,"freeShippingThreshold":0,"defaultWeight":10,"defaultHeight":1,"defaultWidth":1,"defaultLength":1,"pickupEnabled":true,"pickupLabel":"Retiro en local","pickupAddress":"Wilde, Avellaneda"}	Configuración del sistema de envíos	2026-02-19 14:31:36.036
15	bank_transfer_holder	"Magali Jessica Benua"	Titular de la cuenta para transferencias	2026-02-21 18:42:45.615
16	bank_transfer_cvu	"decomoi.mp"	CVU/CBU/Alias para transferencias	2026-02-21 18:42:45.623
2	bank_transfer_discount	10	Porcentaje de descuento por transferencia	2026-02-21 18:42:45.628
10	maintenance_mode	true	Activa o desactiva el modo mantenimiento del sitio	2026-02-20 15:53:13.891031
3	contact_whatsapp	"+5491160346537"	Número de WhatsApp	2026-05-22 23:48:17.535
8	checkout_form_fields	[{"id":"full_name","label":"Nombre Completo","type":"text","required":true,"width":"full","order":1},{"id":"new_field_1771642541240","label":"DNI","type":"text","required":true,"width":"full","order":2},{"id":"email","label":"Correo Electrónico","type":"email","required":true,"width":"half","order":3},{"id":"phone","label":"Teléfono / WhatsApp","type":"tel","required":true,"width":"half","order":4},{"id":"street","label":"Calle","type":"text","required":true,"width":"half","order":5},{"id":"number","label":"Número","type":"number","required":true,"width":"half","order":6},{"id":"postal_code","label":"Código Postal","type":"text","required":true,"width":"half","order":7},{"id":"floor_apt","label":"Piso / Depto (Opcional)","type":"text","required":false,"width":"half","order":8},{"id":"state","label":"Provincia","type":"text","required":true,"width":"full","order":9},{"id":"city","label":"Ciudad / Localidad","type":"text","required":true,"width":"full","order":10}]	Configuración de campos del formulario de checkout	2026-02-21 02:56:02.135
4	social_instagram	"https://instagram.com/deco_moi"	Perfil de Instagram	2026-05-22 23:48:17.544
\.


--
-- Data for Name: supplies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.supplies (id, name, category, unit, unit_cost, stock, supplier, link, notes, is_active, updated_at, created_at, parent_id, pack_price, pack_quantity, yield_ratio, min_stock, last_scraped_price, last_scraped_at) FROM stdin;
3	Chocolatín Georgalos	chocolates	u	391.00	40			\N	t	2026-02-21 23:21:23.227562	2026-02-21 23:21:23.227562	\N	\N	\N	\N	20	\N	\N
17	Borlas 13cm	extras	u	347.80	5			\N	t	2026-02-21 23:21:26.479627	2026-02-21 23:21:26.479627	\N	\N	\N	\N	20	\N	\N
20	Argolla	tejidos	u	51.85	100			\N	t	2026-02-21 23:21:27.181428	2026-02-21 23:21:27.181428	\N	\N	\N	\N	20	\N	\N
22	Bolsa Tejido base	tejidos	u	13.80	200			\N	t	2026-02-21 23:21:27.645728	2026-02-21 23:21:27.645728	\N	\N	\N	\N	20	\N	\N
36	Pegamento Ojalillo	velas	u	11.00	50	Nuevas Luces	https://nuevasluces.empretienda.com.ar/insumos-para-velas/materiales/pegamento-para-ojalillo-en-rollo-x100-puntos		t	2026-02-22 18:22:39.900183	2026-02-22 18:22:39.900183	\N	1100.00	100.000	\N	20	1100.00	2026-04-29 23:32:07.799
8	Kraft 270gr	hojas	hoja	145.70	50		https://www.mercadolibre.com.ar/papel-kraft-a4-270gr-resma-x50-hojas-madera-misionero/up/MLAU175523047?pdp_filters=item_id:MLA846595834#position=18&search_layout=grid&type=item&tracking_id=225e81f7-284b-44e5-abfe-aef6cbd21cf7		t	2026-02-22 17:43:37.531	2026-02-21 23:21:24.399131	\N	7285.00	50.000	\N	20	7285.00	2026-02-23 17:19:19.669
34	Cera APF	velas	g	14.00	0	Mil Aromas	https://www.mercadolibre.com.ar/1-kg-cera-soja-apf-alto-punto-fusion-para-moldes/up/MLAU2922895309#polycard_client=search-desktop&search_layout=grid&position=13&type=product&tracking_id=fdefbb9b-3bd1-44dd-8bd7-faa90ad78b60&wid=MLA1988315096&sid=search		t	2026-04-29 23:34:56.47	2026-02-22 18:11:52.261084	\N	14000.00	1000.000	\N	20	14000.00	2026-04-29 23:31:17.25
16	Cinta Raso N°0 3mm	tejidos	cm	1.01	1000	Candy Craft	https://www.candycraft.com.ar/productos/cinta-raso-n0-3-mm-x-50-metros/		t	2026-04-29 23:34:11.526	2026-02-21 23:21:26.247175	\N	5074.00	5000.000	\N	20	5074.00	2026-04-29 23:32:09.974
4	Fotográfico Autoadhesivo A4	hojas	hoja	165.48	100	ART JET	https://www.eshop.art-jet.com.ar/productos/adhesivo-brillante-115g/?_gl=1*me2d5q*_gcl_au*MTI2NTAzOTExMi4xNzcxNzgzMzQ1*_ga*MjE4NjYxNjUxLjE3NzA0ODc3ODY.*_ga_2RLYWSG9TR*czE3NzE3ODMzMjYkbzMkZzEkdDE3NzE3ODMzMzEkajU1JGwwJGgw		t	2026-02-22 18:04:49.531	2026-02-21 23:21:23.467325	\N	16548.00	100.000	\N	20	16548.00	2026-04-29 23:32:10.906
2	Chocolatinas Colonial	chocolates	u	240.00	900	La Golosineria	https://www.mercadolibre.com.ar/chocolatinas-con-leche-colonial-x-50un/p/MLA46066379#polycard_client=search-nordic&searchVariation=MLA46066379&wid=MLA1477087621&position=1&search_layout=stack&type=product&tracking_id=e884ba38-1be3-4816-a82b-00c38e0833f1&sid=search		t	2026-05-01 19:39:39.55	2026-02-21 23:21:22.995043	\N	12000.00	50.000	\N	20	\N	\N
19	Hilo Algodón	tejidos	cm	1.03	10000	Almacen de armado	https://articulo.mercadolibre.com.ar/MLA-1163252177-hilo-algodon-36h-colores-macrame-35mm-mejor-calidad-100-mts-_JM#position=5&search_layout=stack&type=item&tracking_id=2e6effcc-26c3-4ac8-aa68-9e45391dfc67		t	2026-02-22 21:38:13.109	2026-02-21 23:21:26.951158	\N	10295.00	10000.000	\N	20	10295.00	2026-02-23 17:19:24.721
11	Ojalillo chico	velas	u	16.40	50	Nuevas Luces	https://nuevasluces.empretienda.com.ar/insumos-para-velas/materiales/ojalillo-chico		t	2026-02-22 18:20:55.577	2026-02-21 23:21:25.094859	\N	820.00	50.000	\N	20	820.00	2026-04-29 23:32:12.495
31	Cartulina Triplex 300gr	hojas	hoja	300.00	0	Perfect Print	https://www.mercadolibre.com.ar/carton-cartulina-triplex-a4-300-grs-100-hojas-cajas-tapas/up/MLAU213151214?has_official_store=false&highlight=false&headerTopBrand=true#polycard_client=search-nordic&search_layout=stack&position=2&type=product&tracking_id=34d7d6ed-ad29-480f-97f7-89c9a0937a9a&wid=MLA1112119192&sid=search		t	2026-02-22 17:52:56.574	2026-02-22 17:51:08.611559	\N	30000.00	100.000	\N	20	30000.00	2026-02-23 17:19:26.703
27	Etiqueta colonial GOLD	etiquetas	u	16.75	100				t	2026-02-23 19:15:48.63	2026-02-22 01:56:31.89075	5	\N	\N	28.000	20	\N	\N
10	Cera BPF	velas	g	7.90	10000	NUEVAS LUCES	https://nuevasluces.empretienda.com.ar/insumos-para-velas/cera/cera-de-soja-astra-bpf		t	2026-04-29 23:34:34.448	2026-02-21 23:21:24.86512	\N	7903.00	1000.000	\N	20	7903.00	2026-04-29 23:32:08.275
30	Autoadhesiva Transparente Laser	hojas	hoja	380.25	20	Grafica limite	https://www.mercadolibre.com.ar/opp-transparente-a4-vinilo-autoadhesivo-x20u-papel-p--laser/up/MLAU195591768?pdp_filters=item_id:MLA811699400		t	2026-02-23 02:30:16.745	2026-02-22 17:49:40.479584	\N	7605.00	20.000	\N	20	7605.00	2026-02-23 17:19:27.927
29	Hoja Telada 250gr	hojas	hoja	439.85	0	Grafica Limite	https://www.mercadolibre.com.ar/papel-texturado-tarjeteria-a4-250grs-opalina-mate-telado-x20/up/MLAU153019153?pdp_filters=item_id:MLA1166759946#position=1&search_layout=stack&type=item&tracking_id=eb1a82ce-c5af-4ab2-b9a5-8fe78ae467d2		t	2026-04-29 23:29:08.408	2026-02-22 17:17:10.476723	\N	8797.00	20.000	\N	20	7141.00	2026-02-23 17:19:29.205
35	ESENCIA	velas	ml	79.20	0	Mil Aromas	https://www.mercadolibre.com.ar/esencia-cocovainilla-velas-soja-parafinas-pura-100-intensa/up/MLAU282641512?pdp_filters=item_id:MLA878958880#position=22&search_layout=stack&type=item&tracking_id=57aaff46-d7e2-4cd9-83dd-bae63016243a		t	2026-03-21 16:58:20.277	2026-02-22 18:14:44.273534	\N	19800.00	250.000	\N	20	19800.00	2026-02-23 17:19:31.464
13	Indubox 250u	cajas	u	433.16	250	Indubox	https://www.indubox.com.ar/estructura/secciones/s_producto.php?mIdProducto=139#top		t	2026-02-22 18:36:55.161	2026-02-21 23:21:25.557529	\N	108289.00	250.000	\N	20	\N	\N
33	Fotografico	hojas	hoja	105.02	0	ART JET	https://www.eshop.art-jet.com.ar/productos/papel-fotografico-brillante-200gr/?variant=372324176&_gl=1*no9l3f*_gcl_au*MTI2NTAzOTExMi4xNzcxNzgzMzQ1*_ga*MjE4NjYxNjUxLjE3NzA0ODc3ODY.*_ga_2RLYWSG9TR*czE3NzE3ODMzMjYkbzMkZzEkdDE3NzE3ODMzMzEkajU1JGwwJGgw		t	2026-02-22 18:05:56.861116	2026-02-22 18:05:56.861116	\N	10502.00	100.000	\N	20	10502.00	2026-04-29 23:32:06.032
5	Glossy Laser	hojas	hoja	177.12	100	Grafica Limite	https://www.mercadolibre.com.ar/papel-autoadhesivo-a4-brillante-laser-ilustracion--adhesivo/up/MLAU139157253?pdp_filters=item_id:MLA1135527814		t	2026-02-23 02:30:43.329	2026-02-21 23:21:23.702052	\N	17712.00	100.000	\N	20	17712.00	2026-02-23 17:19:34.801
14	Caja Tennesse	cajas	u	495.00	10	Doblementa	https://www.doblementa.com.ar/productos/pack-de-cajas-8x8x10-blancas-modelo-a32/		t	2026-02-22 18:36:01.819	2026-02-21 23:21:25.78899	\N	4950.00	10.000	\N	20	4950.00	2026-02-23 17:19:35.146
23	Papel Foil	hojas	hoja	292.00	25		https://articulo.mercadolibre.com.ar/MLA-1880603398-papel-foil-metalizado-textil-para-telas-y-toner-32x6-film-_JM?attributes=COLOR_SECONDARY_COLOR%3ARG9yYWRvIGJyaWxsYW50ZQ%3D%3D&picker=true&searchVariation=184217996625&quantity=1		t	2026-02-22 17:45:49.485	2026-02-22 00:08:26.96782	\N	7300.00	25.000	\N	20	7300.00	2026-02-23 17:19:37.145
12	Caja D6	cajas	u	722.75	30	Indubox	https://www.indubox.com.ar/estructura/secciones/s_producto.php?mIdProducto=138		t	2026-04-29 20:06:31.845	2026-02-21 23:21:25.324762	\N	72275.00	100.000	\N	20	24700.00	2026-02-23 17:19:32.292
26	Foil - Tapa D6	etiquetas	m	97.33	0				t	2026-02-23 19:16:00.245	2026-02-22 01:41:50.563562	23	\N	\N	3.000	20	\N	\N
15	Telgopor	extras	u	24.36	156				t	2026-02-23 17:33:41.975	2026-02-21 23:21:26.016206	\N	3800.00	156.000	\N	20	\N	\N
38	Cajita D4	cajas	u	324.00	0	anviPACk			t	2026-02-22 18:30:51.903558	2026-02-22 18:30:51.903558	\N	324.00	1.000	\N	20	\N	\N
44	Caja 44 chocos	cajas	u	1300.00	0	anviPACk			t	2026-02-22 18:53:18.360533	2026-02-22 18:53:18.360533	\N	1300.00	1.000	\N	20	\N	\N
60	Dijes Fundición	extras	u	100.20	10	Almacen de Armado	https://almacendearmado.com.ar/productos/dije-de-fundicion-letra-a/		t	2026-04-28 21:31:18.166174	2026-04-28 21:31:18.166174	\N	100.00	0.998	\N	50	4600.00	2026-04-29 23:32:15.79
68	Telado Mini Recuerdo	etiquetas	u	48.88	0				t	2026-04-30 00:05:25.192081	2026-04-30 00:05:25.192081	29	\N	\N	8.998	50	\N	\N
39	Cajita D2 Georgalos	cajas	u	410.00	0	doblementa	https://www.doblementa.com.ar/productos/pack-de-cajas-deslizantes-7x7x1-blancas-modelo-d10/		t	2026-02-22 18:32:09.190659	2026-02-22 18:32:09.190659	\N	4100.00	10.000	\N	20	4100.00	2026-02-23 17:19:45.818
40	Cajita vela 100cc	cajas	u	370.00	0	Doblementa	https://www.doblementa.com.ar/productos/pack-de-cajas-6x6x85-blancas-modelo-a30/		t	2026-02-22 18:34:43.328829	2026-02-22 18:34:43.328829	\N	3700.00	10.000	\N	20	3700.00	2026-02-23 17:19:46.095
52	Cinta Raso N°5 2,5cm	tejidos	cm	3.19	1000	Candy Craft	https://www.candycraft.com.ar/productos/cinta-raso-n5-25-mm-x-10-metros/		t	2026-04-29 23:33:32.637	2026-02-22 21:50:33.373974	\N	3186.00	1000.000	\N	3	3186.00	2026-04-29 23:32:17.239
69	Cordon Lurex	extras	cm	0.87	0		https://articulo.mercadolibre.com.ar/MLA-866855433-hilo-dorado-o-plateado-lurex-cola-de-raton-souvenir-x100-mts-_JM#position=2&search_layout=stack&type=item&tracking_id=90089f9a-447a-4c07-98a1-5fd3daa5a846		t	2026-04-30 00:12:52.667072	2026-04-30 00:12:52.667072	\N	8700.00	9999.999	\N	20	\N	\N
9	Frasco Anchoero 100cc	velas	u	927.14	35	moma	https://articulo.mercadolibre.com.ar/MLA-874369388-frasco-anchoero-vidrio-100-cc-con-tapa-48-axial-x35-unidades-_JM?searchVariation=69520677813#polycard_client=search-desktop&searchVariation=69520677813&search_layout=grid&position=29&type=item&tracking_id=921d1163-ad51-4b74-ac95-235eb06ffd07		t	2026-02-22 18:23:45.93	2026-02-21 23:21:24.633013	\N	32450.00	35.000	\N	20	32449.90	2026-02-23 17:19:49.118
55	Base opalina D6 (GOLD)	hojas	u	129.86	0	ey! papel	https://www.mercadolibre.com.ar/opalina-cartulina-a4-125-hojas-210-grs-chambril-blanco-liso/up/MLAU328299279?pdp_filters=item_id:MLA1412621905#polycard_client=search-nordic&searchVariation=179959910796&search_layout=grid&position=3&type=item&tracking_id=c1ed86a5-27a8-4124-824a-85c7eebecc42		t	2026-02-23 17:36:31.651561	2026-02-23 17:36:31.651561	47	\N	\N	8.000	20	\N	\N
56	Papel Ilustración 300gr	hojas	hoja	136.51	0				t	2026-02-23 17:42:31.667818	2026-02-23 17:42:31.667818	\N	13651.00	100.000	\N	20	\N	\N
32	Cartulina Triplex 240gr	hojas	hoja	203.00	0	Perfect Print	https://www.mercadolibre.com.ar/carton-cartulina-triplex-a4-240-grs-100-hojas-cajas-tapas/up/MLAU210834033?pdp_filters=seller_id%3A77604177#polycard_client=recommendations_vip-seller_items-above&reco_backend=ranker-retsys-same-seller&reco_model=rk_entity_sameseller&reco_client=vip-seller_items-above&reco_item_pos=1&reco_backend_type=low_level&reco_id=16c6194c-0af2-411a-812b-146bb5cfcfa3&wid=MLA1115017012&sid=recos		t	2026-02-22 17:52:46.533581	2026-02-22 17:52:46.533581	\N	20300.00	100.000	\N	20	20300.00	2026-02-23 17:19:38.29
53	Etiqueta colonial "fotografico"	etiquetas	u	5.91	0				t	2026-02-23 19:15:33.91	2026-02-23 17:27:41.628427	4	\N	\N	28.000	20	\N	\N
49	12 Corazoncitos	chocolates	u	433.25	0		https://www.mercadolibre.com.ar/confites-chocolate-palmesano-corazonito-500gr/p/MLA53099136		t	2026-04-28 22:01:27.946	2026-02-22 21:43:06.710131	\N	8665.00	20.000	\N	20	8665.00	2026-02-23 17:19:40.616
51	Cinta Raso N°2 1cm	tejidos	cm	2.01	1000	Candy Craft	https://www.candycraft.com.ar/productos/cinta-raso-n2-1-cm-x-10-metros/		t	2026-02-22 21:48:48.932	2026-02-22 21:47:52.604038	\N	2006.00	1000.000	\N	20	2006.00	2026-04-29 23:32:19.385
47	Opalina 210gr	hojas	hoja	65.36	10	ey! papel	https://www.mercadolibre.com.ar/opalina-cartulina-a4-125-hojas-210-grs-chambril-blanco-liso/up/MLAU328299279?pdp_filters=item_id:MLA1412621905#polycard_client=search-nordic&searchVariation=179959910796&search_layout=grid&position=3&type=item&tracking_id=c1ed86a5-27a8-4124-824a-85c7eebecc42		t	2026-02-22 20:37:37.463	2026-02-22 19:42:25.897421	\N	8170.00	125.000	\N	15	8170.00	2026-02-23 17:19:43.209
54	Etiqueta tapa caja D6	etiquetas	u	30.09	0				t	2026-02-23 19:15:43.286	2026-02-23 17:32:14.525344	4	\N	\N	5.500	20	\N	\N
37	Tennesse	velas	u	1216.00	1	Nuevas Luces	https://nuevasluces.empretienda.com.ar/envases-de-vidrio/tennesse/tennesse-cristal		t	2026-02-22 18:27:31.176528	2026-02-22 18:27:31.176528	\N	1216.00	1.000	\N	20	1225.00	2026-04-29 23:32:22.143
61	10*10*5 caja 25/20 col.	packaging	u	611.22	0	Anvipack			t	2026-04-28 22:05:55.793725	2026-04-28 22:05:55.793725	\N	610.00	0.998	\N	5	\N	\N
48	Base opalina D6	hojas	hoja	32.53	0	ey! papel	https://www.mercadolibre.com.ar/opalina-cartulina-a4-125-hojas-210-grs-chambril-blanco-liso/up/MLAU328299279?pdp_filters=item_id:MLA1412621905#polycard_client=search-nordic&searchVariation=179959910796&search_layout=grid&position=3&type=item&tracking_id=c1ed86a5-27a8-4124-824a-85c7eebecc42		t	2026-02-23 17:34:43.392	2026-02-22 19:44:20.811823	47	\N	\N	8.000	20	8170.00	2026-02-23 17:19:39.48
63	Etiqueta Georgalos	etiquetas	u	16.55	0				t	2026-04-29 19:44:52.14789	2026-04-29 19:44:52.14789	4	\N	\N	10.000	20	\N	\N
58	Tarjeta señalador	hojas	u	80.16	0				t	2026-02-23 19:23:29.375	2026-02-23 19:22:27.343002	31	\N	\N	12.000	20	\N	\N
59	Etiqueta colonial (Ilustración)	etiquetas	u	4.88	0				t	2026-02-23 21:19:03.217369	2026-02-23 21:19:03.217369	56	\N	\N	28.000	20	\N	\N
64	Tapa caja D2	etiquetas	u	27.58	0				t	2026-04-29 19:46:07.535368	2026-04-29 19:46:07.535368	4	\N	\N	6.000	20	\N	\N
65	Cada D128 NEGRA (D6)	cajas	u	930.05	0	Indubox	https://www.indubox.com.ar/estructura/secciones/s_producto.php?mIdProducto=138#top		t	2026-04-29 20:04:03.227521	2026-04-29 20:04:03.227521	\N	93004.00	99.999	\N	50	\N	\N
50	Cinta Raso N°1 6mm	tejidos	cm	1.09	1000	Candy Craft	https://www.candycraft.com.ar/productos/cinta-raso-n1-6-mm-x-50-metros/		t	2026-04-29 23:33:55.958	2026-02-22 21:44:46.453128	\N	5428.00	5000.000	\N	20	5428.00	2026-04-29 23:32:23.279
42	Winky	hojas	hoja	1198.70	0	ART JET	https://www.eshop.art-jet.com.ar/productos/winky-paper-blanco/?_gl=1*1bpad43*_gcl_au*MTI2NTAzOTExMi4xNzcxNzgzMzQ1*_ga*MjE4NjYxNjUxLjE3NzA0ODc3ODY.*_ga_2RLYWSG9TR*czE3NzE3ODU0ODMkbzQkZzEkdDE3NzE3ODU3MjIkajMyJGwwJGgw		t	2026-02-22 18:44:38.366119	2026-02-22 18:44:38.366119	\N	11987.00	10.000	\N	20	11987.00	2026-04-29 23:32:15.739
66	Florcitas Secas Tejidos	extras	u	150.15	0				t	2026-04-29 23:46:30.994562	2026-04-29 23:46:30.994562	\N	150.00	0.999	\N	20	\N	\N
67	Mosqueton 2cm	extras	u	459.82	0	Kaizen	https://www.mercadolibre.com.ar/llavero-tipo-gancho-x-100-unidades-medialuna-20mm-bijou/up/MLAU209312850?pdp_filters=item_id%3AMLA1600961588#polycard_client=bookmarks&wid=MLA1600961588&sid=bookmarks		t	2026-04-29 23:49:31.464417	2026-04-29 23:49:31.464417	\N	45982.00	100.000	\N	20	\N	\N
41	Canvas Corteza Pino	hojas	hoja	186.26	0	ART JET	https://www.eshop.art-jet.com.ar/productos/canvas-brillante-corteza-de-pino-230g/		t	2026-02-22 18:43:05.555495	2026-02-22 18:43:05.555495	\N	9313.00	50.000	\N	20	9313.00	2026-04-29 23:32:23.348
\.


--
-- Data for Name: supply_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.supply_categories (id, name, slug, icon, "order", is_active, created_at, updated_at) FROM stdin;
1	Chocolates	chocolates	🍫	1	t	2026-02-22 22:01:16.13313	2026-02-22 22:01:16.13313
2	Hojas / Papeles	hojas	📄	2	t	2026-02-22 22:01:16.599215	2026-02-22 22:01:16.599215
3	Velas	velas	🕯️	3	t	2026-02-22 22:01:17.072976	2026-02-22 22:01:17.072976
4	Cajas	cajas	📦	4	t	2026-02-22 22:01:17.539378	2026-02-22 22:01:17.539378
5	Extras	extras	✨	5	t	2026-02-22 22:01:18.015565	2026-02-22 22:01:18.015565
7	Packaging	packaging	📦	0	t	2026-02-22 22:08:33.963944	2026-02-22 22:10:04.681
6	Tejidos	tejidos	🧵	6	t	2026-02-22 22:01:18.482795	2026-02-22 22:47:20.388
8	Etiquetas	etiquetas	🏷️	0	t	2026-02-23 19:14:52.757142	2026-02-23 19:14:52.757142
\.


--
-- Data for Name: supply_composition; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.supply_composition (id, supply_id, parent_id, yield_ratio, created_at, updated_at) FROM stdin;
24	48	47	8.000	2026-02-23 17:34:43.399646	2026-02-23 17:34:43.399646
25	48	15	1.000	2026-02-23 17:34:43.399646	2026-02-23 17:34:43.399646
26	55	47	8.000	2026-02-23 17:36:31.655699	2026-02-23 17:36:31.655699
27	55	15	1.000	2026-02-23 17:36:31.655699	2026-02-23 17:36:31.655699
28	55	23	3.000	2026-02-23 17:36:31.655699	2026-02-23 17:36:31.655699
30	53	4	28.000	2026-02-23 19:15:33.917183	2026-02-23 19:15:33.917183
31	54	4	5.500	2026-02-23 19:15:43.295389	2026-02-23 19:15:43.295389
32	27	5	28.000	2026-02-23 19:15:48.63569	2026-02-23 19:15:48.63569
33	26	23	3.000	2026-02-23 19:16:00.259069	2026-02-23 19:16:00.259069
37	58	31	12.000	2026-02-23 19:23:29.38247	2026-02-23 19:23:29.38247
38	58	4	3.000	2026-02-23 19:23:29.38247	2026-02-23 19:23:29.38247
39	59	56	28.000	2026-02-23 21:19:03.453338	2026-02-23 21:19:03.453338
40	63	4	10.000	2026-04-29 19:44:52.153772	2026-04-29 19:44:52.153772
41	64	4	6.000	2026-04-29 19:46:07.537913	2026-04-29 19:46:07.537913
42	68	29	8.998	2026-04-30 00:05:25.195261	2026-04-30 00:05:25.195261
\.


--
-- Data for Name: unmatched_transfers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.unmatched_transfers (id, amount, sender_dni, mp_payment_id, payment_date, raw_metadata, status, created_at, updated_at) FROM stdin;
7	8500.00	38425243	146292544735	2026-02-20 03:59:08	{"accounts_info":null,"acquirer_reconciliation":[],"additional_info":{"tracking_id":"platform:v1-blacklabel,so:ALL,type:N/A,security:none"},"authorization_code":null,"binary_mode":false,"brand_id":null,"build_version":"3.143.0-rc-4","call_for_authorize_id":null,"callback_url":null,"captured":true,"card":{},"charges_details":[],"charges_execution_info":{"internal_execution":{"date":"2026-02-19T23:59:08.138-04:00","execution_id":"01KHWK73TEQ7SW07G6W9ZP660T"}},"collector_id":66812347,"corporation_id":null,"counter_currency":null,"coupon_amount":0,"currency_id":"ARS","date_approved":"2026-02-19T23:59:08.000-04:00","date_created":"2026-02-19T23:59:08.000-04:00","date_last_updated":"2026-02-19T23:59:12.000-04:00","date_of_expiration":null,"deduction_schema":null,"description":"Pago Debin","differential_pricing_id":null,"external_reference":null,"fee_details":[],"financing_group":null,"id":146292544735,"installments":1,"integrator_id":null,"issuer_id":"12520","live_mode":true,"marketplace_owner":null,"merchant_account_id":null,"merchant_number":null,"metadata":{},"money_release_date":"2026-02-19T23:59:08.000-04:00","money_release_schema":null,"money_release_status":"released","notification_url":null,"operation_type":"account_fund","order":{},"payer":{"email":"nico.leo.busto@gmail.com","entity_type":null,"first_name":null,"id":"66812347","identification":{"number":"20384252436","type":"CUIT"},"last_name":null,"operator_id":null,"phone":{"number":null,"extension":null,"area_code":null},"type":null},"payment_method":{"id":"debin_transfer","issuer_id":"12520","type":"bank_transfer"},"payment_method_id":"debin_transfer","payment_type_id":"bank_transfer","platform_id":null,"point_of_interaction":{"business_info":{"branch":"Debin","sub_unit":"money_inflows","unit":"digital_accounts_cards"},"location":{"source":"collector","state_id":"AR-B"},"transaction_data":{},"type":"UNSPECIFIED"},"pos_id":null,"processing_mode":"aggregator","refunds":[],"release_info":null,"shipping_amount":0,"sponsor_id":null,"statement_descriptor":null,"status":"approved","status_detail":"accredited","store_id":null,"tags":null,"taxes_amount":0,"transaction_amount":8500,"transaction_amount_refunded":0,"transaction_details":{"acquirer_reference":null,"bank_transfer_id":122237223415,"external_resource_url":null,"financial_institution":"1","installment_amount":0,"net_received_amount":8500,"overpaid_amount":0,"payable_deferral_period":null,"payment_method_reference_id":null,"total_paid_amount":8500,"transaction_id":"66812347-273618c5-e53f-44bc-9993-1252934cb7a5"},"shipping_cost":0}	pending_review	2026-02-21 05:47:46.209805	2026-02-21 05:47:46.209805
8	100000.00	38425243	144771922054	2026-02-04 13:58:25	{"accounts_info":null,"acquirer_reconciliation":[],"additional_info":{"tracking_id":"platform:v1-blacklabel,so:ALL,type:N/A,security:none"},"authorization_code":null,"binary_mode":false,"brand_id":null,"build_version":"3.141.0-rc-1","call_for_authorize_id":null,"callback_url":null,"captured":true,"card":{},"charges_details":[],"charges_execution_info":{"internal_execution":{"date":"2026-02-04T09:58:25.748-04:00","execution_id":"01KGMF4YNH4VEJPZT9CM5EK1KK"}},"collector_id":66812347,"corporation_id":null,"counter_currency":null,"coupon_amount":0,"currency_id":"ARS","date_approved":"2026-02-04T09:58:26.000-04:00","date_created":"2026-02-04T09:58:25.000-04:00","date_last_updated":"2026-02-04T09:58:32.000-04:00","date_of_expiration":null,"deduction_schema":null,"description":"Bank Transfer","differential_pricing_id":null,"external_reference":null,"fee_details":[],"financing_group":null,"id":144771922054,"installments":1,"integrator_id":null,"issuer_id":"12397","live_mode":true,"marketplace_owner":null,"merchant_account_id":null,"merchant_number":null,"metadata":{},"money_release_date":"2026-02-04T09:58:26.000-04:00","money_release_schema":null,"money_release_status":"released","notification_url":null,"operation_type":"account_fund","order":{},"payer":{"email":"nico.leo.busto@gmail.com","entity_type":null,"first_name":null,"id":"66812347","identification":{"number":"20384252436","type":"CUIT"},"last_name":null,"operator_id":null,"phone":{"number":null,"extension":null,"area_code":null},"type":null},"payment_method":{"id":"cvu","issuer_id":"12397","type":"bank_transfer"},"payment_method_id":"cvu","payment_type_id":"bank_transfer","platform_id":null,"point_of_interaction":{"application_data":{"name":null,"operating_system":null,"version":null},"business_info":{"branch":null,"sub_unit":"money_inflows","unit":"digital_accounts_cards"},"location":{"source":"collector","state_id":"AR-B"},"sub_type":"INTER_PSP","transaction_data":{"bank_info":{"collector":{"account_alias":null,"account_holder_name":null,"account_id":null,"long_name":null,"transfer_account_id":null},"is_same_bank_account_owner":null,"origin_bank_id":null,"origin_wallet_id":null,"payer":{"account_id":null,"branch":null,"external_account_id":null,"id":null,"identification":{},"long_name":null}},"bank_transfer_id":121816560097,"e2e_id":"0V1JXON1LX7ZMKLGNZ64EL","financial_institution":1,"is_end_consumer":null,"merchant_category_code":null,"qr_code":null,"ticket_url":null,"transaction_id":"0V1JXON1LX7ZMKLGNZ64EL"},"type":"PSP_TRANSFER"},"pos_id":null,"processing_mode":"aggregator","refunds":[],"release_info":null,"shipping_amount":0,"sponsor_id":null,"statement_descriptor":null,"status":"approved","status_detail":"accredited","store_id":null,"tags":null,"taxes_amount":0,"transaction_amount":100000,"transaction_amount_refunded":0,"transaction_details":{"acquirer_reference":null,"bank_transfer_id":121816560097,"external_resource_url":null,"financial_institution":"1","installment_amount":0,"net_received_amount":100000,"overpaid_amount":0,"payable_deferral_period":null,"payment_method_reference_id":null,"total_paid_amount":100000,"transaction_id":"0V1JXON1LX7ZMKLGNZ64EL"},"shipping_cost":0}	pending_review	2026-02-21 05:47:46.229873	2026-02-21 05:47:46.229873
9	23500.00	38425243	144048266605	2026-02-04 04:14:51	{"accounts_info":null,"acquirer_reconciliation":[],"additional_info":{"tracking_id":"platform:v1-blacklabel,so:ALL,type:N/A,security:none"},"authorization_code":null,"binary_mode":false,"brand_id":null,"build_version":"3.141.0-rc-1","call_for_authorize_id":null,"callback_url":null,"captured":true,"card":{},"charges_details":[],"charges_execution_info":{"internal_execution":{"date":"2026-02-04T00:14:51.455-04:00","execution_id":"01KGKDRD0Z3P649BP2ZF1HBNYV"}},"collector_id":66812347,"corporation_id":null,"counter_currency":null,"coupon_amount":0,"currency_id":"ARS","date_approved":"2026-02-04T00:14:51.000-04:00","date_created":"2026-02-04T00:14:51.000-04:00","date_last_updated":"2026-02-04T00:14:58.000-04:00","date_of_expiration":null,"deduction_schema":null,"description":"Pago Debin","differential_pricing_id":null,"external_reference":null,"fee_details":[],"financing_group":null,"id":144048266605,"installments":1,"integrator_id":null,"issuer_id":"12520","live_mode":true,"marketplace_owner":null,"merchant_account_id":null,"merchant_number":null,"metadata":{},"money_release_date":"2026-02-04T00:14:51.000-04:00","money_release_schema":null,"money_release_status":"released","notification_url":null,"operation_type":"account_fund","order":{},"payer":{"email":"nico.leo.busto@gmail.com","entity_type":null,"first_name":null,"id":"66812347","identification":{"number":"20384252436","type":"CUIT"},"last_name":null,"operator_id":null,"phone":{"number":null,"extension":null,"area_code":null},"type":null},"payment_method":{"id":"debin_transfer","issuer_id":"12520","type":"bank_transfer"},"payment_method_id":"debin_transfer","payment_type_id":"bank_transfer","platform_id":null,"point_of_interaction":{"business_info":{"branch":"Debin","sub_unit":"money_inflows","unit":"digital_accounts_cards"},"location":{"source":"collector","state_id":"AR-B"},"transaction_data":{},"type":"UNSPECIFIED"},"pos_id":null,"processing_mode":"aggregator","refunds":[],"release_info":null,"shipping_amount":0,"sponsor_id":null,"statement_descriptor":null,"status":"approved","status_detail":"accredited","store_id":null,"tags":null,"taxes_amount":0,"transaction_amount":23500,"transaction_amount_refunded":0,"transaction_details":{"acquirer_reference":null,"bank_transfer_id":121867939152,"external_resource_url":null,"financial_institution":"1","installment_amount":0,"net_received_amount":23500,"overpaid_amount":0,"payable_deferral_period":null,"payment_method_reference_id":null,"total_paid_amount":23500,"transaction_id":"66812347-bb60b0c8-2328-443d-a530-5fe27ac00d8e"},"shipping_cost":0}	pending_review	2026-02-21 05:47:46.248176	2026-02-21 05:47:46.248176
10	10734.28	39549906	146636424028	2026-02-17 15:50:09	{"accounts_info":null,"acquirer_reconciliation":[],"additional_info":{"tracking_id":"platform:v1-blacklabel,so:ALL,type:N/A,security:none"},"authorization_code":null,"binary_mode":false,"brand_id":null,"build_version":"3.143.0-rc-4","call_for_authorize_id":null,"callback_url":null,"captured":true,"card":{},"charges_details":[],"charges_execution_info":{"internal_execution":{"date":"2026-02-17T11:50:09.449-04:00","execution_id":"01KHP4PW89Z9A5SPMY6XAM0K9Z"}},"collector_id":201933453,"corporation_id":null,"counter_currency":null,"coupon_amount":0,"currency_id":"ARS","date_approved":"2026-02-17T11:50:09.000-04:00","date_created":"2026-02-17T11:50:09.000-04:00","date_last_updated":"2026-02-17T11:50:17.000-04:00","date_of_expiration":null,"deduction_schema":null,"description":"Bank Transfer","differential_pricing_id":null,"external_reference":null,"fee_details":[],"financing_group":null,"id":146636424028,"installments":1,"integrator_id":null,"issuer_id":"12397","live_mode":true,"marketplace_owner":null,"merchant_account_id":null,"merchant_number":null,"metadata":{},"money_release_date":"2026-02-17T11:50:09.000-04:00","money_release_schema":null,"money_release_status":"released","notification_url":null,"operation_type":"account_fund","order":{},"payer":{"email":"magabenua@hotmail.com","entity_type":null,"first_name":null,"id":"201933453","identification":{"number":"27395499063","type":"CUIT"},"last_name":null,"operator_id":null,"phone":{"number":null,"extension":null,"area_code":null},"type":null},"payment_method":{"id":"cvu","issuer_id":"12397","type":"bank_transfer"},"payment_method_id":"cvu","payment_type_id":"bank_transfer","platform_id":null,"point_of_interaction":{"application_data":{"name":null,"operating_system":null,"version":null},"business_info":{"branch":null,"sub_unit":"money_inflows","unit":"digital_accounts_cards"},"location":{"source":"collector","state_id":"AR-B"},"sub_type":"INTER_PSP","transaction_data":{"bank_info":{"collector":{"account_alias":null,"account_holder_name":null,"account_id":null,"long_name":null,"transfer_account_id":null},"is_same_bank_account_owner":null,"origin_bank_id":null,"origin_wallet_id":null,"payer":{"account_id":null,"branch":null,"external_account_id":null,"id":null,"identification":{},"long_name":null}},"bank_transfer_id":122174500259,"e2e_id":"XJ8G7V95DM3L3VDL9EMPYR","financial_institution":1,"is_end_consumer":null,"merchant_category_code":null,"qr_code":null,"ticket_url":null,"transaction_id":"XJ8G7V95DM3L3VDL9EMPYR"},"type":"PSP_TRANSFER"},"pos_id":null,"processing_mode":"aggregator","refunds":[],"release_info":null,"shipping_amount":0,"sponsor_id":null,"statement_descriptor":null,"status":"approved","status_detail":"accredited","store_id":null,"tags":null,"taxes_amount":0,"transaction_amount":10734.28,"transaction_amount_refunded":0,"transaction_details":{"acquirer_reference":null,"bank_transfer_id":122174500259,"external_resource_url":null,"financial_institution":"1","installment_amount":0,"net_received_amount":10734.28,"overpaid_amount":0,"payable_deferral_period":null,"payment_method_reference_id":null,"total_paid_amount":10734.28,"transaction_id":"XJ8G7V95DM3L3VDL9EMPYR"},"shipping_cost":0}	pending_review	2026-02-21 17:00:37.831108	2026-02-21 17:00:37.831108
11	5000.00	38425243	141208972725	2026-01-13 16:43:28	{"accounts_info":null,"acquirer_reconciliation":[],"additional_info":{"bank_info":{"is_same_bank_account_owner":false},"ip_address":"190.210.38.85","tracking_id":"platform:v1-blacklabel,so:ALL,type:N/A,security:none"},"authorization_code":null,"binary_mode":false,"brand_id":null,"build_version":"3.138.0-rc-9","call_for_authorize_id":null,"callback_url":null,"captured":true,"card":{},"charges_details":[{"accounts":{"from":"collector","to":"mp"},"amounts":{"original":3,"refunded":0},"base_amount":5000,"client_id":0,"date_created":"2026-01-13T12:43:29.000-04:00","id":"141208972725-001","last_updated":"2026-01-13T12:43:29.000-04:00","metadata":{"mov_detail":"tax_withholding_collector","mov_financial_entity":"iibb_transfer_tucuman","mov_type":"expense","source":"taxes","source_detail":"","tax_id":111082363527,"tax_status":"applied","user_id":201933453},"name":"tax_withholding_collector-iibb_transfer_tucuman","rate":0.06,"refund_charges":[],"reserve_id":null,"type":"tax","update_charges":[]}],"charges_execution_info":{"internal_execution":{"date":"2026-01-13T12:43:28.917-04:00","execution_id":"01KEW3VBQBNTEYJG6JT9W8GWYC"}},"collector_id":201933453,"corporation_id":null,"counter_currency":null,"coupon_amount":0,"currency_id":"ARS","date_approved":"2026-01-13T12:43:31.000-04:00","date_created":"2026-01-13T12:43:28.000-04:00","date_last_updated":"2026-01-13T12:43:37.000-04:00","date_of_expiration":null,"deduction_schema":null,"description":"Varios","differential_pricing_id":null,"external_reference":null,"fee_details":[],"financing_group":null,"id":141208972725,"installments":1,"integrator_id":null,"issuer_id":"12520","live_mode":true,"marketplace_owner":null,"merchant_account_id":null,"merchant_number":null,"metadata":{},"money_release_date":"2026-01-13T12:43:31.000-04:00","money_release_schema":null,"money_release_status":"released","notification_url":null,"operation_type":"money_transfer","order":{},"payer":{"email":"nico.leo.busto@gmail.com","entity_type":null,"first_name":null,"id":"66812347","identification":{"number":"20384252436","type":"CUIT"},"last_name":null,"operator_id":null,"phone":{"number":null,"extension":null,"area_code":null},"type":null},"payment_method":{"id":"debin_transfer","issuer_id":"12520","type":"bank_transfer"},"payment_method_id":"debin_transfer","payment_type_id":"bank_transfer","platform_id":null,"point_of_interaction":{"application_data":{"name":null,"operating_system":null,"version":null},"business_info":{"branch":"Intra MP","sub_unit":"money_outflows","unit":"digital_accounts_cards"},"location":{"source":"Collector","state_id":"AR-B"},"sub_type":"INTER_PSP","transaction_data":{"bank_info":{"collector":{"account_alias":null,"account_holder_name":null,"account_id":null,"long_name":"MERCADOLIBRE SRL/MERCADO PAGO","transfer_account_id":null},"is_same_bank_account_owner":false,"origin_bank_id":null,"origin_wallet_id":null,"payer":{"account_id":null,"branch":null,"external_account_id":"aa4c1032-1bfc-34ff-80bc-3e6723c48319","id":66812347,"identification":{},"long_name":"BUSTO NICOLAS LEONARDO"}},"bank_transfer_id":121279453501,"e2e_id":null,"financial_institution":1,"infringement_notification":{"status":null,"type":null},"is_end_consumer":null,"merchant_category_code":null,"qr_code":null,"ticket_url":null,"transaction_id":"ACFPAYP2_141208972725"},"type":"PSP_TRANSFER"},"pos_id":null,"processing_mode":"aggregator","refunds":[],"release_info":null,"shipping_amount":0,"sponsor_id":null,"statement_descriptor":null,"status":"approved","status_detail":"accredited","store_id":null,"tags":null,"taxes_amount":0,"transaction_amount":5000,"transaction_amount_refunded":0,"transaction_details":{"acquirer_reference":null,"bank_transfer_id":121279453501,"external_resource_url":null,"financial_institution":"1","installment_amount":0,"net_received_amount":4997,"overpaid_amount":0,"payable_deferral_period":null,"payment_method_reference_id":null,"total_paid_amount":5000,"transaction_id":"ACFPAYP2_141208972725"},"shipping_cost":0}	pending_review	2026-02-21 17:00:37.844331	2026-02-21 17:00:37.844331
12	22900.00	39549906	141004577284	2026-01-07 12:25:49	{"accounts_info":null,"acquirer_reconciliation":[],"additional_info":{"tracking_id":"platform:v1-blacklabel,so:ALL,type:N/A,security:none"},"authorization_code":null,"binary_mode":false,"brand_id":null,"build_version":"3.137.0-rc-1","call_for_authorize_id":null,"callback_url":null,"captured":true,"card":{},"charges_details":[{"accounts":{"from":"collector","to":"mp"},"amounts":{"original":13.74,"refunded":0},"base_amount":22900,"client_id":0,"date_created":"2026-01-07T08:25:49.000-04:00","id":"141004577284-001","last_updated":"2026-01-07T08:25:49.000-04:00","metadata":{"mov_detail":"tax_withholding_collector","mov_financial_entity":"iibb_transfer_tucuman","mov_type":"expense","source":"taxes","source_detail":"","tax_id":111018600640,"tax_status":"applied","user_id":0},"name":"tax_withholding_collector-iibb_transfer_tucuman","rate":0.06,"refund_charges":[],"reserve_id":null,"type":"tax","update_charges":[]}],"charges_execution_info":{"internal_execution":{"date":"2026-01-07T08:25:49.423-04:00","execution_id":"01KEC6Q8JBWACFMC31WZQ8VZ7P"}},"collector_id":201933453,"corporation_id":null,"counter_currency":null,"coupon_amount":0,"currency_id":"ARS","date_approved":"2026-01-07T08:25:49.000-04:00","date_created":"2026-01-07T08:25:49.000-04:00","date_last_updated":"2026-01-07T08:26:04.000-04:00","date_of_expiration":null,"deduction_schema":null,"description":"Bank Transfer","differential_pricing_id":null,"external_reference":null,"fee_details":[],"financing_group":null,"id":141004577284,"installments":1,"integrator_id":null,"issuer_id":"12397","live_mode":true,"marketplace_owner":null,"merchant_account_id":null,"merchant_number":null,"metadata":{},"money_release_date":"2026-01-07T08:25:49.000-04:00","money_release_schema":null,"money_release_status":"released","notification_url":null,"operation_type":"account_fund","order":{},"payer":{"email":"magabenua@hotmail.com","entity_type":null,"first_name":null,"id":"201933453","identification":{"number":"27395499063","type":"CUIT"},"last_name":null,"operator_id":null,"phone":{"number":null,"extension":null,"area_code":null},"type":null},"payment_method":{"id":"cvu","issuer_id":"12397","type":"bank_transfer"},"payment_method_id":"cvu","payment_type_id":"bank_transfer","platform_id":null,"point_of_interaction":{"application_data":{"name":null,"operating_system":null,"version":null},"business_info":{"branch":null,"sub_unit":"money_inflows","unit":"digital_accounts_cards"},"location":{"source":"collector","state_id":"AR-B"},"sub_type":"INTER_PSP","transaction_data":{"bank_info":{"collector":{"account_alias":null,"account_holder_name":null,"account_id":null,"long_name":null,"transfer_account_id":null},"is_same_bank_account_owner":null,"origin_bank_id":null,"origin_wallet_id":null,"payer":{"account_id":null,"branch":null,"external_account_id":null,"id":null,"identification":{},"long_name":null}},"bank_transfer_id":121160995096,"e2e_id":"WGRXJE27DVW7D4QON7MYQL","financial_institution":1,"infringement_notification":{"status":null,"type":null},"is_end_consumer":null,"merchant_category_code":null,"qr_code":null,"ticket_url":null,"transaction_id":"WGRXJE27DVW7D4QON7MYQL"},"type":"PSP_TRANSFER"},"pos_id":null,"processing_mode":"aggregator","refunds":[],"release_info":null,"shipping_amount":0,"sponsor_id":null,"statement_descriptor":null,"status":"approved","status_detail":"accredited","store_id":null,"tags":null,"taxes_amount":0,"transaction_amount":22900,"transaction_amount_refunded":0,"transaction_details":{"acquirer_reference":null,"bank_transfer_id":121160995096,"external_resource_url":null,"financial_institution":"1","installment_amount":0,"net_received_amount":22886.26,"overpaid_amount":0,"payable_deferral_period":null,"payment_method_reference_id":null,"total_paid_amount":22900,"transaction_id":"WGRXJE27DVW7D4QON7MYQL"},"shipping_cost":0}	pending_review	2026-02-21 17:00:37.85346	2026-02-21 17:00:37.85346
13	2490.88	39549906	140351683269	2026-01-07 12:22:14	{"accounts_info":null,"acquirer_reconciliation":[],"additional_info":{"tracking_id":"platform:v1-blacklabel,so:ALL,type:N/A,security:none"},"authorization_code":null,"binary_mode":false,"brand_id":null,"build_version":"3.137.0-rc-1","call_for_authorize_id":null,"callback_url":null,"captured":true,"card":{},"charges_details":[],"charges_execution_info":{"internal_execution":{"date":"2026-01-07T08:22:14.939-04:00","execution_id":"01KEC6GQ3S2P9ZNYYFB2AX540F"}},"collector_id":201933453,"corporation_id":null,"counter_currency":null,"coupon_amount":0,"currency_id":"ARS","date_approved":"2026-01-07T08:22:15.000-04:00","date_created":"2026-01-07T08:22:14.000-04:00","date_last_updated":"2026-01-07T08:22:19.000-04:00","date_of_expiration":null,"deduction_schema":null,"description":"Bank Transfer","differential_pricing_id":null,"external_reference":null,"fee_details":[],"financing_group":null,"id":140351683269,"installments":1,"integrator_id":null,"issuer_id":"12397","live_mode":true,"marketplace_owner":null,"merchant_account_id":null,"merchant_number":null,"metadata":{},"money_release_date":"2026-01-07T08:22:15.000-04:00","money_release_schema":null,"money_release_status":"released","notification_url":null,"operation_type":"account_fund","order":{},"payer":{"email":"magabenua@hotmail.com","entity_type":null,"first_name":null,"id":"201933453","identification":{"number":"27395499063","type":"CUIT"},"last_name":null,"operator_id":null,"phone":{"number":null,"extension":null,"area_code":null},"type":null},"payment_method":{"id":"cvu","issuer_id":"12397","type":"bank_transfer"},"payment_method_id":"cvu","payment_type_id":"bank_transfer","platform_id":null,"point_of_interaction":{"application_data":{"name":null,"operating_system":null,"version":null},"business_info":{"branch":null,"sub_unit":"money_inflows","unit":"digital_accounts_cards"},"location":{"source":"collector","state_id":"AR-B"},"sub_type":"INTER_PSP","transaction_data":{"bank_info":{"collector":{"account_alias":null,"account_holder_name":null,"account_id":null,"long_name":null,"transfer_account_id":null},"is_same_bank_account_owner":null,"origin_bank_id":null,"origin_wallet_id":null,"payer":{"account_id":null,"branch":null,"external_account_id":null,"id":null,"identification":{},"long_name":null}},"bank_transfer_id":121112040025,"e2e_id":"PDX4OGNYG5XXPPRYN0L6EY","financial_institution":1,"infringement_notification":{"status":null,"type":null},"is_end_consumer":null,"merchant_category_code":null,"qr_code":null,"ticket_url":null,"transaction_id":"PDX4OGNYG5XXPPRYN0L6EY"},"type":"PSP_TRANSFER"},"pos_id":null,"processing_mode":"aggregator","refunds":[],"release_info":null,"shipping_amount":0,"sponsor_id":null,"statement_descriptor":null,"status":"approved","status_detail":"accredited","store_id":null,"tags":null,"taxes_amount":0,"transaction_amount":2490.88,"transaction_amount_refunded":0,"transaction_details":{"acquirer_reference":null,"bank_transfer_id":121112040025,"external_resource_url":null,"financial_institution":"1","installment_amount":0,"net_received_amount":2490.88,"overpaid_amount":0,"payable_deferral_period":null,"payment_method_reference_id":null,"total_paid_amount":2490.88,"transaction_id":"PDX4OGNYG5XXPPRYN0L6EY"},"shipping_cost":0}	pending_review	2026-02-21 17:00:37.861557	2026-02-21 17:00:37.861557
14	2000.00	39549906	148093315332	2026-02-27 15:57:48	{"accounts_info":null,"acquirer_reconciliation":[],"additional_info":{"tracking_id":"platform:v1-blacklabel,so:ALL,type:N/A,security:none"},"authorization_code":null,"binary_mode":false,"brand_id":null,"build_version":"3.144.0-rc-4","call_for_authorize_id":null,"callback_url":null,"captured":true,"card":{},"charges_details":[],"charges_execution_info":{"internal_execution":{"date":"2026-02-27T11:57:48.127-04:00","execution_id":"01KJFX425ZPXX6PES080AE02KA"}},"collector_id":201933453,"corporation_id":null,"counter_currency":null,"coupon_amount":0,"currency_id":"ARS","date_approved":"2026-02-27T11:57:48.000-04:00","date_created":"2026-02-27T11:57:48.000-04:00","date_last_updated":"2026-02-27T11:57:51.000-04:00","date_of_expiration":null,"deduction_schema":null,"description":"Pago Debin","differential_pricing_id":null,"external_reference":null,"fee_details":[],"financing_group":null,"id":148093315332,"installments":1,"integrator_id":null,"issuer_id":"12520","live_mode":true,"marketplace_owner":null,"merchant_account_id":null,"merchant_number":null,"metadata":{},"money_release_date":"2026-02-27T11:57:48.000-04:00","money_release_schema":null,"money_release_status":"released","notification_url":null,"operation_type":"account_fund","order":{},"payer":{"email":"magabenua@hotmail.com","entity_type":null,"first_name":null,"id":"201933453","identification":{"number":"27395499063","type":"CUIT"},"last_name":null,"operator_id":null,"phone":{"number":null,"extension":null,"area_code":null},"type":null},"payment_method":{"id":"debin_transfer","issuer_id":"12520","type":"bank_transfer"},"payment_method_id":"debin_transfer","payment_type_id":"bank_transfer","platform_id":null,"point_of_interaction":{"business_info":{"branch":"Debin","sub_unit":"money_inflows","unit":"digital_accounts_cards"},"location":{"source":"collector","state_id":"AR-B"},"transaction_data":{},"type":"UNSPECIFIED"},"pos_id":null,"processing_mode":"aggregator","refunds":[],"release_info":null,"shipping_amount":0,"sponsor_id":null,"statement_descriptor":null,"status":"approved","status_detail":"accredited","store_id":null,"tags":null,"taxes_amount":0,"transaction_amount":2000,"transaction_amount_refunded":0,"transaction_details":{"acquirer_reference":null,"bank_transfer_id":122482963862,"external_resource_url":null,"financial_institution":"1","installment_amount":0,"net_received_amount":2000,"overpaid_amount":0,"payable_deferral_period":null,"payment_method_reference_id":null,"total_paid_amount":2000,"transaction_id":"201933453-3b6a257a-0454-4b10-bff5-7178364ae60d"},"shipping_cost":0}	pending_review	2026-02-27 16:00:35.822962	2026-02-27 16:00:35.822962
15	6000.00	39549906	147389482645	2026-02-27 16:36:12	{"accounts_info":null,"acquirer_reconciliation":[],"additional_info":{"tracking_id":"platform:v1-blacklabel,so:ALL,type:N/A,security:none"},"authorization_code":null,"binary_mode":false,"brand_id":null,"build_version":"3.144.0-rc-4","call_for_authorize_id":null,"callback_url":null,"captured":true,"card":{},"charges_details":[],"charges_execution_info":{"internal_execution":{"date":"2026-02-27T12:36:12.217-04:00","execution_id":"01KJFZAC8S7Z5SHVZR49VSKF7J"}},"collector_id":201933453,"corporation_id":null,"counter_currency":null,"coupon_amount":0,"currency_id":"ARS","date_approved":"2026-02-27T12:36:12.000-04:00","date_created":"2026-02-27T12:36:12.000-04:00","date_last_updated":"2026-02-27T12:36:16.000-04:00","date_of_expiration":null,"deduction_schema":null,"description":"Pago Debin","differential_pricing_id":null,"external_reference":null,"fee_details":[],"financing_group":null,"id":147389482645,"installments":1,"integrator_id":null,"issuer_id":"12520","live_mode":true,"marketplace_owner":null,"merchant_account_id":null,"merchant_number":null,"metadata":{},"money_release_date":"2026-02-27T12:36:12.000-04:00","money_release_schema":null,"money_release_status":"released","notification_url":null,"operation_type":"account_fund","order":{},"payer":{"email":"magabenua@hotmail.com","entity_type":null,"first_name":null,"id":"201933453","identification":{"number":"27395499063","type":"CUIT"},"last_name":null,"operator_id":null,"phone":{"number":null,"extension":null,"area_code":null},"type":null},"payment_method":{"id":"debin_transfer","issuer_id":"12520","type":"bank_transfer"},"payment_method_id":"debin_transfer","payment_type_id":"bank_transfer","platform_id":null,"point_of_interaction":{"business_info":{"branch":"Debin","sub_unit":"money_inflows","unit":"digital_accounts_cards"},"location":{"source":"collector","state_id":"AR-B"},"transaction_data":{},"type":"UNSPECIFIED"},"pos_id":null,"processing_mode":"aggregator","refunds":[],"release_info":null,"shipping_amount":0,"sponsor_id":null,"statement_descriptor":null,"status":"approved","status_detail":"accredited","store_id":null,"tags":null,"taxes_amount":0,"transaction_amount":6000,"transaction_amount_refunded":0,"transaction_details":{"acquirer_reference":null,"bank_transfer_id":122484248340,"external_resource_url":null,"financial_institution":"1","installment_amount":0,"net_received_amount":6000,"overpaid_amount":0,"payable_deferral_period":null,"payment_method_reference_id":null,"total_paid_amount":6000,"transaction_id":"201933453-1cea1baf-44ef-4ce2-8d3a-ad298a53f0e9"},"shipping_cost":0}	pending_review	2026-02-27 16:40:13.528045	2026-02-27 16:40:13.528045
16	17000.00	39549906	148406068824	2026-03-01 21:28:06	{"accounts_info":null,"acquirer_reconciliation":[],"additional_info":{"tracking_id":"platform:v1-blacklabel,so:ALL,type:N/A,security:none"},"authorization_code":null,"binary_mode":false,"brand_id":null,"build_version":"3.144.0-rc-4","call_for_authorize_id":null,"callback_url":null,"captured":true,"card":{},"charges_details":[],"charges_execution_info":{"internal_execution":{"date":"2026-03-01T17:28:06.537-04:00","execution_id":"01KJNMTA3BG4K41X3PS9SDRDZJ"}},"collector_id":201933453,"corporation_id":null,"counter_currency":null,"coupon_amount":0,"currency_id":"ARS","date_approved":"2026-03-01T17:28:06.000-04:00","date_created":"2026-03-01T17:28:06.000-04:00","date_last_updated":"2026-03-01T17:28:11.000-04:00","date_of_expiration":null,"deduction_schema":null,"description":"Pago Debin","differential_pricing_id":null,"external_reference":null,"fee_details":[],"financing_group":null,"id":148406068824,"installments":1,"integrator_id":null,"issuer_id":"12520","live_mode":true,"marketplace_owner":null,"merchant_account_id":null,"merchant_number":null,"metadata":{},"money_release_date":"2026-03-01T17:28:06.000-04:00","money_release_schema":null,"money_release_status":"released","notification_url":null,"operation_type":"account_fund","order":{},"payer":{"email":"magabenua@hotmail.com","entity_type":null,"first_name":null,"id":"201933453","identification":{"number":"27395499063","type":"CUIT"},"last_name":null,"operator_id":null,"phone":{"number":null,"extension":null,"area_code":null},"type":null},"payment_method":{"id":"debin_transfer","issuer_id":"12520","type":"bank_transfer"},"payment_method_id":"debin_transfer","payment_type_id":"bank_transfer","platform_id":null,"point_of_interaction":{"business_info":{"branch":"Debin","sub_unit":"money_inflows","unit":"digital_accounts_cards"},"location":{"source":"collector","state_id":"AR-B"},"transaction_data":{},"type":"UNSPECIFIED"},"pos_id":null,"processing_mode":"aggregator","refunds":[],"release_info":null,"shipping_amount":0,"sponsor_id":null,"statement_descriptor":null,"status":"approved","status_detail":"accredited","store_id":null,"tags":null,"taxes_amount":0,"transaction_amount":17000,"transaction_amount_refunded":0,"transaction_details":{"acquirer_reference":null,"bank_transfer_id":122549119408,"external_resource_url":null,"financial_institution":"1","installment_amount":0,"net_received_amount":17000,"overpaid_amount":0,"payable_deferral_period":null,"payment_method_reference_id":null,"total_paid_amount":17000,"transaction_id":"201933453-a341efa1-b2d7-47e2-b330-aa6bf56b8869"},"shipping_cost":0}	pending_review	2026-03-01 21:30:21.635201	2026-03-01 21:30:21.635201
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, name, phone, password_hash, is_guest, created_at, updated_at, role) FROM stdin;
4138358f-36c5-41cc-8741-dfa34563c400	admin@decomoi.com	Administrador	\N	b3c7f2e038823fbc333c7c96c416a2bf:4e4a6a025a8b88a5f78e89b076e5456b2358d67271522ededd9412678ed6214f0d14cd0a9abadf45af51a95074dab384da95ffb417b0aa1e15befc51cb5b621a	f	2026-02-16 13:04:51.78827	2026-02-16 13:04:51.78827	admin
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: postgres
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 1, false);


--
-- Name: addresses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.addresses_id_seq', 1, false);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 26, true);


--
-- Name: cost_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cost_items_id_seq', 8, true);


--
-- Name: email_queue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.email_queue_id_seq', 10, true);


--
-- Name: home_blocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.home_blocks_id_seq', 5, true);


--
-- Name: meli_credentials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.meli_credentials_id_seq', 5, true);


--
-- Name: meli_item_links_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.meli_item_links_id_seq', 36, true);


--
-- Name: meli_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.meli_orders_id_seq', 1, false);


--
-- Name: meli_pricing_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.meli_pricing_config_id_seq', 1, true);


--
-- Name: meli_sync_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.meli_sync_log_id_seq', 13, true);


--
-- Name: mockup_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mockup_templates_id_seq', 4, true);


--
-- Name: order_item_costs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_item_costs_id_seq', 22, true);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_items_id_seq', 20, true);


--
-- Name: page_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.page_templates_id_seq', 2, true);


--
-- Name: price_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.price_rules_id_seq', 31, true);


--
-- Name: product_cost_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_cost_items_id_seq', 2, true);


--
-- Name: product_supplies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_supplies_id_seq', 517, true);


--
-- Name: product_variants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_variants_id_seq', 37, true);


--
-- Name: production_time_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.production_time_rules_id_seq', 3, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 45, true);


--
-- Name: reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reviews_id_seq', 10, true);


--
-- Name: shipping_real_costs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shipping_real_costs_id_seq', 1, false);


--
-- Name: site_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.site_config_id_seq', 17, true);


--
-- Name: supplies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.supplies_id_seq', 69, true);


--
-- Name: supply_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.supply_categories_id_seq', 8, true);


--
-- Name: supply_composition_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.supply_composition_id_seq', 42, true);


--
-- Name: unmatched_transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.unmatched_transfers_id_seq', 16, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: postgres
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_unique UNIQUE (slug);


--
-- Name: cost_items cost_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cost_items
    ADD CONSTRAINT cost_items_pkey PRIMARY KEY (id);


--
-- Name: email_queue email_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_queue
    ADD CONSTRAINT email_queue_pkey PRIMARY KEY (id);


--
-- Name: home_blocks home_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_blocks
    ADD CONSTRAINT home_blocks_pkey PRIMARY KEY (id);


--
-- Name: meli_credentials meli_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meli_credentials
    ADD CONSTRAINT meli_credentials_pkey PRIMARY KEY (id);


--
-- Name: meli_item_links meli_item_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meli_item_links
    ADD CONSTRAINT meli_item_links_pkey PRIMARY KEY (id);


--
-- Name: meli_orders meli_orders_meli_order_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meli_orders
    ADD CONSTRAINT meli_orders_meli_order_id_unique UNIQUE (meli_order_id);


--
-- Name: meli_orders meli_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meli_orders
    ADD CONSTRAINT meli_orders_pkey PRIMARY KEY (id);


--
-- Name: meli_pricing_config meli_pricing_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meli_pricing_config
    ADD CONSTRAINT meli_pricing_config_pkey PRIMARY KEY (id);


--
-- Name: meli_sync_log meli_sync_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meli_sync_log
    ADD CONSTRAINT meli_sync_log_pkey PRIMARY KEY (id);


--
-- Name: mockup_templates mockup_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mockup_templates
    ADD CONSTRAINT mockup_templates_pkey PRIMARY KEY (id);


--
-- Name: mockup_templates mockup_templates_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mockup_templates
    ADD CONSTRAINT mockup_templates_slug_unique UNIQUE (slug);


--
-- Name: order_item_costs order_item_costs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item_costs
    ADD CONSTRAINT order_item_costs_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: page_templates page_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.page_templates
    ADD CONSTRAINT page_templates_pkey PRIMARY KEY (id);


--
-- Name: pages pages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT pages_pkey PRIMARY KEY (id);


--
-- Name: pages pages_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT pages_slug_unique UNIQUE (slug);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: price_rules price_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_rules
    ADD CONSTRAINT price_rules_pkey PRIMARY KEY (id);


--
-- Name: product_cost_items product_cost_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_cost_items
    ADD CONSTRAINT product_cost_items_pkey PRIMARY KEY (id);


--
-- Name: product_supplies product_supplies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_supplies
    ADD CONSTRAINT product_supplies_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_sku_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_sku_unique UNIQUE (sku);


--
-- Name: production_time_rules production_time_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_time_rules
    ADD CONSTRAINT production_time_rules_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_sku_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_unique UNIQUE (sku);


--
-- Name: products products_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_slug_unique UNIQUE (slug);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: shipping_real_costs shipping_real_costs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping_real_costs
    ADD CONSTRAINT shipping_real_costs_pkey PRIMARY KEY (id);


--
-- Name: shipping_real_costs shipping_real_costs_zone_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping_real_costs
    ADD CONSTRAINT shipping_real_costs_zone_unique UNIQUE (zone);


--
-- Name: site_config site_config_key_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_config
    ADD CONSTRAINT site_config_key_unique UNIQUE (key);


--
-- Name: site_config site_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_config
    ADD CONSTRAINT site_config_pkey PRIMARY KEY (id);


--
-- Name: supplies supplies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplies
    ADD CONSTRAINT supplies_pkey PRIMARY KEY (id);


--
-- Name: supply_categories supply_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supply_categories
    ADD CONSTRAINT supply_categories_pkey PRIMARY KEY (id);


--
-- Name: supply_categories supply_categories_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supply_categories
    ADD CONSTRAINT supply_categories_slug_unique UNIQUE (slug);


--
-- Name: supply_composition supply_composition_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supply_composition
    ADD CONSTRAINT supply_composition_pkey PRIMARY KEY (id);


--
-- Name: unmatched_transfers unmatched_transfers_mp_payment_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unmatched_transfers
    ADD CONSTRAINT unmatched_transfers_mp_payment_id_unique UNIQUE (mp_payment_id);


--
-- Name: unmatched_transfers unmatched_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unmatched_transfers
    ADD CONSTRAINT unmatched_transfers_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: meli_item_variation_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX meli_item_variation_idx ON public.meli_item_links USING btree (meli_item_id, meli_variation_id);


--
-- Name: meli_item_links meli_item_links_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meli_item_links
    ADD CONSTRAINT meli_item_links_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: mockup_templates mockup_templates_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mockup_templates
    ADD CONSTRAINT mockup_templates_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: order_item_costs order_item_costs_order_item_id_order_items_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item_costs
    ADD CONSTRAINT order_item_costs_order_item_id_order_items_id_fk FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE CASCADE;


--
-- Name: product_cost_items product_cost_items_cost_item_id_cost_items_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_cost_items
    ADD CONSTRAINT product_cost_items_cost_item_id_cost_items_id_fk FOREIGN KEY (cost_item_id) REFERENCES public.cost_items(id) ON DELETE CASCADE;


--
-- Name: product_cost_items product_cost_items_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_cost_items
    ADD CONSTRAINT product_cost_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_supplies product_supplies_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_supplies
    ADD CONSTRAINT product_supplies_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_supplies product_supplies_supply_id_supplies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_supplies
    ADD CONSTRAINT product_supplies_supply_id_supplies_id_fk FOREIGN KEY (supply_id) REFERENCES public.supplies(id) ON DELETE CASCADE;


--
-- Name: product_variants product_variants_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: supply_composition supply_composition_parent_id_supplies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supply_composition
    ADD CONSTRAINT supply_composition_parent_id_supplies_id_fk FOREIGN KEY (parent_id) REFERENCES public.supplies(id) ON DELETE CASCADE;


--
-- Name: supply_composition supply_composition_supply_id_supplies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supply_composition
    ADD CONSTRAINT supply_composition_supply_id_supplies_id_fk FOREIGN KEY (supply_id) REFERENCES public.supplies(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

