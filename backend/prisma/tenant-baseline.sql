--
-- PostgreSQL database dump
--

\restrict pKAmW6DXPfAnGF1RYkvzSMNbjSVNKappNazI6ejvahu5w2Qe5xHBQhmhk7JE3IS

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _NewsToNewsTag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."_NewsToNewsTag" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: accounting_email_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounting_email_settings (
    id text NOT NULL,
    imap_host text NOT NULL,
    imap_port integer DEFAULT 993 NOT NULL,
    imap_user text NOT NULL,
    imap_pass text NOT NULL,
    check_interval_ms integer DEFAULT 60000 NOT NULL,
    processed_folder text,
    is_active boolean DEFAULT true NOT NULL,
    secure boolean DEFAULT true NOT NULL,
    reject_unauthorized boolean DEFAULT false NOT NULL,
    require_tls boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: accounting_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounting_rules (
    id text NOT NULL,
    name text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    from_contains text,
    subject_contains text,
    body_contains text,
    has_attachments boolean,
    doc_type text DEFAULT 'other'::text NOT NULL,
    direction text DEFAULT 'incoming'::text NOT NULL,
    contact_id text,
    stop_processing boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activities (
    id text NOT NULL,
    action text NOT NULL,
    entity text NOT NULL,
    "entityId" text NOT NULL,
    details text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" text,
    "taskId" text
);


--
-- Name: auto_reply_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auto_reply_settings (
    id text NOT NULL,
    user_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: auto_reply_triggers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auto_reply_triggers (
    id text NOT NULL,
    settings_id text NOT NULL,
    word text NOT NULL,
    answer text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: bank_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bank_payments (
    id text NOT NULL,
    account_id text NOT NULL,
    payment_id text,
    date timestamp(3) without time zone NOT NULL,
    amount double precision NOT NULL,
    direction text DEFAULT 'debit'::text NOT NULL,
    counterparty_name text,
    counterparty_inn text,
    purpose text,
    raw jsonb,
    matched_document_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: beget_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.beget_settings (
    id integer DEFAULT 1 NOT NULL,
    login text DEFAULT ''::text NOT NULL,
    password text DEFAULT ''::text NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_partner boolean DEFAULT false NOT NULL,
    update_time text DEFAULT '10:00'::text NOT NULL
);


--
-- Name: branding; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branding (
    id integer DEFAULT 1 NOT NULL,
    icon_path text,
    logo_path text,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    dark_logo_path text,
    accent_color text,
    news_cover_path text,
    splash_enabled boolean DEFAULT true NOT NULL,
    splash_path text,
    default_theme text,
    login_title text,
    login_accent text,
    login_subtitle text,
    product_default_image_path text,
    product_card_style text
);


--
-- Name: calls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calls (
    id text NOT NULL,
    pbx_call_id text NOT NULL,
    call_id_with_rec text,
    direction text NOT NULL,
    caller_id text NOT NULL,
    called_did text NOT NULL,
    internal text,
    employee_name text,
    duration integer DEFAULT 0 NOT NULL,
    disposition text DEFAULT 'unknown'::text NOT NULL,
    status_code text,
    is_recorded boolean DEFAULT false NOT NULL,
    record_url text,
    record_local_path text,
    record_downloaded_at timestamp(3) without time zone,
    call_start timestamp(3) without time zone NOT NULL,
    call_end timestamp(3) without time zone,
    contact_id text,
    task_id text,
    notes text,
    tags text[] DEFAULT ARRAY[]::text[],
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: camera_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.camera_settings (
    id text NOT NULL,
    ip text DEFAULT '192.168.8.10'::text NOT NULL,
    port integer DEFAULT 554 NOT NULL,
    channel text DEFAULT '102'::text NOT NULL,
    username text DEFAULT 'admin'::text NOT NULL,
    password text DEFAULT 'W22665588e'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    label text DEFAULT 'Видеокамера'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Name: chat_message_recipients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_message_recipients (
    id text NOT NULL,
    message_id text NOT NULL,
    user_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "authorId" text NOT NULL,
    deleted_at timestamp(3) without time zone,
    reply_to_id text
);


--
-- Name: chat_reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_reactions (
    id text NOT NULL,
    emoji text DEFAULT '👍'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    message_id text NOT NULL,
    user_id text NOT NULL
);


--
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    id text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "authorId" text NOT NULL,
    "taskId" text NOT NULL,
    vk_message_id integer,
    is_internal boolean DEFAULT false NOT NULL,
    max_message_id text,
    telegram_message_id text
);


--
-- Name: contact_accesses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_accesses (
    id text NOT NULL,
    contact_id text NOT NULL,
    direction text NOT NULL,
    description text,
    comment text,
    url text,
    login text,
    password text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: contact_projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_projects (
    id text NOT NULL,
    contact_id text NOT NULL,
    project_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: contact_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_types (
    id text NOT NULL,
    name text NOT NULL,
    label text NOT NULL,
    color text DEFAULT '#f0f0f0'::text NOT NULL,
    text_color text DEFAULT '#666'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_visible boolean DEFAULT true NOT NULL,
    for_vitrine boolean DEFAULT false NOT NULL,
    for_vk boolean DEFAULT false NOT NULL
);


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    id text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    type text DEFAULT 'client'::text NOT NULL,
    tags text[] DEFAULT ARRAY[]::text[],
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    emails text[] DEFAULT ARRAY[]::text[],
    phones text[] DEFAULT ARRAY[]::text[],
    vk_user_id integer,
    inn text,
    kind text DEFAULT 'contact'::text NOT NULL,
    legal_address text,
    ogrn text,
    organization_id text,
    "position" text,
    max_chat_id text,
    max_user_id text,
    avatar_url text,
    description text,
    last_activity_time timestamp(3) without time zone,
    telegram_chat_id text,
    telegram_user_id text,
    vk_profile_url text,
    onec_id text,
    birth_date timestamp(3) without time zone,
    address text,
    telegram_username text
);


--
-- Name: dashboard_metric_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dashboard_metric_settings (
    id text NOT NULL,
    user_id text NOT NULL,
    metric_key text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    visible boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: deals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deals (
    id text NOT NULL,
    title text NOT NULL,
    value integer DEFAULT 0 NOT NULL,
    currency text DEFAULT 'RUB'::text NOT NULL,
    stage text DEFAULT 'lead'::text NOT NULL,
    probability integer DEFAULT 10 NOT NULL,
    "expectedClose" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "contactId" text,
    "projectId" text,
    status_changed_at timestamp(3) without time zone
);


--
-- Name: dgis_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dgis_settings (
    id text NOT NULL,
    api_key text,
    is_active boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: diadoc_plugin_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.diadoc_plugin_settings (
    id integer DEFAULT 1 NOT NULL,
    login text DEFAULT ''::text NOT NULL,
    password text DEFAULT ''::text NOT NULL,
    api_key text DEFAULT ''::text NOT NULL,
    box_id text DEFAULT ''::text NOT NULL,
    box_name text DEFAULT ''::text NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    update_interval_minutes integer DEFAULT 15 NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: email_filter_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_filter_logs (
    id text NOT NULL,
    filter_id text,
    email_from text,
    email_to text,
    subject text,
    action text NOT NULL,
    task_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: email_filters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_filters (
    id text NOT NULL,
    name text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    from_contains text,
    to_contains text,
    subject_contains text,
    body_contains text,
    has_attachments boolean,
    create_task boolean DEFAULT true NOT NULL,
    project_id text,
    assignee_ids text[] DEFAULT ARRAY[]::text[] NOT NULL,
    priority text,
    status text,
    mark_read boolean,
    move_to_folder text,
    stop_processing boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    parse_rules jsonb,
    is_spam boolean DEFAULT false NOT NULL
);


--
-- Name: email_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_settings (
    id text NOT NULL,
    "imapHost" text NOT NULL,
    "imapPort" integer DEFAULT 993 NOT NULL,
    "imapUser" text NOT NULL,
    "imapPass" text NOT NULL,
    "checkIntervalMs" integer DEFAULT 60000 NOT NULL,
    "processedFolder" text,
    "defaultCreatorId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    secure boolean DEFAULT true NOT NULL,
    "rejectUnauthorized" boolean DEFAULT false NOT NULL,
    "requireTLS" boolean DEFAULT true NOT NULL
);


--
-- Name: file_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.file_attachments (
    id text NOT NULL,
    filename text NOT NULL,
    "originalName" text NOT NULL,
    "mimeType" text NOT NULL,
    size integer NOT NULL,
    path text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    "authorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: file_tab_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.file_tab_settings (
    id text NOT NULL,
    tab_key text NOT NULL,
    url text DEFAULT ''::text NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    path text DEFAULT ''::text NOT NULL
);


--
-- Name: finance_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.finance_documents (
    id text NOT NULL,
    type text DEFAULT 'other'::text NOT NULL,
    direction text DEFAULT 'incoming'::text NOT NULL,
    number text,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    amount double precision DEFAULT 0 NOT NULL,
    vat double precision,
    currency text DEFAULT 'RUB'::text NOT NULL,
    counterparty_name text,
    counterparty_inn text,
    contact_id text,
    task_id text,
    deal_id text,
    status text DEFAULT 'new'::text NOT NULL,
    source text DEFAULT 'email'::text NOT NULL,
    email_message_id text,
    email_from text,
    email_subject text,
    notes text,
    match_status text DEFAULT 'unmatched'::text NOT NULL,
    matched_payment_id text,
    fiscal_fn text,
    fiscal_fd text,
    fiscal_fp text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: handler_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.handler_settings (
    id text NOT NULL,
    greeting text DEFAULT ''::text NOT NULL,
    completion text DEFAULT ''::text NOT NULL,
    user_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: help_articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.help_articles (
    id text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    section text NOT NULL,
    descr text DEFAULT ''::text NOT NULL,
    mascot text,
    blocks jsonb NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: legal_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.legal_documents (
    id integer DEFAULT 1 NOT NULL,
    offer text DEFAULT ''::text NOT NULL,
    privacy text DEFAULT ''::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: login_slides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.login_slides (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    image_url text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: max_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.max_settings (
    id text NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    api_token text NOT NULL,
    chat_id text,
    bot_username text,
    webhook_url text,
    auto_notify boolean DEFAULT true NOT NULL,
    notify_on text[] DEFAULT ARRAY['task'::text, 'comment'::text],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    default_creator_id text,
    assignee_ids text[] DEFAULT ARRAY[]::text[],
    auto_create_contact boolean DEFAULT true NOT NULL,
    auto_reply boolean DEFAULT false NOT NULL
);


--
-- Name: max_user_chats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.max_user_chats (
    id text NOT NULL,
    chat_id text NOT NULL,
    user_id text,
    username text,
    first_name text,
    last_name text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: news; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    summary text,
    content text NOT NULL,
    cover_image text,
    is_published boolean DEFAULT false NOT NULL,
    published_at timestamp(3) without time zone,
    views integer DEFAULT 0 NOT NULL,
    labels text[] DEFAULT ARRAY[]::text[],
    "authorId" text NOT NULL,
    "categoryId" text,
    "subcategoryId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    pinned_to_home boolean DEFAULT false NOT NULL
);


--
-- Name: news_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news_categories (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    color text DEFAULT '#10b981'::text NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL
);


--
-- Name: news_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news_comments (
    id text NOT NULL,
    news_id text NOT NULL,
    author_id text NOT NULL,
    content text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: news_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news_history (
    id text NOT NULL,
    news_id text NOT NULL,
    title text NOT NULL,
    summary text,
    content text NOT NULL,
    labels text[] DEFAULT ARRAY[]::text[],
    "categoryId" text,
    "subcategoryId" text,
    "tagIds" text[] DEFAULT ARRAY[]::text[],
    cover_image text,
    is_published boolean DEFAULT false NOT NULL,
    "editorId" text NOT NULL,
    "editorName" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    pinned_to_home boolean DEFAULT false NOT NULL
);


--
-- Name: news_reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news_reactions (
    id text NOT NULL,
    news_id text NOT NULL,
    user_id text NOT NULL,
    type text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: news_subcategories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news_subcategories (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    "categoryId" text NOT NULL
);


--
-- Name: news_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news_tags (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    color text DEFAULT '#10b981'::text NOT NULL
);


--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes (
    id text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    color text DEFAULT '#f0f0f0'::text NOT NULL,
    tags text[] DEFAULT ARRAY[]::text[],
    user_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    user_id text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    entity_type text,
    entity_id text,
    url text,
    read_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: onec_plugin_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.onec_plugin_settings (
    id integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    service_url text DEFAULT ''::text NOT NULL,
    login text DEFAULT ''::text NOT NULL,
    password text DEFAULT ''::text NOT NULL,
    sync_interval_minutes integer DEFAULT 15 NOT NULL,
    last_sync_at timestamp(3) without time zone,
    last_sync_result jsonb,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    entity_sync jsonb,
    kind_folder text DEFAULT ''::text NOT NULL
);


--
-- Name: onec_sync_lock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.onec_sync_lock (
    id integer NOT NULL,
    started_at timestamp with time zone NOT NULL
);


--
-- Name: ozon_seller_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ozon_seller_settings (
    id integer DEFAULT 1 NOT NULL,
    client_id text DEFAULT ''::text NOT NULL,
    api_key text DEFAULT ''::text NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    update_interval_minutes integer DEFAULT 60 NOT NULL,
    last_sync_at timestamp(3) without time zone,
    last_sync_result text,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    default_type_id integer
);


--
-- Name: price_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.price_history (
    id text NOT NULL,
    product_id text NOT NULL,
    price_type_id text NOT NULL,
    old_price double precision NOT NULL,
    new_price double precision NOT NULL,
    user_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: price_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.price_types (
    id text NOT NULL,
    name text NOT NULL,
    label text NOT NULL,
    color text DEFAULT '#f0f0f0'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    for_vitrine boolean DEFAULT false NOT NULL,
    for_vk boolean DEFAULT false NOT NULL,
    is_retail boolean DEFAULT false NOT NULL,
    for_cashless boolean DEFAULT false NOT NULL
);


--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_categories (
    id text NOT NULL,
    onec_id text,
    name text NOT NULL,
    is_group boolean DEFAULT true NOT NULL,
    parent_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    ozon_type_id integer,
    is_crm_tariff boolean DEFAULT false NOT NULL
);


--
-- Name: product_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_images (
    id text NOT NULL,
    product_id text NOT NULL,
    attachment_id text NOT NULL,
    url text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: product_prices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_prices (
    id text NOT NULL,
    product_id text NOT NULL,
    price_type_id text NOT NULL,
    price double precision DEFAULT 0 NOT NULL,
    currency text DEFAULT 'RUB'::text NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    price_from boolean DEFAULT false NOT NULL
);


--
-- Name: product_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_subscriptions (
    id text NOT NULL,
    number integer NOT NULL,
    product_id text NOT NULL,
    contact_id text,
    user_id text,
    price numeric(65,30) DEFAULT 0 NOT NULL,
    period text DEFAULT 'month'::text NOT NULL,
    status text DEFAULT 'new'::text NOT NULL,
    comment text DEFAULT ''::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    ends_at timestamp(3) without time zone
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id text NOT NULL,
    sku text,
    name text NOT NULL,
    description text,
    category text,
    unit text DEFAULT 'шт'::text NOT NULL,
    barcode text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    kind text DEFAULT 'product'::text NOT NULL,
    subcategory text,
    sync_to_vk boolean DEFAULT false NOT NULL,
    vk_item_id integer,
    onec_id text,
    onec_synced_at timestamp(3) without time zone,
    category_id text,
    on_vitrine boolean DEFAULT false NOT NULL,
    article text,
    is_subscription boolean DEFAULT false NOT NULL,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    sync_to_ozon boolean DEFAULT false NOT NULL,
    ozon_product_id bigint,
    ozon_synced_at timestamp(3) without time zone,
    weight double precision,
    width double precision,
    height double precision,
    depth double precision,
    brand text,
    tnved text,
    crm_allowed_pages jsonb,
    pay_link text,
    crm_cameras boolean DEFAULT false NOT NULL,
    crm_subscriptions boolean DEFAULT false NOT NULL,
    crm_accounting boolean DEFAULT false NOT NULL,
    crm_video_notes boolean DEFAULT false NOT NULL,
    crm_calls boolean DEFAULT false NOT NULL,
    crm_integrations jsonb,
    crm_renew_months integer
);


--
-- Name: project_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_users (
    id text NOT NULL,
    user_id text NOT NULL,
    project_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    status text DEFAULT 'active'::text NOT NULL,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    progress integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    parent_id text,
    is_locked boolean DEFAULT false NOT NULL,
    status_changed_at timestamp(3) without time zone
);


--
-- Name: promo_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promo_blocks (
    id text NOT NULL,
    title text NOT NULL,
    subtitle text,
    image_url text,
    button_text text DEFAULT 'Подробнее'::text NOT NULL,
    category_id text,
    format text DEFAULT 'square'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    button_style text DEFAULT 'blue'::text NOT NULL
);


--
-- Name: pskovline_balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pskovline_balances (
    id text NOT NULL,
    balance double precision,
    period text,
    status text DEFAULT 'ok'::text NOT NULL,
    error text,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: pskovline_plugin_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pskovline_plugin_accounts (
    id integer NOT NULL,
    label text DEFAULT ''::text NOT NULL,
    login text DEFAULT ''::text NOT NULL,
    password text DEFAULT ''::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Name: pskovline_plugin_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pskovline_plugin_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pskovline_plugin_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pskovline_plugin_accounts_id_seq OWNED BY public.pskovline_plugin_accounts.id;


--
-- Name: pskovline_plugin_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pskovline_plugin_settings (
    id integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    update_time text DEFAULT '08:00'::text NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: pskovline_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pskovline_settings (
    id text NOT NULL,
    label text DEFAULT 'Псковлайн'::text NOT NULL,
    login text DEFAULT '91868'::text NOT NULL,
    password text DEFAULT 'e5yvku2a'::text NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    label2 text DEFAULT 'Псковлайн телефон'::text NOT NULL,
    login2 text DEFAULT 'upl69777'::text NOT NULL,
    password2 text DEFAULT 'i9rmh2s9'::text NOT NULL
);


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_subscriptions (
    id text NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: reminder_recipients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reminder_recipients (
    id text NOT NULL,
    reminder_id text NOT NULL,
    user_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at timestamp(3) without time zone
);


--
-- Name: reminders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reminders (
    id text NOT NULL,
    title text NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    user_id text NOT NULL,
    status_id text,
    remind_at timestamp(3) without time zone NOT NULL,
    notify_before_min integer DEFAULT 0 NOT NULL,
    repeat text DEFAULT 'none'::text NOT NULL,
    repeat_end_at timestamp(3) without time zone,
    last_notified_at timestamp(3) without time zone,
    completed_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    status_changed_at timestamp(3) without time zone
);


--
-- Name: reservation_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservation_items (
    id text NOT NULL,
    reservation_id text NOT NULL,
    product_id text NOT NULL,
    quantity double precision NOT NULL,
    price double precision NOT NULL,
    sum double precision NOT NULL
);


--
-- Name: reservations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservations (
    id text NOT NULL,
    number integer NOT NULL,
    contact_id text NOT NULL,
    status text DEFAULT 'held'::text NOT NULL,
    total double precision DEFAULT 0 NOT NULL,
    warehouse_id text NOT NULL,
    user_id text,
    comment text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    issued_at timestamp(3) without time zone,
    payment_method text
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id text NOT NULL,
    name text NOT NULL,
    label text NOT NULL,
    color text DEFAULT '#f0f0f0'::text NOT NULL,
    "textColor" text DEFAULT '#666'::text NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    allowedpages text[] DEFAULT ARRAY[]::text[],
    isassignable boolean DEFAULT true NOT NULL,
    notify_on_new_task boolean DEFAULT true NOT NULL,
    notify_on_new_deal boolean DEFAULT false NOT NULL,
    notify_on_new_comment boolean DEFAULT false NOT NULL,
    notify_on_new_chat boolean DEFAULT false NOT NULL,
    notify_on_new_call boolean DEFAULT false NOT NULL,
    notify_on_new_news boolean DEFAULT false NOT NULL,
    can_access_chat boolean DEFAULT true NOT NULL,
    show_finances_tab boolean DEFAULT false NOT NULL,
    can_change_task_status boolean DEFAULT true NOT NULL,
    allowed_task_statuses text[] DEFAULT '{}'::text[] NOT NULL,
    can_create_news boolean DEFAULT true NOT NULL,
    can_edit_news boolean DEFAULT true NOT NULL,
    can_handle_spam boolean DEFAULT false NOT NULL,
    stock_access boolean DEFAULT true NOT NULL,
    can_access_projects boolean DEFAULT false NOT NULL,
    can_access_support_chat boolean DEFAULT false NOT NULL,
    can_see_all_support_tickets boolean DEFAULT false NOT NULL,
    show_calendar_metric boolean DEFAULT true NOT NULL
);


--
-- Name: sale_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_items (
    id text NOT NULL,
    "saleId" text NOT NULL,
    "productId" text NOT NULL,
    quantity numeric(12,3) NOT NULL,
    price numeric(12,2) NOT NULL,
    sum numeric(12,2) NOT NULL
);


--
-- Name: sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales (
    id text NOT NULL,
    number integer NOT NULL,
    "contactId" text NOT NULL,
    "warehouseId" text,
    "userId" text,
    comment text,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'new'::text NOT NULL,
    "paymentMethod" text,
    "paymentId" text,
    "paidAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: schedule_appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_appointments (
    id text NOT NULL,
    user_id text NOT NULL,
    contact_id text,
    client_name text NOT NULL,
    client_phone text DEFAULT ''::text NOT NULL,
    date text NOT NULL,
    start_min integer NOT NULL,
    end_min integer NOT NULL,
    status text DEFAULT 'planned'::text NOT NULL,
    comment text DEFAULT ''::text NOT NULL,
    created_by_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: schedule_rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_rooms (
    id text NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#3b82f6'::text NOT NULL,
    note text DEFAULT ''::text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: schedule_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_settings (
    id text NOT NULL,
    rooms_label text DEFAULT 'Кабинеты'::text NOT NULL,
    shifts_label text DEFAULT 'Смены'::text NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: schedule_shift_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_shift_templates (
    id text NOT NULL,
    user_id text NOT NULL,
    room_id text NOT NULL,
    weekday integer NOT NULL,
    start_min integer NOT NULL,
    end_min integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: schedule_shifts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_shifts (
    id text NOT NULL,
    user_id text NOT NULL,
    room_id text NOT NULL,
    date text NOT NULL,
    start_min integer NOT NULL,
    end_min integer NOT NULL,
    template_id text,
    cancelled boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: seo_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_settings (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    canonical text DEFAULT ''::text NOT NULL,
    robots text DEFAULT ''::text NOT NULL,
    lang text DEFAULT ''::text NOT NULL,
    viewport text DEFAULT ''::text NOT NULL,
    keywords text DEFAULT ''::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: sms_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sms_messages (
    id text NOT NULL,
    "from" text NOT NULL,
    "to" text NOT NULL,
    text text NOT NULL,
    contact_id text,
    received_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    task_id text
);


--
-- Name: statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.statuses (
    id text NOT NULL,
    entity_type text NOT NULL,
    name text NOT NULL,
    label text NOT NULL,
    color text DEFAULT '#f0f0f0'::text NOT NULL,
    text_color text DEFAULT '#666'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    auto_change_enabled boolean DEFAULT false NOT NULL,
    auto_change_minutes integer,
    auto_change_to_status_id text,
    auto_change_enabled_at timestamp(3) without time zone
);


--
-- Name: stock_balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_balances (
    id text NOT NULL,
    product_id text NOT NULL,
    warehouse_id text NOT NULL,
    quantity double precision DEFAULT 0 NOT NULL,
    reserved double precision DEFAULT 0 NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_movements (
    id text NOT NULL,
    product_id text NOT NULL,
    warehouse_id text NOT NULL,
    type text NOT NULL,
    quantity double precision NOT NULL,
    price double precision,
    comment text,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: task_assignees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_assignees (
    id text NOT NULL,
    "taskId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: task_curators; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_curators (
    id text NOT NULL,
    "taskId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL
);


--
-- Name: task_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_history (
    id text NOT NULL,
    task_id text NOT NULL,
    field text NOT NULL,
    old_value text,
    new_value text,
    user_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: task_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_transactions (
    id text NOT NULL,
    task_id text NOT NULL,
    type text NOT NULL,
    amount double precision NOT NULL,
    description text,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    status text DEFAULT 'open'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    "dueDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "creatorId" text NOT NULL,
    "projectId" text,
    "contactId" text,
    "dealId" text,
    "emailMessageId" text,
    "sourceEmail" text,
    parent_id text,
    vk_peer_id integer,
    vk_group_id integer,
    vk_message_id integer,
    budget double precision DEFAULT 0,
    price double precision DEFAULT 0,
    ticket_number integer NOT NULL,
    max_chat_id text,
    max_message_id text,
    max_user_id text,
    address text,
    telegram_message_id text,
    telegram_chat_id text,
    telegram_user_id text,
    support_owner_id text,
    status_changed_at timestamp(3) without time zone
);


--
-- Name: tasks_ticket_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tasks_ticket_number_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tasks_ticket_number_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tasks_ticket_number_seq OWNED BY public.tasks.ticket_number;


--
-- Name: telegram_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.telegram_settings (
    id text NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    bot_token text NOT NULL,
    chat_id text,
    bot_username text,
    webhook_url text,
    auto_notify boolean DEFAULT true NOT NULL,
    notify_on text[] DEFAULT ARRAY['task'::text, 'comment'::text],
    default_creator_id text,
    assignee_ids text[] DEFAULT ARRAY[]::text[],
    auto_create_contact boolean DEFAULT true NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    user_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    auto_reply boolean DEFAULT false NOT NULL
);


--
-- Name: telegram_user_chat; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.telegram_user_chat (
    id text NOT NULL,
    chat_id text NOT NULL,
    user_id text,
    username text,
    first_name text,
    last_name text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: telephony_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.telephony_settings (
    id text NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    api_key text NOT NULL,
    api_secret text NOT NULL,
    virtual_number text,
    webhook_secret text,
    auto_create_contact boolean DEFAULT true NOT NULL,
    auto_create_task boolean DEFAULT false NOT NULL,
    default_user_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    auto_create_task_on_incoming boolean DEFAULT false NOT NULL,
    auto_create_task_on_outgoing boolean DEFAULT false NOT NULL,
    auto_attach_record boolean DEFAULT false NOT NULL,
    notify_admins_on_sms boolean DEFAULT false NOT NULL,
    default_iov_employee_id integer,
    default_iov_employee_name text,
    auto_create_task_on_sms boolean DEFAULT false NOT NULL,
    web_rtc_enabled boolean DEFAULT false NOT NULL
);


--
-- Name: tenant_ticket_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_ticket_attachments (
    id text NOT NULL,
    ticket_id text,
    message_id text,
    tenant_slug text NOT NULL,
    author_id text,
    author_role text NOT NULL,
    author_name text NOT NULL,
    filename text NOT NULL,
    original_name text NOT NULL,
    mime_type text NOT NULL,
    size integer NOT NULL,
    path text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: tenant_ticket_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_ticket_messages (
    id text NOT NULL,
    ticket_id text NOT NULL,
    author_role text NOT NULL,
    author_name text NOT NULL,
    body text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: tenant_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_tickets (
    id text NOT NULL,
    tenant_id text NOT NULL,
    tenant_slug text NOT NULL,
    tenant_name text NOT NULL,
    author_id text,
    author_name text NOT NULL,
    author_email text NOT NULL,
    subject text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    db_name text NOT NULL,
    admin_email text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    plan text DEFAULT 'standard'::text NOT NULL,
    price_per_month integer,
    paid_until timestamp(3) without time zone,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    activated_at timestamp(3) without time zone,
    plan_product_id text,
    payment_info text
);


--
-- Name: tochka_acquiring_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tochka_acquiring_payments (
    id text NOT NULL,
    sale_id text,
    order_id text NOT NULL,
    payment_id text,
    amount integer NOT NULL,
    method text NOT NULL,
    status text DEFAULT 'created'::text NOT NULL,
    payment_url text,
    qr_data text,
    paid_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    subscription_id text
);


--
-- Name: tochka_acquiring_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tochka_acquiring_settings (
    id integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    terminal_key text DEFAULT ''::text NOT NULL,
    password text DEFAULT ''::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: tochka_plugin_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tochka_plugin_settings (
    id integer DEFAULT 1 NOT NULL,
    update_interval_minutes integer DEFAULT 15 NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    avatar text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "roleId" text,
    "hideCompletedTasks" boolean DEFAULT true NOT NULL,
    "darkTheme" boolean DEFAULT false NOT NULL,
    username text,
    last_active_at timestamp(3) without time zone,
    emails text[] DEFAULT ARRAY[]::text[],
    allowed_pages text[] DEFAULT ARRAY[]::text[],
    can_be_curator boolean DEFAULT false NOT NULL,
    push_enabled boolean DEFAULT true NOT NULL,
    notify_task boolean DEFAULT true NOT NULL,
    notify_comment boolean DEFAULT true NOT NULL,
    notify_chat boolean DEFAULT true NOT NULL,
    notify_call boolean DEFAULT true NOT NULL,
    notify_deal boolean DEFAULT true NOT NULL,
    notify_news boolean DEFAULT true NOT NULL,
    sound_enabled boolean DEFAULT true NOT NULL,
    novofon_extension text,
    default_task_assignee boolean DEFAULT false NOT NULL,
    default_task_curator boolean DEFAULT false NOT NULL,
    mobile_nav text[] DEFAULT '{}'::text[] NOT NULL,
    stock_access boolean DEFAULT false NOT NULL,
    calendar_timeline_pos text DEFAULT 'bottom'::text NOT NULL,
    calendar_timeline_size integer DEFAULT 420 NOT NULL,
    calendar_theme text DEFAULT 'classic'::text NOT NULL
);


--
-- Name: vk_group_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vk_group_settings (
    id text NOT NULL,
    group_id integer NOT NULL,
    access_token text NOT NULL,
    default_creator_id text,
    assignee_ids text[] DEFAULT ARRAY[]::text[],
    auto_create_contact boolean DEFAULT true NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_ts integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    callback_secret text,
    confirmation_string text,
    market_token text,
    market_app_id integer,
    market_app_secret text,
    auto_reply boolean DEFAULT false NOT NULL,
    market_refresh_token text,
    market_device_id text,
    market_token_expires_at timestamp(3) without time zone
);


--
-- Name: vpn_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vpn_settings (
    id text NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    subscription_url text NOT NULL,
    last_config_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: warehouses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.warehouses (
    id text NOT NULL,
    name text NOT NULL,
    location text,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: web_calls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.web_calls (
    id text NOT NULL,
    caller_id text NOT NULL,
    callee_id text NOT NULL,
    type text DEFAULT 'audio'::text NOT NULL,
    status text DEFAULT 'ringing'::text NOT NULL,
    answered_at timestamp(3) without time zone,
    ended_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: yandex_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.yandex_settings (
    id text NOT NULL,
    api_key text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: pskovline_plugin_accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pskovline_plugin_accounts ALTER COLUMN id SET DEFAULT nextval('public.pskovline_plugin_accounts_id_seq'::regclass);


--
-- Name: tasks ticket_number; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks ALTER COLUMN ticket_number SET DEFAULT nextval('public.tasks_ticket_number_seq'::regclass);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: accounting_email_settings accounting_email_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounting_email_settings
    ADD CONSTRAINT accounting_email_settings_pkey PRIMARY KEY (id);


--
-- Name: accounting_rules accounting_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounting_rules
    ADD CONSTRAINT accounting_rules_pkey PRIMARY KEY (id);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: auto_reply_settings auto_reply_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auto_reply_settings
    ADD CONSTRAINT auto_reply_settings_pkey PRIMARY KEY (id);


--
-- Name: auto_reply_triggers auto_reply_triggers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auto_reply_triggers
    ADD CONSTRAINT auto_reply_triggers_pkey PRIMARY KEY (id);


--
-- Name: bank_payments bank_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_payments
    ADD CONSTRAINT bank_payments_pkey PRIMARY KEY (id);


--
-- Name: beget_settings beget_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beget_settings
    ADD CONSTRAINT beget_settings_pkey PRIMARY KEY (id);


--
-- Name: branding branding_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branding
    ADD CONSTRAINT branding_pkey PRIMARY KEY (id);


--
-- Name: calls calls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calls
    ADD CONSTRAINT calls_pkey PRIMARY KEY (id);


--
-- Name: camera_settings camera_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.camera_settings
    ADD CONSTRAINT camera_settings_pkey PRIMARY KEY (id);


--
-- Name: chat_message_recipients chat_message_recipients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_message_recipients
    ADD CONSTRAINT chat_message_recipients_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_reactions chat_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_reactions
    ADD CONSTRAINT chat_reactions_pkey PRIMARY KEY (id);


--
-- Name: comments comments_max_message_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_max_message_id_key UNIQUE (max_message_id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: comments comments_vk_message_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_vk_message_id_key UNIQUE (vk_message_id);


--
-- Name: contact_accesses contact_accesses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_accesses
    ADD CONSTRAINT contact_accesses_pkey PRIMARY KEY (id);


--
-- Name: contact_projects contact_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_projects
    ADD CONSTRAINT contact_projects_pkey PRIMARY KEY (id);


--
-- Name: contact_types contact_types_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_types
    ADD CONSTRAINT contact_types_name_key UNIQUE (name);


--
-- Name: contact_types contact_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_types
    ADD CONSTRAINT contact_types_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_max_chat_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_max_chat_id_key UNIQUE (max_chat_id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_vk_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_vk_user_id_key UNIQUE (vk_user_id);


--
-- Name: dashboard_metric_settings dashboard_metric_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_metric_settings
    ADD CONSTRAINT dashboard_metric_settings_pkey PRIMARY KEY (id);


--
-- Name: deals deals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_pkey PRIMARY KEY (id);


--
-- Name: dgis_settings dgis_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dgis_settings
    ADD CONSTRAINT dgis_settings_pkey PRIMARY KEY (id);


--
-- Name: diadoc_plugin_settings diadoc_plugin_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diadoc_plugin_settings
    ADD CONSTRAINT diadoc_plugin_settings_pkey PRIMARY KEY (id);


--
-- Name: email_filter_logs email_filter_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_filter_logs
    ADD CONSTRAINT email_filter_logs_pkey PRIMARY KEY (id);


--
-- Name: email_filters email_filters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_filters
    ADD CONSTRAINT email_filters_pkey PRIMARY KEY (id);


--
-- Name: email_settings email_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_settings
    ADD CONSTRAINT email_settings_pkey PRIMARY KEY (id);


--
-- Name: file_attachments file_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_attachments
    ADD CONSTRAINT file_attachments_pkey PRIMARY KEY (id);


--
-- Name: file_tab_settings file_tab_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_tab_settings
    ADD CONSTRAINT file_tab_settings_pkey PRIMARY KEY (id);


--
-- Name: finance_documents finance_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_documents
    ADD CONSTRAINT finance_documents_pkey PRIMARY KEY (id);


--
-- Name: handler_settings handler_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.handler_settings
    ADD CONSTRAINT handler_settings_pkey PRIMARY KEY (id);


--
-- Name: help_articles help_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.help_articles
    ADD CONSTRAINT help_articles_pkey PRIMARY KEY (id);


--
-- Name: legal_documents legal_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_documents
    ADD CONSTRAINT legal_documents_pkey PRIMARY KEY (id);


--
-- Name: login_slides login_slides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_slides
    ADD CONSTRAINT login_slides_pkey PRIMARY KEY (id);


--
-- Name: max_settings max_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.max_settings
    ADD CONSTRAINT max_settings_pkey PRIMARY KEY (id);


--
-- Name: max_user_chats max_user_chats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.max_user_chats
    ADD CONSTRAINT max_user_chats_pkey PRIMARY KEY (id);


--
-- Name: news_categories news_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_categories
    ADD CONSTRAINT news_categories_pkey PRIMARY KEY (id);


--
-- Name: news_comments news_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_comments
    ADD CONSTRAINT news_comments_pkey PRIMARY KEY (id);


--
-- Name: news_history news_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_history
    ADD CONSTRAINT news_history_pkey PRIMARY KEY (id);


--
-- Name: news news_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_pkey PRIMARY KEY (id);


--
-- Name: news_reactions news_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_reactions
    ADD CONSTRAINT news_reactions_pkey PRIMARY KEY (id);


--
-- Name: news_subcategories news_subcategories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_subcategories
    ADD CONSTRAINT news_subcategories_pkey PRIMARY KEY (id);


--
-- Name: news_tags news_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_tags
    ADD CONSTRAINT news_tags_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: onec_plugin_settings onec_plugin_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onec_plugin_settings
    ADD CONSTRAINT onec_plugin_settings_pkey PRIMARY KEY (id);


--
-- Name: onec_sync_lock onec_sync_lock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onec_sync_lock
    ADD CONSTRAINT onec_sync_lock_pkey PRIMARY KEY (id);


--
-- Name: ozon_seller_settings ozon_seller_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ozon_seller_settings
    ADD CONSTRAINT ozon_seller_settings_pkey PRIMARY KEY (id);


--
-- Name: price_history price_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_history
    ADD CONSTRAINT price_history_pkey PRIMARY KEY (id);


--
-- Name: price_types price_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_types
    ADD CONSTRAINT price_types_pkey PRIMARY KEY (id);


--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);


--
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--
-- Name: product_prices product_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_prices
    ADD CONSTRAINT product_prices_pkey PRIMARY KEY (id);


--
-- Name: product_subscriptions product_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_subscriptions
    ADD CONSTRAINT product_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: project_users project_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_users
    ADD CONSTRAINT project_users_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: promo_blocks promo_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_blocks
    ADD CONSTRAINT promo_blocks_pkey PRIMARY KEY (id);


--
-- Name: pskovline_balances pskovline_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pskovline_balances
    ADD CONSTRAINT pskovline_balances_pkey PRIMARY KEY (id);


--
-- Name: pskovline_plugin_accounts pskovline_plugin_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pskovline_plugin_accounts
    ADD CONSTRAINT pskovline_plugin_accounts_pkey PRIMARY KEY (id);


--
-- Name: pskovline_plugin_settings pskovline_plugin_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pskovline_plugin_settings
    ADD CONSTRAINT pskovline_plugin_settings_pkey PRIMARY KEY (id);


--
-- Name: pskovline_settings pskovline_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pskovline_settings
    ADD CONSTRAINT pskovline_settings_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: reminder_recipients reminder_recipients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder_recipients
    ADD CONSTRAINT reminder_recipients_pkey PRIMARY KEY (id);


--
-- Name: reminders reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_pkey PRIMARY KEY (id);


--
-- Name: reservation_items reservation_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservation_items
    ADD CONSTRAINT reservation_items_pkey PRIMARY KEY (id);


--
-- Name: reservations reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sale_items sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);


--
-- Name: sales sales_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_number_key UNIQUE (number);


--
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- Name: schedule_appointments schedule_appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_appointments
    ADD CONSTRAINT schedule_appointments_pkey PRIMARY KEY (id);


--
-- Name: schedule_rooms schedule_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_rooms
    ADD CONSTRAINT schedule_rooms_pkey PRIMARY KEY (id);


--
-- Name: schedule_settings schedule_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_settings
    ADD CONSTRAINT schedule_settings_pkey PRIMARY KEY (id);


--
-- Name: schedule_shift_templates schedule_shift_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_shift_templates
    ADD CONSTRAINT schedule_shift_templates_pkey PRIMARY KEY (id);


--
-- Name: schedule_shifts schedule_shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_shifts
    ADD CONSTRAINT schedule_shifts_pkey PRIMARY KEY (id);


--
-- Name: seo_settings seo_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_settings
    ADD CONSTRAINT seo_settings_pkey PRIMARY KEY (id);


--
-- Name: sms_messages sms_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_messages
    ADD CONSTRAINT sms_messages_pkey PRIMARY KEY (id);


--
-- Name: statuses statuses_entity_type_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.statuses
    ADD CONSTRAINT statuses_entity_type_name_key UNIQUE (entity_type, name);


--
-- Name: statuses statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.statuses
    ADD CONSTRAINT statuses_pkey PRIMARY KEY (id);


--
-- Name: stock_balances stock_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_balances
    ADD CONSTRAINT stock_balances_pkey PRIMARY KEY (id);


--
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- Name: task_assignees task_assignees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_assignees
    ADD CONSTRAINT task_assignees_pkey PRIMARY KEY (id);


--
-- Name: task_curators task_curators_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_curators
    ADD CONSTRAINT task_curators_pkey PRIMARY KEY (id);


--
-- Name: task_curators task_curators_taskId_userId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_curators
    ADD CONSTRAINT "task_curators_taskId_userId_key" UNIQUE ("taskId", "userId");


--
-- Name: task_history task_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_history
    ADD CONSTRAINT task_history_pkey PRIMARY KEY (id);


--
-- Name: task_transactions task_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_transactions
    ADD CONSTRAINT task_transactions_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_max_message_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_max_message_id_key UNIQUE (max_message_id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_vk_message_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_vk_message_id_key UNIQUE (vk_message_id);


--
-- Name: telegram_settings telegram_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_settings
    ADD CONSTRAINT telegram_settings_pkey PRIMARY KEY (id);


--
-- Name: telegram_user_chat telegram_user_chat_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_user_chat
    ADD CONSTRAINT telegram_user_chat_pkey PRIMARY KEY (id);


--
-- Name: telephony_settings telephony_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telephony_settings
    ADD CONSTRAINT telephony_settings_pkey PRIMARY KEY (id);


--
-- Name: tenant_ticket_attachments tenant_ticket_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_ticket_attachments
    ADD CONSTRAINT tenant_ticket_attachments_pkey PRIMARY KEY (id);


--
-- Name: tenant_ticket_messages tenant_ticket_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_ticket_messages
    ADD CONSTRAINT tenant_ticket_messages_pkey PRIMARY KEY (id);


--
-- Name: tenant_tickets tenant_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_tickets
    ADD CONSTRAINT tenant_tickets_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tochka_acquiring_payments tochka_acquiring_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tochka_acquiring_payments
    ADD CONSTRAINT tochka_acquiring_payments_pkey PRIMARY KEY (id);


--
-- Name: tochka_acquiring_settings tochka_acquiring_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tochka_acquiring_settings
    ADD CONSTRAINT tochka_acquiring_settings_pkey PRIMARY KEY (id);


--
-- Name: tochka_plugin_settings tochka_plugin_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tochka_plugin_settings
    ADD CONSTRAINT tochka_plugin_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vk_group_settings vk_group_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vk_group_settings
    ADD CONSTRAINT vk_group_settings_pkey PRIMARY KEY (id);


--
-- Name: vpn_settings vpn_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vpn_settings
    ADD CONSTRAINT vpn_settings_pkey PRIMARY KEY (id);


--
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- Name: web_calls web_calls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.web_calls
    ADD CONSTRAINT web_calls_pkey PRIMARY KEY (id);


--
-- Name: yandex_settings yandex_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yandex_settings
    ADD CONSTRAINT yandex_settings_pkey PRIMARY KEY (id);


--
-- Name: _NewsToNewsTag_AB_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "_NewsToNewsTag_AB_unique" ON public."_NewsToNewsTag" USING btree ("A", "B");


--
-- Name: _NewsToNewsTag_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_NewsToNewsTag_B_index" ON public."_NewsToNewsTag" USING btree ("B");


--
-- Name: accounting_rules_sort_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounting_rules_sort_order_idx ON public.accounting_rules USING btree (sort_order);


--
-- Name: bank_payments_account_id_payment_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX bank_payments_account_id_payment_id_key ON public.bank_payments USING btree (account_id, payment_id);


--
-- Name: bank_payments_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bank_payments_date_idx ON public.bank_payments USING btree (date);


--
-- Name: calls_call_start_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX calls_call_start_idx ON public.calls USING btree (call_start);


--
-- Name: calls_caller_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX calls_caller_id_idx ON public.calls USING btree (caller_id);


--
-- Name: calls_contact_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX calls_contact_id_idx ON public.calls USING btree (contact_id);


--
-- Name: calls_direction_disposition_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX calls_direction_disposition_idx ON public.calls USING btree (direction, disposition);


--
-- Name: calls_pbx_call_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX calls_pbx_call_id_key ON public.calls USING btree (pbx_call_id);


--
-- Name: chat_message_recipients_message_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_message_recipients_message_id_idx ON public.chat_message_recipients USING btree (message_id);


--
-- Name: chat_message_recipients_message_id_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX chat_message_recipients_message_id_user_id_key ON public.chat_message_recipients USING btree (message_id, user_id);


--
-- Name: chat_message_recipients_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_message_recipients_user_id_idx ON public.chat_message_recipients USING btree (user_id);


--
-- Name: chat_messages_deleted_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_messages_deleted_at_idx ON public.chat_messages USING btree (deleted_at);


--
-- Name: chat_messages_reply_to_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_messages_reply_to_id_idx ON public.chat_messages USING btree (reply_to_id);


--
-- Name: chat_reactions_message_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_reactions_message_id_idx ON public.chat_reactions USING btree (message_id);


--
-- Name: chat_reactions_message_id_user_id_emoji_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX chat_reactions_message_id_user_id_emoji_key ON public.chat_reactions USING btree (message_id, user_id, emoji);


--
-- Name: chat_reactions_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_reactions_user_id_idx ON public.chat_reactions USING btree (user_id);


--
-- Name: comments_telegram_message_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX comments_telegram_message_id_key ON public.comments USING btree (telegram_message_id);


--
-- Name: contact_accesses_contact_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contact_accesses_contact_id_idx ON public.contact_accesses USING btree (contact_id);


--
-- Name: contact_projects_contact_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contact_projects_contact_id_idx ON public.contact_projects USING btree (contact_id);


--
-- Name: contact_projects_contact_id_project_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX contact_projects_contact_id_project_id_key ON public.contact_projects USING btree (contact_id, project_id);


--
-- Name: contact_projects_project_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contact_projects_project_id_idx ON public.contact_projects USING btree (project_id);


--
-- Name: contacts_onec_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contacts_onec_id_idx ON public.contacts USING btree (onec_id);


--
-- Name: dashboard_metric_settings_user_id_metric_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX dashboard_metric_settings_user_id_metric_key_key ON public.dashboard_metric_settings USING btree (user_id, metric_key);


--
-- Name: deals_status_changed_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX deals_status_changed_at_idx ON public.deals USING btree (status_changed_at);


--
-- Name: email_filter_logs_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX email_filter_logs_created_at_idx ON public.email_filter_logs USING btree (created_at);


--
-- Name: email_filters_sort_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX email_filters_sort_order_idx ON public.email_filters USING btree (sort_order);


--
-- Name: file_attachments_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "file_attachments_entityType_entityId_idx" ON public.file_attachments USING btree ("entityType", "entityId");


--
-- Name: file_tab_settings_tab_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX file_tab_settings_tab_key_key ON public.file_tab_settings USING btree (tab_key);


--
-- Name: finance_documents_contact_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_documents_contact_id_idx ON public.finance_documents USING btree (contact_id);


--
-- Name: finance_documents_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_documents_date_idx ON public.finance_documents USING btree (date);


--
-- Name: finance_documents_email_message_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX finance_documents_email_message_id_key ON public.finance_documents USING btree (email_message_id);


--
-- Name: finance_documents_match_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_documents_match_status_idx ON public.finance_documents USING btree (match_status);


--
-- Name: finance_documents_task_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_documents_task_id_idx ON public.finance_documents USING btree (task_id);


--
-- Name: finance_documents_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_documents_type_idx ON public.finance_documents USING btree (type);


--
-- Name: help_articles_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX help_articles_slug_key ON public.help_articles USING btree (slug);


--
-- Name: max_user_chats_chat_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX max_user_chats_chat_id_key ON public.max_user_chats USING btree (chat_id);


--
-- Name: news_authorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "news_authorId_idx" ON public.news USING btree ("authorId");


--
-- Name: news_categories_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX news_categories_slug_key ON public.news_categories USING btree (slug);


--
-- Name: news_categoryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "news_categoryId_idx" ON public.news USING btree ("categoryId");


--
-- Name: news_comments_news_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX news_comments_news_id_created_at_idx ON public.news_comments USING btree (news_id, created_at);


--
-- Name: news_history_news_id_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "news_history_news_id_createdAt_idx" ON public.news_history USING btree (news_id, "createdAt");


--
-- Name: news_is_published_published_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX news_is_published_published_at_idx ON public.news USING btree (is_published, published_at);


--
-- Name: news_reactions_news_id_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX news_reactions_news_id_user_id_key ON public.news_reactions USING btree (news_id, user_id);


--
-- Name: news_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX news_slug_key ON public.news USING btree (slug);


--
-- Name: news_subcategories_slug_categoryId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "news_subcategories_slug_categoryId_key" ON public.news_subcategories USING btree (slug, "categoryId");


--
-- Name: news_subcategories_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX news_subcategories_slug_key ON public.news_subcategories USING btree (slug);


--
-- Name: news_tags_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX news_tags_name_key ON public.news_tags USING btree (name);


--
-- Name: news_tags_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX news_tags_slug_key ON public.news_tags USING btree (slug);


--
-- Name: notes_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notes_created_at_idx ON public.notes USING btree (created_at);


--
-- Name: notes_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notes_user_id_idx ON public.notes USING btree (user_id);


--
-- Name: notifications_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_created_at_idx ON public.notifications USING btree (created_at);


--
-- Name: notifications_user_id_read_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_user_id_read_at_idx ON public.notifications USING btree (user_id, read_at);


--
-- Name: price_history_product_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX price_history_product_id_created_at_idx ON public.price_history USING btree (product_id, created_at);


--
-- Name: price_types_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX price_types_name_key ON public.price_types USING btree (name);


--
-- Name: product_categories_onec_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX product_categories_onec_id_key ON public.product_categories USING btree (onec_id);


--
-- Name: product_categories_parent_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_categories_parent_id_idx ON public.product_categories USING btree (parent_id);


--
-- Name: product_images_product_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_images_product_id_idx ON public.product_images USING btree (product_id);


--
-- Name: product_prices_product_id_price_type_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX product_prices_product_id_price_type_id_key ON public.product_prices USING btree (product_id, price_type_id);


--
-- Name: product_subscriptions_contact_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_subscriptions_contact_id_idx ON public.product_subscriptions USING btree (contact_id);


--
-- Name: product_subscriptions_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX product_subscriptions_number_key ON public.product_subscriptions USING btree (number);


--
-- Name: product_subscriptions_product_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_subscriptions_product_id_idx ON public.product_subscriptions USING btree (product_id);


--
-- Name: products_article_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX products_article_key ON public.products USING btree (article);


--
-- Name: products_category_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_category_id_idx ON public.products USING btree (category_id);


--
-- Name: products_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_category_idx ON public.products USING btree (category);


--
-- Name: products_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_name_idx ON public.products USING btree (name);


--
-- Name: products_onec_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX products_onec_id_key ON public.products USING btree (onec_id);


--
-- Name: products_ozon_product_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX products_ozon_product_id_key ON public.products USING btree (ozon_product_id);


--
-- Name: products_sku_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX products_sku_key ON public.products USING btree (sku);


--
-- Name: products_vk_item_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX products_vk_item_id_key ON public.products USING btree (vk_item_id);


--
-- Name: project_users_project_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX project_users_project_id_idx ON public.project_users USING btree (project_id);


--
-- Name: project_users_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX project_users_user_id_idx ON public.project_users USING btree (user_id);


--
-- Name: project_users_user_id_project_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX project_users_user_id_project_id_key ON public.project_users USING btree (user_id, project_id);


--
-- Name: projects_status_changed_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX projects_status_changed_at_idx ON public.projects USING btree (status_changed_at);


--
-- Name: push_subscriptions_endpoint_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX push_subscriptions_endpoint_key ON public.push_subscriptions USING btree (endpoint);


--
-- Name: reminder_recipients_reminder_id_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX reminder_recipients_reminder_id_user_id_key ON public.reminder_recipients USING btree (reminder_id, user_id);


--
-- Name: reminders_remind_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reminders_remind_at_idx ON public.reminders USING btree (remind_at);


--
-- Name: reminders_status_changed_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reminders_status_changed_at_idx ON public.reminders USING btree (status_changed_at);


--
-- Name: reminders_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reminders_user_id_idx ON public.reminders USING btree (user_id);


--
-- Name: reservations_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX reservations_number_key ON public.reservations USING btree (number);


--
-- Name: roles_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);


--
-- Name: sale_items_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sale_items_productId_idx" ON public.sale_items USING btree ("productId");


--
-- Name: sale_items_saleId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sale_items_saleId_idx" ON public.sale_items USING btree ("saleId");


--
-- Name: sales_contactId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sales_contactId_idx" ON public.sales USING btree ("contactId");


--
-- Name: sales_warehouseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sales_warehouseId_idx" ON public.sales USING btree ("warehouseId");


--
-- Name: schedule_appointments_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX schedule_appointments_date_idx ON public.schedule_appointments USING btree (date);


--
-- Name: schedule_appointments_user_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX schedule_appointments_user_id_date_idx ON public.schedule_appointments USING btree (user_id, date);


--
-- Name: schedule_shift_templates_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX schedule_shift_templates_user_id_idx ON public.schedule_shift_templates USING btree (user_id);


--
-- Name: schedule_shifts_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX schedule_shifts_date_idx ON public.schedule_shifts USING btree (date);


--
-- Name: schedule_shifts_template_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX schedule_shifts_template_id_date_idx ON public.schedule_shifts USING btree (template_id, date);


--
-- Name: schedule_shifts_user_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX schedule_shifts_user_id_date_idx ON public.schedule_shifts USING btree (user_id, date);


--
-- Name: sms_messages_contact_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sms_messages_contact_id_idx ON public.sms_messages USING btree (contact_id);


--
-- Name: sms_messages_from_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sms_messages_from_idx ON public.sms_messages USING btree ("from");


--
-- Name: sms_messages_received_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sms_messages_received_at_idx ON public.sms_messages USING btree (received_at);


--
-- Name: sms_messages_task_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sms_messages_task_id_idx ON public.sms_messages USING btree (task_id);


--
-- Name: statuses_auto_change_enabled_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX statuses_auto_change_enabled_idx ON public.statuses USING btree (auto_change_enabled);


--
-- Name: statuses_entity_type_sort_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX statuses_entity_type_sort_order_idx ON public.statuses USING btree (entity_type, sort_order);


--
-- Name: stock_balances_product_id_warehouse_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX stock_balances_product_id_warehouse_id_key ON public.stock_balances USING btree (product_id, warehouse_id);


--
-- Name: stock_balances_warehouse_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX stock_balances_warehouse_id_idx ON public.stock_balances USING btree (warehouse_id);


--
-- Name: stock_movements_product_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX stock_movements_product_id_date_idx ON public.stock_movements USING btree (product_id, date);


--
-- Name: stock_movements_warehouse_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX stock_movements_warehouse_id_date_idx ON public.stock_movements USING btree (warehouse_id, date);


--
-- Name: task_assignees_taskId_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "task_assignees_taskId_userId_idx" ON public.task_assignees USING btree ("taskId", "userId");


--
-- Name: task_assignees_taskId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "task_assignees_taskId_userId_key" ON public.task_assignees USING btree ("taskId", "userId");


--
-- Name: task_assignees_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "task_assignees_userId_idx" ON public.task_assignees USING btree ("userId");


--
-- Name: task_curators_taskId_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "task_curators_taskId_userId_idx" ON public.task_curators USING btree ("taskId", "userId");


--
-- Name: task_curators_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "task_curators_userId_idx" ON public.task_curators USING btree ("userId");


--
-- Name: task_history_task_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX task_history_task_id_created_at_idx ON public.task_history USING btree (task_id, created_at);


--
-- Name: task_transactions_task_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX task_transactions_task_id_date_idx ON public.task_transactions USING btree (task_id, date);


--
-- Name: tasks_contactId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "tasks_contactId_idx" ON public.tasks USING btree ("contactId");


--
-- Name: tasks_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "tasks_createdAt_idx" ON public.tasks USING btree ("createdAt");


--
-- Name: tasks_creatorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "tasks_creatorId_idx" ON public.tasks USING btree ("creatorId");


--
-- Name: tasks_emailMessageId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "tasks_emailMessageId_key" ON public.tasks USING btree ("emailMessageId");


--
-- Name: tasks_parent_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_parent_id_idx ON public.tasks USING btree (parent_id);


--
-- Name: tasks_price_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_price_idx ON public.tasks USING btree (price);


--
-- Name: tasks_projectId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "tasks_projectId_idx" ON public.tasks USING btree ("projectId");


--
-- Name: tasks_status_changed_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_status_changed_at_idx ON public.tasks USING btree (status_changed_at);


--
-- Name: tasks_status_dueDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "tasks_status_dueDate_idx" ON public.tasks USING btree (status, "dueDate");


--
-- Name: tasks_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_status_idx ON public.tasks USING btree (status);


--
-- Name: tasks_support_owner_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_support_owner_id_idx ON public.tasks USING btree (support_owner_id);


--
-- Name: tasks_telegram_message_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tasks_telegram_message_id_key ON public.tasks USING btree (telegram_message_id);


--
-- Name: tasks_ticket_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tasks_ticket_number_key ON public.tasks USING btree (ticket_number);


--
-- Name: telegram_user_chat_chat_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX telegram_user_chat_chat_id_key ON public.telegram_user_chat USING btree (chat_id);


--
-- Name: tenant_ticket_attachments_message_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_ticket_attachments_message_id_idx ON public.tenant_ticket_attachments USING btree (message_id);


--
-- Name: tenant_ticket_attachments_ticket_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_ticket_attachments_ticket_id_idx ON public.tenant_ticket_attachments USING btree (ticket_id);


--
-- Name: tenant_ticket_messages_ticket_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_ticket_messages_ticket_id_idx ON public.tenant_ticket_messages USING btree (ticket_id);


--
-- Name: tenant_tickets_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_tickets_status_idx ON public.tenant_tickets USING btree (status);


--
-- Name: tenant_tickets_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_tickets_tenant_id_idx ON public.tenant_tickets USING btree (tenant_id);


--
-- Name: tenants_db_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tenants_db_name_key ON public.tenants USING btree (db_name);


--
-- Name: tenants_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tenants_slug_key ON public.tenants USING btree (slug);


--
-- Name: tochka_acquiring_payments_order_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tochka_acquiring_payments_order_id_key ON public.tochka_acquiring_payments USING btree (order_id);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: web_calls_callee_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX web_calls_callee_id_created_at_idx ON public.web_calls USING btree (callee_id, created_at);


--
-- Name: web_calls_caller_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX web_calls_caller_id_created_at_idx ON public.web_calls USING btree (caller_id, created_at);


--
-- Name: web_calls_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX web_calls_status_idx ON public.web_calls USING btree (status);


--
-- Name: _NewsToNewsTag _NewsToNewsTag_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_NewsToNewsTag"
    ADD CONSTRAINT "_NewsToNewsTag_A_fkey" FOREIGN KEY ("A") REFERENCES public.news(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _NewsToNewsTag _NewsToNewsTag_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_NewsToNewsTag"
    ADD CONSTRAINT "_NewsToNewsTag_B_fkey" FOREIGN KEY ("B") REFERENCES public.news_tags(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: accounting_rules accounting_rules_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounting_rules
    ADD CONSTRAINT accounting_rules_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activities activities_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activities activities_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: auto_reply_settings auto_reply_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auto_reply_settings
    ADD CONSTRAINT auto_reply_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: auto_reply_triggers auto_reply_triggers_settings_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auto_reply_triggers
    ADD CONSTRAINT auto_reply_triggers_settings_id_fkey FOREIGN KEY (settings_id) REFERENCES public.auto_reply_settings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: calls calls_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calls
    ADD CONSTRAINT calls_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: calls calls_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calls
    ADD CONSTRAINT calls_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: chat_message_recipients chat_message_recipients_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_message_recipients
    ADD CONSTRAINT chat_message_recipients_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_message_recipients chat_message_recipients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_message_recipients
    ADD CONSTRAINT chat_message_recipients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT "chat_messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: chat_messages chat_messages_reply_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_reply_to_id_fkey FOREIGN KEY (reply_to_id) REFERENCES public.chat_messages(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: chat_reactions chat_reactions_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_reactions
    ADD CONSTRAINT chat_reactions_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_reactions chat_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_reactions
    ADD CONSTRAINT chat_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: comments comments_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "comments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contact_accesses contact_accesses_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_accesses
    ADD CONSTRAINT contact_accesses_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contact_projects contact_projects_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_projects
    ADD CONSTRAINT contact_projects_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contact_projects contact_projects_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_projects
    ADD CONSTRAINT contact_projects_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contacts contacts_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: dashboard_metric_settings dashboard_metric_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_metric_settings
    ADD CONSTRAINT dashboard_metric_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: deals deals_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT "deals_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: deals deals_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT "deals_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: email_filter_logs email_filter_logs_filter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_filter_logs
    ADD CONSTRAINT email_filter_logs_filter_id_fkey FOREIGN KEY (filter_id) REFERENCES public.email_filters(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: email_filters email_filters_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_filters
    ADD CONSTRAINT email_filters_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: file_attachments file_attachments_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_attachments
    ADD CONSTRAINT "file_attachments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: finance_documents finance_documents_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_documents
    ADD CONSTRAINT finance_documents_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: finance_documents finance_documents_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_documents
    ADD CONSTRAINT finance_documents_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: finance_documents finance_documents_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_documents
    ADD CONSTRAINT finance_documents_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: handler_settings handler_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.handler_settings
    ADD CONSTRAINT handler_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: max_settings max_settings_default_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.max_settings
    ADD CONSTRAINT max_settings_default_creator_id_fkey FOREIGN KEY (default_creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: max_user_chats max_user_chats_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.max_user_chats
    ADD CONSTRAINT max_user_chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: news news_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT "news_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: news news_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT "news_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.news_categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: news_comments news_comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_comments
    ADD CONSTRAINT news_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: news_comments news_comments_news_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_comments
    ADD CONSTRAINT news_comments_news_id_fkey FOREIGN KEY (news_id) REFERENCES public.news(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: news_history news_history_news_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_history
    ADD CONSTRAINT news_history_news_id_fkey FOREIGN KEY (news_id) REFERENCES public.news(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: news_reactions news_reactions_news_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_reactions
    ADD CONSTRAINT news_reactions_news_id_fkey FOREIGN KEY (news_id) REFERENCES public.news(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: news_reactions news_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_reactions
    ADD CONSTRAINT news_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: news_subcategories news_subcategories_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_subcategories
    ADD CONSTRAINT "news_subcategories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.news_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: news news_subcategoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT "news_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES public.news_subcategories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notes notes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: price_history price_history_price_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_history
    ADD CONSTRAINT price_history_price_type_id_fkey FOREIGN KEY (price_type_id) REFERENCES public.price_types(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: price_history price_history_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_history
    ADD CONSTRAINT price_history_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: price_history price_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_history
    ADD CONSTRAINT price_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: product_categories product_categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.product_categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: product_images product_images_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_prices product_prices_price_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_prices
    ADD CONSTRAINT product_prices_price_type_id_fkey FOREIGN KEY (price_type_id) REFERENCES public.price_types(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_prices product_prices_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_prices
    ADD CONSTRAINT product_prices_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_subscriptions product_subscriptions_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_subscriptions
    ADD CONSTRAINT product_subscriptions_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: product_subscriptions product_subscriptions_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_subscriptions
    ADD CONSTRAINT product_subscriptions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_subscriptions product_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_subscriptions
    ADD CONSTRAINT product_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.product_categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: project_users project_users_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_users
    ADD CONSTRAINT project_users_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_users project_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_users
    ADD CONSTRAINT project_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: projects projects_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: push_subscriptions push_subscriptions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reminder_recipients reminder_recipients_reminder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder_recipients
    ADD CONSTRAINT reminder_recipients_reminder_id_fkey FOREIGN KEY (reminder_id) REFERENCES public.reminders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reminder_recipients reminder_recipients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder_recipients
    ADD CONSTRAINT reminder_recipients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reminders reminders_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.statuses(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reminders reminders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reservation_items reservation_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservation_items
    ADD CONSTRAINT reservation_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reservation_items reservation_items_reservation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservation_items
    ADD CONSTRAINT reservation_items_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reservations reservations_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reservations reservations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reservations reservations_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: schedule_appointments schedule_appointments_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_appointments
    ADD CONSTRAINT schedule_appointments_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: schedule_appointments schedule_appointments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_appointments
    ADD CONSTRAINT schedule_appointments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: schedule_shift_templates schedule_shift_templates_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_shift_templates
    ADD CONSTRAINT schedule_shift_templates_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.schedule_rooms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: schedule_shift_templates schedule_shift_templates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_shift_templates
    ADD CONSTRAINT schedule_shift_templates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: schedule_shifts schedule_shifts_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_shifts
    ADD CONSTRAINT schedule_shifts_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.schedule_rooms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: schedule_shifts schedule_shifts_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_shifts
    ADD CONSTRAINT schedule_shifts_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.schedule_shift_templates(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: schedule_shifts schedule_shifts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_shifts
    ADD CONSTRAINT schedule_shifts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sms_messages sms_messages_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_messages
    ADD CONSTRAINT sms_messages_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sms_messages sms_messages_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_messages
    ADD CONSTRAINT sms_messages_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: statuses statuses_auto_change_to_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.statuses
    ADD CONSTRAINT statuses_auto_change_to_status_id_fkey FOREIGN KEY (auto_change_to_status_id) REFERENCES public.statuses(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stock_balances stock_balances_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_balances
    ADD CONSTRAINT stock_balances_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_balances stock_balances_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_balances
    ADD CONSTRAINT stock_balances_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_movements stock_movements_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_movements stock_movements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stock_movements stock_movements_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_assignees task_assignees_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_assignees
    ADD CONSTRAINT "task_assignees_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_assignees task_assignees_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_assignees
    ADD CONSTRAINT "task_assignees_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_curators task_curators_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_curators
    ADD CONSTRAINT "task_curators_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_curators task_curators_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_curators
    ADD CONSTRAINT "task_curators_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_history task_history_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_history
    ADD CONSTRAINT task_history_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_history task_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_history
    ADD CONSTRAINT task_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: task_transactions task_transactions_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_transactions
    ADD CONSTRAINT task_transactions_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tasks tasks_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tasks tasks_dealId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES public.deals(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: telegram_settings telegram_settings_default_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_settings
    ADD CONSTRAINT telegram_settings_default_creator_id_fkey FOREIGN KEY (default_creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: telegram_settings telegram_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_settings
    ADD CONSTRAINT telegram_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: telegram_user_chat telegram_user_chat_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_user_chat
    ADD CONSTRAINT telegram_user_chat_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: telephony_settings telephony_settings_default_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telephony_settings
    ADD CONSTRAINT telephony_settings_default_user_id_fkey FOREIGN KEY (default_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tenant_ticket_attachments tenant_ticket_attachments_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_ticket_attachments
    ADD CONSTRAINT tenant_ticket_attachments_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.tenant_ticket_messages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tenant_ticket_attachments tenant_ticket_attachments_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_ticket_attachments
    ADD CONSTRAINT tenant_ticket_attachments_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tenant_tickets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tochka_acquiring_payments tochka_acquiring_payments_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tochka_acquiring_payments
    ADD CONSTRAINT tochka_acquiring_payments_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: vk_group_settings vk_group_settings_default_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vk_group_settings
    ADD CONSTRAINT vk_group_settings_default_creator_id_fkey FOREIGN KEY (default_creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: web_calls web_calls_callee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.web_calls
    ADD CONSTRAINT web_calls_callee_id_fkey FOREIGN KEY (callee_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: web_calls web_calls_caller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.web_calls
    ADD CONSTRAINT web_calls_caller_id_fkey FOREIGN KEY (caller_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict pKAmW6DXPfAnGF1RYkvzSMNbjSVNKappNazI6ejvahu5w2Qe5xHBQhmhk7JE3IS

--
-- PostgreSQL database dump
--

\restrict IudId30unGp84YkQToBGbIMYqPZpaZlwby0fEMw6RLGRTFFcM4wCkDU8gqQUeEQ

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public._prisma_migrations VALUES ('43373dfb-9052-411c-a07f-3719ef503f38', '43e538a62ff509e4f764b41ca0172d0f9d76e51faaaed863bab5c7eb16c221c5', '2026-08-28 03:47:24.363278+00', '20260823224514_init', NULL, NULL, '2026-08-28 03:47:24.302112+00', 1);
INSERT INTO public._prisma_migrations VALUES ('9b79c3f3-e6e5-44b5-b59c-8007d8ff0c7d', '6d7b01e72d66ab4337b1bee50c1c642d6a5d139a857a0bec021561758a23cfed', '2026-08-28 03:47:24.494802+00', '20260827110000_add_parent_id', NULL, NULL, '2026-08-28 03:47:24.488677+00', 1);
INSERT INTO public._prisma_migrations VALUES ('771b21f5-e945-4d0e-85b6-6fa47c9dae8b', 'c6b03e4d7af6f0d95ebb6cb6a53d402aedf763e1826ce0389e6c7dc87f030596', '2026-08-28 03:47:24.377162+00', '20260824000000_add_roles', NULL, NULL, '2026-08-28 03:47:24.363962+00', 1);
INSERT INTO public._prisma_migrations VALUES ('f8d823fa-851d-408c-bb01-a6fb33487c02', '75b7a317b567d93902bbb064ad6d5c29a706f62c01dcc7a76fa4dfa2e71fc8c5', '2026-08-28 03:47:24.391682+00', '20260824150825_multi_assignee', NULL, NULL, '2026-08-28 03:47:24.377812+00', 1);
INSERT INTO public._prisma_migrations VALUES ('b342c6f0-5e3d-4eeb-8619-d4faa34530bb', '7111e9ee5be440013341be7db6c23462007c0e35e5b8616388e35002061c7d43', '2026-08-29 10:03:47.356704+00', '20250829130000_add_pskovline_balance', NULL, NULL, '2026-08-29 10:03:47.33472+00', 1);
INSERT INTO public._prisma_migrations VALUES ('a605ef2d-75dd-44e3-b97f-b5a200330efb', '7fcecefef0445e6221b9707736fdf9b933f073f8cc9d303eb967f4ecf1616fb1', '2026-08-28 03:47:24.410496+00', '20260824162843_push_notifications', NULL, NULL, '2026-08-28 03:47:24.392484+00', 1);
INSERT INTO public._prisma_migrations VALUES ('019d7fb7-3c2f-4231-9e26-e1ab580b381e', '892eb02357dfa10a8d4deb9929a301d3d595f0a6917a1aa403b9323cf5b9ecf5', '2026-08-28 03:47:24.498545+00', '20260827160000_add_role_pages', NULL, NULL, '2026-08-28 03:47:24.495506+00', 1);
INSERT INTO public._prisma_migrations VALUES ('e4e6a872-db12-46c0-8511-e9ad7f4c6b13', '01bd3f5dc826fb6a72823fd2f21a28e9a878875efafb74345526afa39cd5ea95', '2026-08-28 03:47:24.415002+00', '20260824230000_add_email_fields', NULL, NULL, '2026-08-28 03:47:24.411136+00', 1);
INSERT INTO public._prisma_migrations VALUES ('2af7906e-5ce3-416d-9ed4-6eba7437a41d', 'b4b9013e9166e6333b4efe0950f9ab0f0110cc31fca31a4ba46470d00c339ec3', '2026-08-28 03:47:24.422035+00', '20260824235000_add_email_settings', NULL, NULL, '2026-08-28 03:47:24.415621+00', 1);
INSERT INTO public._prisma_migrations VALUES ('04972506-af10-44ca-b147-de829cbb5bbb', '5a7843b7d519e39228bef1e98ae1785800293afc159be43751c6fd10cfaa90cf', '2026-08-28 03:47:24.425816+00', '20260824240000_add_email_tls_options', NULL, NULL, '2026-08-28 03:47:24.422787+00', 1);
INSERT INTO public._prisma_migrations VALUES ('1fb92ed9-8599-453f-a7a4-2e37e3e74d56', '330755a7c53b2d5b8bfd007c4886b365c6da50004a8700ee16d9cacab0f7cd3a', '2026-08-28 03:47:24.514051+00', '20260827170000_add_notifications', NULL, NULL, '2026-08-28 03:47:24.499099+00', 1);
INSERT INTO public._prisma_migrations VALUES ('e70d03d1-0c1b-49ff-8e56-699a753e8228', '436da7eceea50d6dfa9a1b3af022835a1244fd240c15f717692b62331525c371', '2026-08-28 03:47:24.428951+00', '20260824241000_add_require_tls', NULL, NULL, '2026-08-28 03:47:24.426454+00', 1);
INSERT INTO public._prisma_migrations VALUES ('0e5d7074-d89a-4b27-b6f5-a9cd1f0d2acb', '698f28d22c3e1c05c60a2bd55daa5b9bc690ddfeac75adb57a1333454b9dac04', '2026-08-28 03:47:24.44235+00', '20260825044300_add_chat_message', NULL, NULL, '2026-08-28 03:47:24.429588+00', 1);
INSERT INTO public._prisma_migrations VALUES ('232959db-9a9b-49c8-abb6-8ef5de0c923c', 'ea8ccf13bda918e2c4ad3f9d3d4236b6206d2e31d2825ec676d4b7547b52b39f', '2026-08-28 03:47:24.452122+00', '20260825060000_add_file_attachments', NULL, NULL, '2026-08-28 03:47:24.443002+00', 1);
INSERT INTO public._prisma_migrations VALUES ('c30402ee-7d54-4553-8995-6d4c0b0cba52', '6e693f46bc0ba2827aedfdbb1edeb15ee3c5d13bd8e9bcafecd15b180b35f905', '2026-08-28 03:47:24.528082+00', '20260827180000_add_statuses', NULL, NULL, '2026-08-28 03:47:24.514911+00', 1);
INSERT INTO public._prisma_migrations VALUES ('61515a33-4450-49ac-a7fa-ea86d14a5db2', '9c15195a44f3d00de61433a0078eddc115bcf5f03154c809e990afa39c5f61e6', '2026-08-28 03:47:24.455508+00', '20260825070000_add_hide_completed_tasks', NULL, NULL, '2026-08-28 03:47:24.452762+00', 1);
INSERT INTO public._prisma_migrations VALUES ('f3350ee7-cda8-4631-9ea1-c259504b086c', '279f8a2df02e31cd5c0610abd6e164e7d89682cdff221c752dd9f1788d477970', '2026-08-28 03:47:24.45833+00', '20260825080000_add_dark_theme', NULL, NULL, '2026-08-28 03:47:24.456066+00', 1);
INSERT INTO public._prisma_migrations VALUES ('cd2e0fa2-8af5-4070-947c-228ba4ecdd62', '587c9548ba5a5f2dbd9d257606a62afba85afe7a05ca0f49fa7ed1d484cb7397', NULL, '20250829132200_add_pskovline_settings', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20250829132200_add_pskovline_settings

Database error code: 42P07

Database error:
ERROR: relation "pskovline_settings" already exists

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P07), message: "relation \"pskovline_settings\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("heap.c"), line: Some(1167), routine: Some("heap_create_with_catalog") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20250829132200_add_pskovline_settings"
             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106
   1: schema_core::commands::apply_migrations::Applying migration
           with migration_name="20250829132200_add_pskovline_settings"
             at schema-engine/core/src/commands/apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine/core/src/state.rs:226', '2026-08-29 10:33:18.782121+00', '2026-08-29 10:30:34.535967+00', 0);
INSERT INTO public._prisma_migrations VALUES ('d8950265-a266-42a3-ab8c-cc453828ea20', '0d12901a907049f1bf75f876c20aabdc90b3f22c7418e3bd25c90de5583d75dc', '2026-08-28 03:47:24.487958+00', '20260826000000_add_telephony', NULL, NULL, '2026-08-28 03:47:24.458887+00', 1);
INSERT INTO public._prisma_migrations VALUES ('82ec6f54-d843-4bf0-b909-879feb68486f', '64ef5f52cb0deb10d3f9c1b85ce431de9cb5cb99b106f6bf5325839e1c8e7538', '2026-08-28 03:47:24.531687+00', '20260827190000_add_role_assignable', NULL, NULL, '2026-08-28 03:47:24.528679+00', 1);
INSERT INTO public._prisma_migrations VALUES ('c9955674-9e5f-4a39-921c-e76f9517668b', '45e791942061fc8119a79872a72c4adb4c1c9d1e690850a3423bb753a453d911', '2026-08-28 05:05:45.910956+00', '20260828080000_add_user_fields', NULL, NULL, '2026-08-28 05:05:45.897097+00', 1);
INSERT INTO public._prisma_migrations VALUES ('cd8b071b-62db-4b07-a51d-62192ccf3a3b', 'manual_migration_20260828230000', '2026-08-28 19:55:04.357509+00', '20260828230000_add_chat_reactions_reply_recipient', '', NULL, '2026-08-28 19:55:04.357509+00', 1);
INSERT INTO public._prisma_migrations VALUES ('ba9e87ec-b2e1-4414-a51b-a618d62c3ed7', 'manual_migration_20260828240000', '2026-08-28 20:01:47.787233+00', '20260828240000_add_chat_message_recipients', '', NULL, '2026-08-28 20:01:47.787233+00', 1);
INSERT INTO public._prisma_migrations VALUES ('d959113c-0023-4aaa-9877-9c8c93e39392', 'e758b36fdd3caa2a985e78dbd7458b303d3045ecba0ad5939dde31cfdb1f7fc5', '2026-08-28 22:15:08.921983+00', '20260829055849_add_news_system', NULL, NULL, '2026-08-28 22:15:08.829818+00', 1);
INSERT INTO public._prisma_migrations VALUES ('fff5ab4f-32dc-49f9-bf40-72c15d952b25', '628aaf22d19a95e5369143245069fe06d0afc2d2451cfb4a0570c993a60c8f84', '2026-08-28 22:23:39.428887+00', '20260829062302_add_news_to_allowed_pages', NULL, NULL, '2026-08-28 22:23:39.414257+00', 1);
INSERT INTO public._prisma_migrations VALUES ('aa13bf6e-2df1-4e8f-bdf2-17bee3fd86b7', '587c9548ba5a5f2dbd9d257606a62afba85afe7a05ca0f49fa7ed1d484cb7397', '2026-08-29 10:33:18.785228+00', '20250829132200_add_pskovline_settings', '', NULL, '2026-08-29 10:33:18.785228+00', 0);
INSERT INTO public._prisma_migrations VALUES ('9ef9faa7-6579-4d1c-8dc4-767f6d69987f', '23fee488728b3e9bf81d5b08c3476b79713ac77bcb7587e60808798b623bbb2d', '2026-08-29 11:07:34.614522+00', '20250829140000_add_pskovline_account2', NULL, NULL, '2026-08-29 11:07:34.607966+00', 1);
INSERT INTO public._prisma_migrations VALUES ('0df34081-5ccf-41b9-8a4a-89279cd10d58', '840a6935c10bd35ce17288b58ec0cd3232d498a74cf590788ad686b1b06fa142', NULL, '20260830072100_add_camera_settings', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20260830072100_add_camera_settings

Database error code: 42P07

Database error:
ERROR: relation "camera_settings" already exists

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P07), message: "relation \"camera_settings\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("heap.c"), line: Some(1167), routine: Some("heap_create_with_catalog") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20260830072100_add_camera_settings"
             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106
   1: schema_core::commands::apply_migrations::Applying migration
           with migration_name="20260830072100_add_camera_settings"
             at schema-engine/core/src/commands/apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine/core/src/state.rs:226', '2026-08-30 08:01:48.390545+00', '2026-08-30 07:59:01.522542+00', 0);
INSERT INTO public._prisma_migrations VALUES ('4085aca9-40ac-4b8c-96f8-34620b67fef2', '840a6935c10bd35ce17288b58ec0cd3232d498a74cf590788ad686b1b06fa142', '2026-08-30 08:01:48.393527+00', '20260830072100_add_camera_settings', '', NULL, '2026-08-30 08:01:48.393527+00', 0);
INSERT INTO public._prisma_migrations VALUES ('448d69d9-efeb-4708-9c44-538066a10717', '', '2026-08-30 08:07:52.868363+00', '20260830110000_add_task_history', '', NULL, '2026-08-30 08:07:52.868363+00', 1);
INSERT INTO public._prisma_migrations VALUES ('e7d1b9e6-459d-4c8e-a34a-8d2a1199746a', 'a2a214676389d2e838aad867d990cad20a2134a4ae17d4f1e116f7e5c80a386b', '2026-08-30 20:23:59.343708+00', '20260830230500_add_can_be_curator', NULL, NULL, '2026-08-30 20:23:59.334066+00', 1);
INSERT INTO public._prisma_migrations VALUES ('d6cef722-daea-4a33-8305-57a963564245', 'fbd68687a10b48471e98f1e13c02ccd4677bbf0d6590102c3ac8dd51a3f0bc28', '2026-08-30 17:50:56.629957+00', '20260830143200_add_status_is_active', NULL, NULL, '2026-08-30 17:50:56.622205+00', 1);
INSERT INTO public._prisma_migrations VALUES ('5f8fc922-9c21-448a-ad6a-38543ab77b6a', '', '2026-08-30 18:55:56.141466+00', '20260830215000_fix_task_curator', '', NULL, '2026-08-30 18:55:56.141466+00', 1);
INSERT INTO public._prisma_migrations VALUES ('6a6f5a0c-0232-4dbf-8ea5-40d57e603fe6', 'af4c4b08f7cae5decc195f5f7b47aa80612257960595cdfbffff0e57b8b9b53a', NULL, '20260830210000_add_task_curator', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20260830210000_add_task_curator

Database error code: 42710

Database error:
ERROR: constraint "tasks_curator_id_fkey" for relation "tasks" already exists

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42710), message: "constraint \"tasks_curator_id_fkey\" for relation \"tasks\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(9026), routine: Some("ATExecAddConstraint") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20260830210000_add_task_curator"
             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106
   1: schema_core::commands::apply_migrations::Applying migration
           with migration_name="20260830210000_add_task_curator"
             at schema-engine/core/src/commands/apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine/core/src/state.rs:226', '2026-08-30 20:23:57.7359+00', '2026-08-30 20:23:43.226384+00', 0);
INSERT INTO public._prisma_migrations VALUES ('ebcc6a22-98b9-46ea-8701-66c177f184f7', 'af4c4b08f7cae5decc195f5f7b47aa80612257960595cdfbffff0e57b8b9b53a', '2026-08-30 20:23:57.739049+00', '20260830210000_add_task_curator', '', NULL, '2026-08-30 20:23:57.739049+00', 0);
INSERT INTO public._prisma_migrations VALUES ('feb9060a-b1aa-4ad3-b8fb-d9cfeca756fa', 'fefc9a3714b69af4e190bfd60226456a2dc26f8eb0b81a7d8a99269e937f9fae', '2026-09-11 03:11:11.087941+00', '20260911_add_tochka_interval', NULL, NULL, '2026-09-11 03:11:11.077853+00', 1);
INSERT INTO public._prisma_migrations VALUES ('941463c0-7ab6-4dc4-b2ba-f334a728d324', '42f8fc283457bf8cc9fe9bce7d0a3ebda0f5325e3e7f1ca3a3e3aadd8dc95e80', '2026-09-01 13:46:17.647864+00', '20250831_add_task_finances', NULL, NULL, '2026-09-01 13:46:17.640883+00', 1);
INSERT INTO public._prisma_migrations VALUES ('1bff56f4-9ac3-471d-8988-d54d6503026e', 'fff3780f37bb317a6221e523176145f91c44271036b92e3f2d7a6d6045d1fcd4', '2026-09-13 06:53:42.03954+00', '20260913010000_add_dark_logo_accent_color', NULL, NULL, '2026-09-13 06:53:42.03492+00', 1);
INSERT INTO public._prisma_migrations VALUES ('fdf5d1ae-bfa4-48cb-8d51-9e34a899dbbb', 'f0e16170ed330f94f6e0184977c5de5603f56e084e485dc2377afb6ef3ca0c9e', '2026-09-13 09:03:52.395067+00', '20260913_add_onec_plugin', NULL, NULL, '2026-09-13 09:03:52.379813+00', 1);
INSERT INTO public._prisma_migrations VALUES ('2cedc9ec-b8b4-4c6e-93cf-258c4832860a', '218b2108febed948fd21ea6bb56077c0f781c4a45b08e6382a738bfb512a9cc6', '2026-09-13 20:01:34.614026+00', '20260913_add_onec_entity_sync', NULL, NULL, '2026-09-13 20:01:34.608955+00', 1);
INSERT INTO public._prisma_migrations VALUES ('ed270a03-eba6-4168-a517-9c22e40c3525', 'caf7923092af57522cce52b5aaa30f5b8144c7e1c0789bd019e76d1cc90fa487', '2026-09-13 21:23:11.929457+00', '20260914000000_product_categories', NULL, NULL, '2026-09-13 21:23:11.911045+00', 1);
INSERT INTO public._prisma_migrations VALUES ('7b7ef876-182d-4faa-aafd-16b63cd384a4', '4f2bbd7fcbfc3c169ef46af0715ffe65f17d8367635e21d21cb30b0a0eb08070', '2026-09-14 05:25:37.827151+00', '20260914_add_email_filters', NULL, NULL, '2026-09-14 05:25:37.804899+00', 1);
INSERT INTO public._prisma_migrations VALUES ('a380bb1f-6992-4da8-8ee4-2c225a2db45c', '3bc67167fb7c3e0e5714d93f3a8564bcc00a5cfcd43de6102939219cf50b60ca', '2026-09-14 08:03:11.499239+00', '20260914_add_show_finances_tab_to_roles', NULL, NULL, '2026-09-14 08:03:11.493345+00', 1);
INSERT INTO public._prisma_migrations VALUES ('cb62a7ab-2daf-4dbd-bf40-3386d3e1cdb3', '1d258b4315e42a1f3e975fbb75460d0a269697811c4fb5bf0358a21baeb06097', '2026-09-14 09:54:33.477557+00', '20260914_add_task_status_permissions_to_roles', NULL, NULL, '2026-09-14 09:54:33.47127+00', 1);
INSERT INTO public._prisma_migrations VALUES ('58b967f5-416e-4ac8-b93e-70072a5ecf23', 'edc50c074e5dfc4322371aa9bb8362fe9208f579e0ff57084a9391bb218043de', '2026-09-14 10:59:40.909739+00', '20260914_add_pinned_to_home_news', NULL, NULL, '2026-09-14 10:59:40.903377+00', 1);
INSERT INTO public._prisma_migrations VALUES ('c57f8f85-531f-4c1b-b2d3-a22997e4be1d', '73c2ab25301fb76aaf55560d33d3d8689b74cbb73a43ed2c627686975e84eea9', '2026-09-14 12:09:34.975531+00', '20260914_add_news_cover_branding', NULL, NULL, '2026-09-14 12:09:34.971536+00', 1);
INSERT INTO public._prisma_migrations VALUES ('e2063ce7-20f2-40e1-9ec5-a230d24164d9', '9a924442913ecc9cd179977a131f2c9e2284ce1a8e687bee2be791fe3022cbb8', '2026-09-14 12:44:31.545946+00', '20260914_add_news_permissions_roles', NULL, NULL, '2026-09-14 12:44:31.540202+00', 1);
INSERT INTO public._prisma_migrations VALUES ('3bcc90ec-6223-44ac-bc10-32c7451f5881', '0d4116dbdcb17c4b0698f1bfdb0172586655902b10e833aaea24c16944d2d37a', '2026-09-14 14:12:21.857012+00', '20260914_add_news_reactions_comments', NULL, NULL, '2026-09-14 14:12:21.831757+00', 1);
INSERT INTO public._prisma_migrations VALUES ('0e9a1010-3546-403d-ac46-8d90c8ea3bdb', '1e73f691952dd99221f214920bdd45c4e1a85e4d2cd9ea53d0826a5cd553028a', '2026-09-14 17:07:28.02219+00', '20260914_remove_ai_assistant', NULL, NULL, '2026-09-14 17:07:28.012643+00', 1);
INSERT INTO public._prisma_migrations VALUES ('aa5abc01-f2e3-4bde-8cb0-c75d87a754b1', 'b1de575b6da218f470a4fca3a829c6217c55cc65750a951edb8a23c91727bad8', '2026-09-15 06:27:05.683294+00', '20260915_add_web_calls', NULL, NULL, '2026-09-15 06:27:05.661879+00', 1);
INSERT INTO public._prisma_migrations VALUES ('06dccbc7-dda7-401d-841a-13d2035c2d9a', '05c85e9ccf8d783e067d9f995d2b17a0362202bfd87cffadb14f2fb55a4c3103', '2026-09-15 08:37:15.787341+00', '20260915_add_email_parse_rules', NULL, NULL, '2026-09-15 08:37:15.783258+00', 1);
INSERT INTO public._prisma_migrations VALUES ('4ecc1f97-cc1a-47f4-866c-389f328b386f', '6a98411cb84c88769b193d227e29688ee28d2ce94f8a484c6fc4a2f65cc41dfd', '2026-09-15 10:26:34.053946+00', '20260915_add_email_filter_spam', NULL, NULL, '2026-09-15 10:26:34.048336+00', 1);
INSERT INTO public._prisma_migrations VALUES ('f8936903-5563-44c4-bcf1-dde9bc49c432', '06dcd2aee44aa782a41f392c0b5f797585ac4407a579e23bb82da667ace8a1d0', '2026-09-15 10:44:48.504611+00', '20260915_add_role_can_handle_spam', NULL, NULL, '2026-09-15 10:44:48.498874+00', 1);
INSERT INTO public._prisma_migrations VALUES ('a30e71ce-ff5f-4f61-a98e-ed36e9c93b94', '2ba435a5cc00ca5157e17def749712955490bedad1905b47f0338473e0be9a00', NULL, '20250831_add_vk_comment', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20250831_add_vk_comment

Database error code: 42701

Database error:
ERROR: column "vk_message_id" of relation "comments" already exists

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42701), message: "column \"vk_message_id\" of relation \"comments\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(7356), routine: Some("check_for_column_name_collision") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20250831_add_vk_comment"
             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106
   1: schema_core::commands::apply_migrations::Applying migration
           with migration_name="20250831_add_vk_comment"
             at schema-engine/core/src/commands/apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine/core/src/state.rs:226', '2026-09-01 13:46:41.440465+00', '2026-09-01 13:46:17.648557+00', 0);
INSERT INTO public._prisma_migrations VALUES ('28179ae8-a374-4f61-847e-e5a8ed87cccb', '2ba435a5cc00ca5157e17def749712955490bedad1905b47f0338473e0be9a00', '2026-09-01 13:46:41.443975+00', '20250831_add_vk_comment', '', NULL, '2026-09-01 13:46:41.443975+00', 0);
INSERT INTO public._prisma_migrations VALUES ('e141ca5b-4b27-4628-84f0-972976163b73', '0f5943e98192d6ce0d2781b1d5f8cb8ccfba9d996f0bf8b438a956f1b3959c80', NULL, '20250831_add_vk_group', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20250831_add_vk_group

Database error code: 42701

Database error:
ERROR: column "vk_user_id" of relation "contacts" already exists

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42701), message: "column \"vk_user_id\" of relation \"contacts\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(7356), routine: Some("check_for_column_name_collision") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20250831_add_vk_group"
             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106
   1: schema_core::commands::apply_migrations::Applying migration
           with migration_name="20250831_add_vk_group"
             at schema-engine/core/src/commands/apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine/core/src/state.rs:226', '2026-09-01 13:47:10.934893+00', '2026-09-01 13:46:44.48795+00', 0);
INSERT INTO public._prisma_migrations VALUES ('44388ea6-a720-445f-9809-56f351f6b9b3', '0f5943e98192d6ce0d2781b1d5f8cb8ccfba9d996f0bf8b438a956f1b3959c80', '2026-09-01 13:47:10.938004+00', '20250831_add_vk_group', '', NULL, '2026-09-01 13:47:10.938004+00', 0);
INSERT INTO public._prisma_migrations VALUES ('983cacbd-1bf4-4f10-a0f1-362ea3c098e8', 'b08a2c6d3f092f0668b1224c622f99c8a56b2716cc36c03e7b3287570d52c60b', NULL, '20260909180000_yandex_task_address', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20260909180000_yandex_task_address

Database error code: 42P01

Database error:
ERROR: relation "Task" does not exist

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \"Task\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(434), routine: Some("RangeVarGetRelidExtended") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20260909180000_yandex_task_address"
             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106
   1: schema_core::commands::apply_migrations::Applying migration
           with migration_name="20260909180000_yandex_task_address"
             at schema-engine/core/src/commands/apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine/core/src/state.rs:226', '2026-09-09 14:47:49.635977+00', '2026-09-09 14:46:15.275741+00', 0);
INSERT INTO public._prisma_migrations VALUES ('bf8b19b3-6ff4-4f44-8c3e-bb7ef591b81f', 'e5acb310cef2af41764115026ded46d889e0a1ef09d070682e14d512d5616dfd', NULL, '20260901_add_notification_settings', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20260901_add_notification_settings

Database error code: 42701

Database error:
ERROR: column "push_enabled" of relation "users" already exists

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42701), message: "column \"push_enabled\" of relation \"users\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(7356), routine: Some("check_for_column_name_collision") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20260901_add_notification_settings"
             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106
   1: schema_core::commands::apply_migrations::Applying migration
           with migration_name="20260901_add_notification_settings"
             at schema-engine/core/src/commands/apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine/core/src/state.rs:226', '2026-09-01 13:47:46.232945+00', '2026-09-01 13:47:25.661085+00', 0);
INSERT INTO public._prisma_migrations VALUES ('3a17e09e-854d-4954-8606-e93f09857a5e', 'e5acb310cef2af41764115026ded46d889e0a1ef09d070682e14d512d5616dfd', '2026-09-01 13:47:46.238313+00', '20260901_add_notification_settings', '', NULL, '2026-09-01 13:47:46.238313+00', 0);
INSERT INTO public._prisma_migrations VALUES ('ba6045ea-8a43-43a2-9b71-54e5254cade2', 'e065ac1827d1d0ce745b0becb455c7e0f94f57f35aeb5e9138819f1cbfcfb303', '2026-09-01 13:47:49.33467+00', '20260901_add_ticket_number', NULL, NULL, '2026-09-01 13:47:49.284881+00', 1);
INSERT INTO public._prisma_migrations VALUES ('90cf4417-5931-411c-9959-342fbb815fd3', 'cbba941d9416672adf1fb1ab3ff32499455c7590e7da33fd5f74869f4849935a', '2026-09-01 17:34:32.882629+00', '20260901_add_is_internal', NULL, NULL, '2026-09-01 17:34:32.874212+00', 1);
INSERT INTO public._prisma_migrations VALUES ('bfb2f1e0-4be9-466c-b16c-8dcca3cf25af', '2a64a0ea8e4ab8e9517faf7ab973c7cbecef9566886eaa51213c2eccee493fbf', '2026-09-11 22:40:10.973006+00', '20260912012100_telegram_user_chat', NULL, NULL, '2026-09-11 22:40:10.94524+00', 1);
INSERT INTO public._prisma_migrations VALUES ('212d50d5-b9d1-4d90-9e49-50cac1967db9', 'b3e189758c2580dea0f22067d05d1820b6f5010ebe823b6a6791adbc156f3874', '2026-09-01 20:51:01.135361+00', '20260901_add_vk_callback_fields', NULL, NULL, '2026-09-01 20:51:01.120876+00', 1);
INSERT INTO public._prisma_migrations VALUES ('c9b83224-85f5-4f06-b191-8a02b3de273f', 'aefb32bb85eb61cb108ea35f00d2f5207e0f35b215998378686d443542c31075', '2026-09-12 08:31:30.126032+00', '20260912120000_add_handler_settings', NULL, NULL, '2026-09-12 08:31:30.11107+00', 1);
INSERT INTO public._prisma_migrations VALUES ('bd222049-5c35-4244-8c9a-8a2f9bf589e0', '65e5c38afbe054d24b807b9678b9001a82a697f415eb9b0f1a4b4ee537bca04b', '2026-09-12 09:24:37.433202+00', '20260912130000_add_auto_reply', NULL, NULL, '2026-09-12 09:24:37.425631+00', 1);
INSERT INTO public._prisma_migrations VALUES ('4863cb7e-0052-40d1-8522-fa2e455cc8d1', '94cb9360da2a65ce18aa6cecf1edf9ad71719999e7b5ee71d56f319a3fe09d57', '2026-09-12 11:38:46.988062+00', '20260912140000_add_auto_replier', NULL, NULL, '2026-09-12 11:38:46.969506+00', 1);
INSERT INTO public._prisma_migrations VALUES ('e71cdbc3-501e-4ebe-a977-59bd0b1e85c0', 'b5ccaaeea097038dc5fc37d15aff941cff6fcc5ddb991cb6cfacadd0d8c340e4', '2026-09-12 14:12:39.443227+00', '20260912150000_add_vk_profile_url', NULL, NULL, '2026-09-12 14:12:39.438608+00', 1);
INSERT INTO public._prisma_migrations VALUES ('9197b2e8-6e17-43e8-9cfe-efef25e1ab94', 'd7547c33529ac7693008f1aac05aea38ef39655f0058be62d7443f3efcdcbf09', NULL, '20260902_121800_add_contact_max_fields', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20260902_121800_add_contact_max_fields

Database error code: 42701

Database error:
ERROR: column "avatar_url" of relation "contacts" already exists

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42701), message: "column \"avatar_url\" of relation \"contacts\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(7356), routine: Some("check_for_column_name_collision") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20260902_121800_add_contact_max_fields"
             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106
   1: schema_core::commands::apply_migrations::Applying migration
           with migration_name="20260902_121800_add_contact_max_fields"
             at schema-engine/core/src/commands/apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine/core/src/state.rs:226', '2026-09-02 13:02:20.291091+00', '2026-09-02 13:01:37.198027+00', 0);
INSERT INTO public._prisma_migrations VALUES ('a01b7b3c-3f2e-4f97-b6ca-7b7bf99fe38d', 'd7547c33529ac7693008f1aac05aea38ef39655f0058be62d7443f3efcdcbf09', '2026-09-02 13:02:20.293504+00', '20260902_121800_add_contact_max_fields', '', NULL, '2026-09-02 13:02:20.293504+00', 0);
INSERT INTO public._prisma_migrations VALUES ('73577e5e-1faf-4abe-b5d5-00a443c7c53a', '6c4e2bcadd92144c1879c261c6cbace71b04da382c2c85a858ab021900cba75b', '2026-09-03 09:13:10.068033+00', '20260902_160000_add_role_notifications', NULL, NULL, '2026-09-03 09:13:10.061451+00', 1);
INSERT INTO public._prisma_migrations VALUES ('5161e80d-a792-4d12-a317-62a6227378b8', 'c28da3569520b01bf84e5fcb69b18a6a00c24ddbea04b058145c38ad0ce22b9f', '2026-09-08 18:32:38.596867+00', '20260907_add_path_to_file_tab_settings', NULL, NULL, '2026-09-08 18:32:38.59401+00', 1);
INSERT INTO public._prisma_migrations VALUES ('edb80c8e-e3cc-4e9f-9f88-ae00a5ce90cd', 'e27d1ea392368587f51c3c381738fdc2991db9e03d1876ed1c7648bf4cbd3b6c', '2026-09-03 09:13:10.09899+00', '20260903050000_novofon_full_integration', NULL, NULL, '2026-09-03 09:13:10.068594+00', 1);
INSERT INTO public._prisma_migrations VALUES ('adb918ed-43d0-4192-ab02-4e745df54127', '0879f6c7b4f5e3235c10a125946fe39e52f03898c11cbb66309ccc152286eab9', '2026-09-03 09:13:10.101761+00', '20260903_010000_add_is_locked', NULL, NULL, '2026-09-03 09:13:10.099552+00', 1);
INSERT INTO public._prisma_migrations VALUES ('0d8280ef-0901-42ac-9fc2-9237ad37118d', 'cc4f2669c58ed9cc43b5a55028c81f22a9dc91e91fe51fdffcce4b8416955a04', '2026-09-05 19:21:20.022937+00', '20250904235500_add_telegram', NULL, NULL, '2026-09-05 19:21:20.016298+00', 1);
INSERT INTO public._prisma_migrations VALUES ('9ae3ec41-e4d1-4d64-a634-53c4777c569e', '699d2f9c5ebe660ed408b341ceb5315835bb788c151d530e8a803766e60dbada', '2026-09-08 18:32:38.623087+00', '20260908120000_add_reminders', NULL, NULL, '2026-09-08 18:32:38.597346+00', 1);
INSERT INTO public._prisma_migrations VALUES ('2b2f4792-7615-49d5-a1a1-323c432515ab', '8961fb3f58b2de2c6f88de5ac1e410662fe9a3181cfb7b7c5331b6f05ed10f7d', '2026-09-05 19:21:20.025955+00', '20250905_enable_push_default', NULL, NULL, '2026-09-05 19:21:20.023468+00', 1);
INSERT INTO public._prisma_migrations VALUES ('c509aea4-97de-4cc7-992e-43611b19882b', '933903f2ee0e6bc7c8f5581eff8e18a86e9569c7fcb1066fa338653e2da65b76', '2026-09-06 11:41:22.320673+00', '20260905_add_contact_project_relation', NULL, NULL, '2026-09-06 11:41:22.306959+00', 1);
INSERT INTO public._prisma_migrations VALUES ('bb2024ed-d973-4e7e-88e1-8e4d439b8a6c', '', '2026-09-06 11:46:11.826749+00', '20260906_add_file_tab_settings', '', NULL, '2026-09-06 11:46:11.826749+00', 1);
INSERT INTO public._prisma_migrations VALUES ('c9b2a5dd-db4e-4bc0-a28b-853d305ee9f1', 'b08a2c6d3f092f0668b1224c622f99c8a56b2716cc36c03e7b3287570d52c60b', NULL, '20260909180000_yandex_task_address', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20260909180000_yandex_task_address

Database error code: 42P01

Database error:
ERROR: relation "Task" does not exist

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \"Task\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(434), routine: Some("RangeVarGetRelidExtended") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20260909180000_yandex_task_address"
             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106
   1: schema_core::commands::apply_migrations::Applying migration
           with migration_name="20260909180000_yandex_task_address"
             at schema-engine/core/src/commands/apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine/core/src/state.rs:226', '2026-09-09 14:50:02.603467+00', '2026-09-09 14:48:13.025381+00', 0);
INSERT INTO public._prisma_migrations VALUES ('550585df-226d-4fb6-aefe-aad24a5047cc', '5b9d38a5e642da78b3a9758339291b533cd09e254cb6ff1a35d73034c76e07ad', '2026-09-08 18:32:38.593521+00', '20250906_add_is_visible_to_contact_types', NULL, NULL, '2026-09-08 18:32:38.587738+00', 1);
INSERT INTO public._prisma_migrations VALUES ('cb442766-77f8-4c17-8a8b-4f71a6e0a9af', 'f648ead8414ec5eea5d150b697a9039591bcf69fb6e14a1cc6e656192bb739fc', '2026-09-09 06:37:07.221926+00', '20260909093000_shared_reminders', NULL, NULL, '2026-09-09 06:37:07.202849+00', 1);
INSERT INTO public._prisma_migrations VALUES ('466ee099-ae36-42b2-9a65-28ba3879fb41', 'ea10c20074a17ecfb20c5742e8985581875c653f62dc6cc386c2636dbfc8a74a', '2026-09-09 07:13:06.450476+00', '20260909101500_recipient_completed_at', NULL, NULL, '2026-09-09 07:13:06.446276+00', 1);
INSERT INTO public._prisma_migrations VALUES ('ee90ac12-0e84-4df8-8955-88acc24833f5', '86a4996891379230f61045c51b44ac2415a588f02d704a369da98df1034c3fb4', '2026-09-10 19:18:26.913359+00', '20260910_vk_market_token', NULL, NULL, '2026-09-10 19:18:26.90875+00', 1);
INSERT INTO public._prisma_migrations VALUES ('687ce2ab-9114-48ce-97cf-973ebbac4fb2', '2b0ebd34bb79f2d289d16e75a10abdb458a4f18d2e55557e52690dac75b0aaab', '2026-09-09 14:50:14.317614+00', '20260909180000_yandex_task_address', NULL, NULL, '2026-09-09 14:50:14.306204+00', 1);
INSERT INTO public._prisma_migrations VALUES ('83c1f02f-da7b-4d6d-9c1d-59642cb62e87', 'bc338045acbfaa64d3cc4b3da914e6f534f7e555d1adfcfd40c5ad9a3b9da9ae', '2026-09-10 18:26:28.045515+00', '20260910_add_products', NULL, NULL, '2026-09-10 18:26:27.977188+00', 1);
INSERT INTO public._prisma_migrations VALUES ('e6931edc-5eda-4021-8b18-2b0d2834df2d', 'ca8111c015192099a34163d59deb2e56ba20bd65a61587c690fe3a8319c12107', '2026-09-10 18:45:40.620333+00', '20260910_product_images', NULL, NULL, '2026-09-10 18:45:40.603072+00', 1);
INSERT INTO public._prisma_migrations VALUES ('dc142fde-ca00-4908-8728-9420615a1b0f', '4a10ab0607d6a691c354b782888b5be6e72f2d4e47d564fc891dae0649d6aedd', '2026-09-10 21:08:28.082491+00', '20260910_sms_tasks', NULL, NULL, '2026-09-10 21:08:28.069802+00', 1);
INSERT INTO public._prisma_migrations VALUES ('d7f5f419-3451-4d70-807e-2b793351d26c', 'f16fe9f045a962a2655078246adc19668af64d979d2fe8f1b8200efae2200197', '2026-09-10 19:02:32.397106+00', '20260910_vk_sync', NULL, NULL, '2026-09-10 19:02:32.389112+00', 1);
INSERT INTO public._prisma_migrations VALUES ('363c5f50-edf4-45a7-b648-a3e0e2458846', '35377385b7eca837ddf237d5f7929cfbb5587614bab1e261f6581cd064bbf557', '2026-09-10 20:11:32.78138+00', '20260910_vk_market_oauth', NULL, NULL, '2026-09-10 20:11:32.77639+00', 1);
INSERT INTO public._prisma_migrations VALUES ('4556930c-ffee-498b-ad55-408f3861c359', '3b9db3d10edf984ed8a6388d24fb32729752168a8244f39153e84c54613d96f1', '2026-09-10 21:58:19.628144+00', '20260911_add_user_task_defaults', NULL, NULL, '2026-09-10 21:58:19.621852+00', 1);
INSERT INTO public._prisma_migrations VALUES ('64c278eb-6932-42fa-823f-4b8179b64413', '8ebf610f1626d845e827f808c1999fe47b71412f3e758caeb2039f2e2c94868d', '2026-09-11 00:05:24.766758+00', '20260911000000_add_branding', NULL, NULL, '2026-09-11 00:05:24.756419+00', 1);
INSERT INTO public._prisma_migrations VALUES ('cc26e607-77e9-4d21-960c-2bb9cd96c4a1', 'bc90286187e91638fd94fd32f06eda7450524c5a3dcb191f1d6bedf343a1d500', '2026-09-11 01:05:55.368529+00', '20260911_add_beget_settings', NULL, NULL, '2026-09-11 01:05:55.358156+00', 1);
INSERT INTO public._prisma_migrations VALUES ('3683bcbc-694b-4538-9daa-580f3482d5b7', '4a2869b814e75e598e446e28b376831c29520c1dcf91802a7a7d19d00a816db2', '2026-09-11 01:23:22.565988+00', '20260911_add_beget_partner', NULL, NULL, '2026-09-11 01:23:22.560874+00', 1);
INSERT INTO public._prisma_migrations VALUES ('8bed4cfa-b1f2-4da7-be41-f430c0c12a1a', '6a64b2ffc2db182ec2f9b7d77efe638ddf16c5b79fa987a371ec450f3f6e67f6', '2026-09-11 01:31:43.089448+00', '20260911_add_beget_update_time', NULL, NULL, '2026-09-11 01:31:43.084024+00', 1);
INSERT INTO public._prisma_migrations VALUES ('e738fdea-f532-41e3-96df-ebd09144ce10', '595fdebedbe4ed9357fb761cfee5f88c6c60f8af51733c55a7c2022e2f42fa84', '2026-09-11 02:24:15.544221+00', '20260911_add_pskovline_plugin', NULL, NULL, '2026-09-11 02:24:15.530151+00', 1);
INSERT INTO public._prisma_migrations VALUES ('771f98ae-d676-4baa-8242-74b699897d42', '1becb4e78a6b5706f850e483f62ccd60444f1f0f274fa44558e4f218ba3a8677', '2026-09-15 12:14:23.874427+00', '20260915_add_splash_settings', NULL, NULL, '2026-09-15 12:14:23.868693+00', 1);
INSERT INTO public._prisma_migrations VALUES ('1cc81c99-5c8f-4326-8f99-94541e4cca12', 'e1d7864a7cc66535e9eb40fc9fa02fb26e38d32553939d472756314f3e7fb835', '2026-09-15 13:53:11.30524+00', '20260915_add_product_on_vitrine', NULL, NULL, '2026-09-15 13:53:11.299725+00', 1);
INSERT INTO public._prisma_migrations VALUES ('f81aed9a-a54b-4cd7-a457-ab15b486122c', 'fc7f327e8ca9074a08a55449e98709974b8f709c2bcac727f2ae7cb9feb498df', '2026-10-01 11:51:58.298122+00', '20261001143000_contact_address', NULL, NULL, '2026-10-01 11:51:58.292243+00', 1);
INSERT INTO public._prisma_migrations VALUES ('a59c60df-a2b4-4c0e-acc6-5eb4920a9564', '299353e2793faffe793fea9fa569222d5b2e7ded896b3d7bcfbde1f80a51f5d2', '2026-09-15 18:42:25.354119+00', '20260915_add_onec_kind_folder', NULL, NULL, '2026-09-15 18:42:25.348959+00', 1);
INSERT INTO public._prisma_migrations VALUES ('22615632-5921-4b38-b5c3-d047f849666a', 'ff5e2e36b0483ed0620960e8b46c34512affc369b6882f69908f7aa93deaacee', '2026-09-21 00:49:05.886028+00', '20260921_webrtc_widget', NULL, NULL, '2026-09-21 00:49:05.874953+00', 1);
INSERT INTO public._prisma_migrations VALUES ('eac17e88-cd84-41b0-970d-e622974a5878', '8685bf361229684cf08bbc036e0654b732cdbad32e7ebcf8ce0289f2978672e6', '2026-09-16 12:30:33.961778+00', '20260916152000_add_stock_access', NULL, NULL, '2026-09-16 12:30:33.956519+00', 1);
INSERT INTO public._prisma_migrations VALUES ('e790b31d-8503-4206-985d-e1551b1712bf', '449d50921506e3b44ef7c36b6004d39202f1828fb3ea670522f79ba763ea7297', '2026-09-16 15:39:05.822772+00', '20260916174500_add_user_mobile_nav', NULL, NULL, '2026-09-16 15:39:05.817059+00', 1);
INSERT INTO public._prisma_migrations VALUES ('782e7d27-ac91-41b6-8a16-2e97c02160d1', 'c0e609033c6701bdeb592b1588caa2fee4925eaaa80c7e24765db46e2ba64b95', '2026-09-16 17:27:15.116602+00', '20260916195500_add_price_catalog_flags', NULL, NULL, '2026-09-16 17:27:15.110629+00', 1);
INSERT INTO public._prisma_migrations VALUES ('0317e312-6477-4e16-ac08-e81f282a29c7', 'aedd38ec66c2caae46c141229f7b3ccdf0d0f7a9d016b5ff373219f94b45953e', '2026-09-21 08:41:20.951688+00', '20260921_add_theme_setting', NULL, NULL, '2026-09-21 08:41:20.946216+00', 1);
INSERT INTO public._prisma_migrations VALUES ('2df1126f-2e4c-405a-8ae2-b92889900cb7', 'cfe703bbfcdca175224c408434f39c230475dbcf9966dcdf8aef9c268446b4db', '2026-09-16 20:20:19.691358+00', '20260916232000_add_contact_type_catalog_flags', NULL, NULL, '2026-09-16 20:20:19.684874+00', 1);
INSERT INTO public._prisma_migrations VALUES ('206a9f80-7477-4616-9b0a-5933ae741a73', '0f7aa4bd4a1bcb73123f32c2e6811943c0ba6a407448c1ffbf45353f1bb4dac8', '2026-09-17 17:43:02.350209+00', '20260917100000_vpn_settings', NULL, NULL, '2026-09-17 17:43:02.33792+00', 1);
INSERT INTO public._prisma_migrations VALUES ('d262b975-c73a-4c76-a2ac-d62e2b48d24a', '451b3c219dee33184de6b1460b11dba858e8d3b7a63c4b48dcfdf1124732c51a', '2026-09-18 01:54:43.577499+00', '20260918_add_dashboard_metric_settings', NULL, NULL, '2026-09-18 01:54:43.562804+00', 1);
INSERT INTO public._prisma_migrations VALUES ('afec2dcb-73d7-4408-9ece-927d864eec80', 'c0973778af291772111394cb2df252c2019259f59937daaed946c748dbbcd05c', '2026-09-21 17:36:17.063344+00', '20260921_sales', NULL, NULL, '2026-09-21 17:36:17.056726+00', 1);
INSERT INTO public._prisma_migrations VALUES ('36e47e46-137b-4414-9851-532696a663a1', '9b959d89be597e2cd3ab3afa1f7b083ac69bf74ef224cb83c9822a560728465e', '2026-09-18 03:32:15.731429+00', '20260918_project_users', NULL, NULL, '2026-09-18 03:32:15.713547+00', 1);
INSERT INTO public._prisma_migrations VALUES ('d51e990d-b860-4a7b-88f2-730ee2319a04', '2b2b823557b9b51afdc168a934915bbacb16a3e97216ac9990633148dfb3c898', '2026-09-18 03:47:04.555171+00', '20260918_role_can_access_projects', NULL, NULL, '2026-09-18 03:47:04.548552+00', 1);
INSERT INTO public._prisma_migrations VALUES ('6f3f8130-aaad-4127-a7ee-f828d3a15136', '6cd134a142161706c5831efd048667fb042a8f5f93aa5a101c317cfcde9a9e34', '2026-10-01 13:39:04.677326+00', '20261001163000_contact_telegram_username', NULL, NULL, '2026-10-01 13:39:04.671787+00', 1);
INSERT INTO public._prisma_migrations VALUES ('f3ce2056-ce0f-406b-9475-00abeb95400c', '25fded8f3b1a7c3025e684f513d3a0398164adb7b318d775a369090e875edb68', '2026-09-19 18:45:11.511956+00', '20260920120000_add_diadoc_plugin', NULL, NULL, '2026-09-19 18:45:11.500581+00', 1);
INSERT INTO public._prisma_migrations VALUES ('09886882-aacc-4f56-8419-71138b63f4fb', 'aeebb5684a316157d287cefed2a4db96c4b45abb8f83fb56048d9cb6305bff9a', '2026-09-29 18:05:01.39645+00', '20260929_remove_contact_company', NULL, NULL, '2026-09-29 18:05:01.38757+00', 1);
INSERT INTO public._prisma_migrations VALUES ('4191880c-cd46-4b6a-bd82-17ab0f360e7f', 'c057590a0c6a6a495fa099e6334b48837fcc64899d0daa7ad18d9f4280cac70c', '2026-09-19 19:35:12.866076+00', '20260920_accounting_module', NULL, NULL, '2026-09-19 19:35:12.816644+00', 1);
INSERT INTO public._prisma_migrations VALUES ('2f1a100e-d38f-438e-93d6-6c1d4f6bb8a0', '2334325cfbe3425bee282a440fe5539fa8f4bf1c6200c25fa3272f348d6594b8', '2026-09-20 07:48:51.475171+00', '20260920130000_add_dgis_plugin', NULL, NULL, '2026-09-20 07:48:51.463814+00', 1);
INSERT INTO public._prisma_migrations VALUES ('fcc1fc96-7508-456c-8d4c-a89f741e43f6', '82cb935aab10c380da57ff547fac5fd3a6d134909b7ac6eea0e0f5495e662ed7', '2026-09-29 18:33:25.242782+00', '20260929_ip_is_organization', NULL, NULL, '2026-09-29 18:33:25.235148+00', 1);
INSERT INTO public._prisma_migrations VALUES ('8ac8d1c6-afd1-4618-b07e-80a29f4a430f', 'e8d965957b50c9f1ea1c3853e800d2ff2c53d82fcbb102b1f574905374303127', '2026-10-06 01:05:29.098622+00', '20261006100000_subscription_ends_at', NULL, NULL, '2026-10-06 01:05:29.091331+00', 1);
INSERT INTO public._prisma_migrations VALUES ('1872e4aa-0455-4408-8ec4-3462a8c40f54', '74a2d924d99c33c8338ace9d8bccd747520f5c7e4429a3b3e9d879d2cd839166', '2026-09-30 18:26:49.415715+00', '20260930213000_add_product_article', NULL, NULL, '2026-09-30 18:26:49.406388+00', 1);
INSERT INTO public._prisma_migrations VALUES ('b3179a24-a358-4902-b504-b8fe02e98628', '13af2162903a15f9784570afac6160a5beb47457d989d1b101756c5c773942cf', '2026-10-01 19:53:45.564779+00', '20261001223500_legal_documents', NULL, NULL, '2026-10-01 19:53:45.551689+00', 1);
INSERT INTO public._prisma_migrations VALUES ('704dd4ed-88cf-43c7-a488-742efb20132a', '9c642ef4c6e090a9bee6df755411e1a52c785a2969749a653bb29d56ce5287c2', '2026-09-30 22:31:50.792029+00', '20261001013000_contact_accesses', NULL, NULL, '2026-09-30 22:31:50.776289+00', 1);
INSERT INTO public._prisma_migrations VALUES ('63049b47-578a-4cb5-83be-797d92d4a693', '645f3f6d6d681ce7bc166c5f109c31bd7aa0e4ba63846f15ee0fb0f60a090b48', '2026-10-01 06:00:52.715433+00', '20261001033000_contact_birth_date', NULL, NULL, '2026-10-01 06:00:52.709942+00', 1);
INSERT INTO public._prisma_migrations VALUES ('36b2ab4b-74c9-4029-b1b6-20e8cc587273', 'fc72ff694881beffc14de84c9214d1bb8cfeada23bd90a48bed4ff8ade5ae304', '2026-10-04 07:47:53.312799+00', '20261004074500_login_slides', NULL, NULL, '2026-10-04 07:47:53.293507+00', 1);
INSERT INTO public._prisma_migrations VALUES ('2413e47d-d868-48c4-9d11-3a75b1ee5ff7', '75fffb614e4e93acf7c084a9bbeada63a296209bfb074928bf61e2021366ac77', '2026-10-02 15:09:25.791684+00', '20261002150000_product_subscriptions', NULL, NULL, '2026-10-02 15:09:25.765009+00', 1);
INSERT INTO public._prisma_migrations VALUES ('b36188b2-8ebf-41ca-92be-a610b34a1b25', '4be74e026e7569bd0c51ccab8c1337535a2e1bbf8f08bcb6c7bc7a2bcbfe0121', '2026-10-03 17:19:16.460537+00', '20261003195600_billing_price_flags', NULL, NULL, '2026-10-03 17:19:16.453293+00', 1);
INSERT INTO public._prisma_migrations VALUES ('27d1e6f5-d482-4c31-8092-bef3f784e9e3', '42d9b1a42c7f35b081be3ab078d3d4d858771a53e7e3e9a6b4dc0a49c17adbe2', '2026-10-04 08:07:32.401525+00', '20261004111500_login_brand_text', NULL, NULL, '2026-10-04 08:07:32.3938+00', 1);
INSERT INTO public._prisma_migrations VALUES ('6ba86450-eb43-4c42-b5ff-eb293ae7eecf', 'ba5a58fc1734bb321210730974fcddf197c0b8bcf0b5e2db1c8614f11bac0654', '2026-10-03 22:00:58.747264+00', '20261004004500_promo_block_button_style', NULL, NULL, '2026-10-03 22:00:58.740753+00', 1);
INSERT INTO public._prisma_migrations VALUES ('b3a41546-7405-4e54-adec-b53628525fc8', 'ba66293619eb7d88877231f2626df74d3ad974551c26f059beb26514db20b259', '2026-10-06 09:04:44.207556+00', '20261006120000_subscription_renewal_payments', NULL, NULL, '2026-10-06 09:04:44.201727+00', 1);
INSERT INTO public._prisma_migrations VALUES ('7c5916d2-8e44-44a2-a58e-549ef7084b56', '95aff7d0f8be26d1ee5c0964f8a1a692e6ef5fbaba794ef475b1bfab98ca07e0', '2026-10-05 09:12:42.97351+00', '20261005120000_add_tochka_acquiring', NULL, NULL, '2026-10-05 09:12:42.95135+00', 1);
INSERT INTO public._prisma_migrations VALUES ('c6e21c3b-2c27-45fa-9d71-41cff21da13e', '76de27212139817d8d99cb47781f5f66415f8f302c03cbfaecd695a361924c22', '2026-10-06 08:14:42.180478+00', '20261006110000_subscription_statuses', NULL, NULL, '2026-10-06 08:14:42.174097+00', 1);
INSERT INTO public._prisma_migrations VALUES ('076a33ed-a282-46b4-b8d9-6b87d025ae8d', '05045aeadbe04e272c2e9ff02534c9f55f4fc00074ee80db9403eabe22dd63d8', '2026-10-06 15:23:18.068718+00', '20261006181000_add_user_stock_access', NULL, NULL, '2026-10-06 15:23:18.060094+00', 1);
INSERT INTO public._prisma_migrations VALUES ('283e7edd-ae39-4769-ae4b-08b7d597339a', '093e1b0c49dcbd7577312db4079ac8ada3215408f8f8c5afb6347702cf39bff3', '2026-10-07 14:09:16.985209+00', '20261007170000_product_tags', NULL, NULL, '2026-10-07 14:09:16.976142+00', 1);
INSERT INTO public._prisma_migrations VALUES ('5406625a-fb8f-4c66-affb-692a0167124f', '4e895d02e2e5e7703a766fe9a7e4ac8d03859734e95b40407b4efc241c374b3c', '2026-10-07 18:23:53.874184+00', '20261007210000_ozon_seller', NULL, NULL, '2026-10-07 18:23:53.854242+00', 1);
INSERT INTO public._prisma_migrations VALUES ('d709bf97-7658-4775-a0fd-b2b18bd77844', 'c42f7877b644daf552e1d162968ae7de1373e9d89a6b351f13c1d68f83701f95', '2026-10-07 18:41:02.554217+00', '20261007213000_ozon_default_type', NULL, NULL, '2026-10-07 18:41:02.549124+00', 1);
INSERT INTO public._prisma_migrations VALUES ('ee427dab-8180-4a7b-bd0e-7edc39a4b050', '626b96851ed118cb112b8b356e5e1872b12cffffd64878114da5bd5146875d3e', '2026-10-07 18:57:39.275832+00', '20261007214500_ozon_category_binding', NULL, NULL, '2026-10-07 18:57:39.269871+00', 1);
INSERT INTO public._prisma_migrations VALUES ('dbda0f32-55b7-43b0-ab06-d1e1a281603c', 'd3006fd7abc39a802e5ae4eff7d65d7a80ac52a99e202f32fec2275874bec0ba', '2026-10-07 19:23:58.255219+00', '20261007223000_ozon_product_id_bigint', NULL, NULL, '2026-10-07 19:23:58.224393+00', 1);
INSERT INTO public._prisma_migrations VALUES ('93c446c8-9ab3-43bb-bb22-a74f87a88623', 'f55a22e0a0825e32cecef7e374a6dbd49f8ac38eff67e10cbbb1c4d38f4af334', '2026-10-07 20:41:58.97025+00', '20261007233000_product_weight_dims', NULL, NULL, '2026-10-07 20:41:58.963422+00', 1);
INSERT INTO public._prisma_migrations VALUES ('f5ef5ef8-8f48-448f-a84e-7a7d74e3ad18', 'bfd54b468f6f9b34ea3b42cce558a59f8e5818f9f7a15e893bfa03a9a1872457', '2026-10-11 16:47:14.680957+00', '20261011190000_crm_subscription_pages', NULL, NULL, '2026-10-11 16:47:14.675676+00', 1);
INSERT INTO public._prisma_migrations VALUES ('3eb64c25-8df7-40bd-8798-08e10fa345ed', 'dff6d952eb5f13d0623b6f02e9cf21d96d00d4e62f802f939467ade3bf217b86', '2026-10-07 21:20:05.618822+00', '20261008001000_product_brand', NULL, NULL, '2026-10-07 21:20:05.613798+00', 1);
INSERT INTO public._prisma_migrations VALUES ('7a890ea9-0eba-4068-b2a6-1e69f22c08dd', '13121bea85e076e53fda3bb9a8fd76ca186211e1c525e560afeec27b247b979e', '2026-10-07 22:15:31.912157+00', '20261008011000_product_tnved', NULL, NULL, '2026-10-07 22:15:31.906952+00', 1);
INSERT INTO public._prisma_migrations VALUES ('6e6cba46-f384-4cfd-87b6-656181a3c35c', 'daea88ee276c434ea1e29004aa54f858ac1cf8d49e21b44b54ad15a87bfd4b5b', '2026-10-07 22:55:47.456553+00', '20261008015000_product_units_g_mm', NULL, NULL, '2026-10-07 22:55:47.448386+00', 1);
INSERT INTO public._prisma_migrations VALUES ('9b8e6486-9839-4994-a619-21139d89f4be', 'a7580b883265be58acc5f6ec5b85a6b3e79a49573b3792b97f85061bbedff1e8', '2026-10-11 17:44:31.788799+00', '20261011203000_tenant_pay_fields', NULL, NULL, '2026-10-11 17:44:31.782886+00', 1);
INSERT INTO public._prisma_migrations VALUES ('c57701f7-3646-4d48-af01-eebd927be7ad', '3709d1d3ecc1d925d2cd0cf16b17d9ec636988f37d953b1ae8a0f5504977df90', '2026-10-09 11:37:46.032437+00', '20261009144000_vk_market_token_refresh', NULL, NULL, '2026-10-09 11:37:46.02527+00', 1);
INSERT INTO public._prisma_migrations VALUES ('7da6bf07-aeb4-4bd2-9a92-4f17a3da7379', '73b52f0179ff75fc5ee2a221717c69d66ba466f75b7e712df1ae6e6813a2aca0', '2026-10-09 17:03:42.496252+00', '20261009200000_support_chat', NULL, NULL, '2026-10-09 17:03:42.482665+00', 1);
INSERT INTO public._prisma_migrations VALUES ('44633cc1-876c-443a-a832-798e2eb1ef68', 'a69ee992f54bf52dc79d31249a8cd835905ff8fc898265c54441569f25d0cb6e', '2026-10-09 19:21:19.172222+00', '20261009223000_support_tickets_visibility', NULL, NULL, '2026-10-09 19:21:19.165947+00', 1);
INSERT INTO public._prisma_migrations VALUES ('87ec5ee2-42ee-4abc-9327-c4063f00295d', '8a4d07f0700e87a330b6c2a2822f8f6674c6ba6b50d98a1b12c7e2b9a3013a50', '2026-10-11 19:31:55.421927+00', '20261011222000_crm_cameras', NULL, NULL, '2026-10-11 19:31:55.416144+00', 1);
INSERT INTO public._prisma_migrations VALUES ('9a2d7a0f-9911-46be-b66f-c3285ad81a55', '9761b70bdda8d4bb64e6351fd0be14a6cb53db56d1e90f3488be9c76b14df488', '2026-10-09 21:51:37.228532+00', '20261010000000_add_seo_settings', NULL, NULL, '2026-10-09 21:51:37.216209+00', 1);
INSERT INTO public._prisma_migrations VALUES ('131bc505-24d7-4da7-9868-c50fb34c478b', '3d3f967e92fdf68c3af91ee56a7e903ae785440c38b1f3921acaaeb9bfce9cdb', '2026-10-10 16:26:00.295459+00', '20261010191500_add_product_default_image', NULL, NULL, '2026-10-10 16:26:00.290446+00', 1);
INSERT INTO public._prisma_migrations VALUES ('80a81aa3-a6f3-4478-b0ac-ae3bf0c74ee6', '174f143c40b8c4a28513c51f8a9b753810d2bbc8e2fcb201447ac1d74e8b33a1', '2026-10-14 08:30:01.746717+00', '20261014140000_product_crm_renew_months', NULL, NULL, '2026-10-14 08:30:01.740985+00', 1);
INSERT INTO public._prisma_migrations VALUES ('d0b5bd5d-762a-4946-a7b8-716994f72647', '8e59a0512b5e5de767b9d15a5849c41f3c5fa8a4399f6429e650795c660089e2', '2026-10-10 17:34:34.850066+00', '20261010195000_add_product_card_style', NULL, NULL, '2026-10-10 17:34:34.845391+00', 1);
INSERT INTO public._prisma_migrations VALUES ('6ef2116f-4940-478f-bbc4-e1f4c29a452a', 'bb31a872a1cdb8f0963c2bfcd3014f376d717c49dcb42a830426a80e5865a4a5', '2026-10-11 19:55:19.669309+00', '20261011224500_crm_subscription_options', NULL, NULL, '2026-10-11 19:55:19.662163+00', 1);
INSERT INTO public._prisma_migrations VALUES ('a59ecdb5-f1a9-4a97-b5de-d0a7f1a57e1b', 'a9839d84e69a5a14e3eec786562d89bf192be7447b6b7624b07a7d4c845a9f88', '2026-10-11 11:05:53.090682+00', '20261011140000_platform_tenants', NULL, NULL, '2026-10-11 11:05:53.076102+00', 1);
INSERT INTO public._prisma_migrations VALUES ('8140916c-7072-49c3-8751-e818ec92e00a', '07ff4798826c48d98c62f8cfb95ef3f0e13a4cd7ff2453a44a071c29d616c49e', '2026-10-11 13:20:00.517262+00', '20261011160000_tenant_support_tickets', NULL, NULL, '2026-10-11 13:20:00.49503+00', 1);
INSERT INTO public._prisma_migrations VALUES ('0331f96b-ab54-47de-bbd9-41638fe1d749', '5b7c2aab3e0e490de792d3563b97ba7f4a53569e9353c3ab5298f611880fb4b2', '2026-10-11 15:08:38.288665+00', '20261011180000_crm_tariff_plans', NULL, NULL, '2026-10-11 15:08:38.278259+00', 1);
INSERT INTO public._prisma_migrations VALUES ('be773c3c-2a15-4944-9f79-a8ed48b59b9e', 'ab711df423380ca189ba16c5efd977231abef4a48cdf4985d923af20fce942b9', '2026-10-15 14:15:23.834491+00', '20261015170000_user_calendar_theme', NULL, NULL, '2026-10-15 14:15:23.827688+00', 1);
INSERT INTO public._prisma_migrations VALUES ('9f123f6c-76f4-49ec-af45-1b6197200c25', 'f021d1e73d5ef720e722f94842d395891f5016a837a5c8f58aab8e0431aae601', '2026-10-11 22:19:12.432481+00', '20261012012000_crm_calls', NULL, NULL, '2026-10-11 22:19:12.426224+00', 1);
INSERT INTO public._prisma_migrations VALUES ('f20bc1c5-9591-420a-8d92-9114299ced93', '620e41a9218f61ff62dda63617efb5cf22d906684418ad6fcba38f140160a004', '2026-10-14 09:29:39.665229+00', '20261014150000_schedule_settings', NULL, NULL, '2026-10-14 09:29:39.653542+00', 1);
INSERT INTO public._prisma_migrations VALUES ('cdb6bfb0-99c9-45a3-900c-e6dc16c8b8da', '41bf312a64ef260c32a6dc66e1fbd7de0e45368e990a6f35e0500db5dcf885c7', '2026-10-11 23:08:13.300651+00', '20261012020000_crm_integrations', NULL, NULL, '2026-10-11 23:08:13.295336+00', 1);
INSERT INTO public._prisma_migrations VALUES ('9d616b3a-967b-4876-88a7-e4dc994c5933', '6186d2261cd19d275eaf6029777b4c2024e15a0761f9eccbdae49cc1cffa389d', '2026-10-13 18:07:07.631212+00', '20261013204500_help_articles', NULL, NULL, '2026-10-13 18:07:07.614158+00', 1);
INSERT INTO public._prisma_migrations VALUES ('20c71eb6-c372-4dd9-9c84-7b7a33fb8c02', '72ab017ac7872c8cd4c8963fafbc9cccb64959aff63ae2f8cafcbe9ce66e1d2d', '2026-10-13 19:08:41.003556+00', '20261014120000_schedule', NULL, NULL, '2026-10-13 19:08:40.958194+00', 1);
INSERT INTO public._prisma_migrations VALUES ('da941b60-5f9c-43fe-9d07-b2c62918eacf', '7218d83203d2d6b71d22d2d59ccadfc1cc12db0d79c03aeffe20e19d300cac33', '2026-10-15 09:00:09.758132+00', '20261015103000_role_show_calendar_metric', NULL, NULL, '2026-10-15 09:00:09.745693+00', 1);
INSERT INTO public._prisma_migrations VALUES ('78c74d13-5624-4eb9-87d0-8bcc5e5158ff', '80af48117d48a4494e028d7966bb83e2a17c10e1a26bac28d2432321f2d498a7', '2026-10-13 20:38:22.169439+00', '20261013210000_tenant_ticket_attachments', NULL, NULL, '2026-10-13 20:38:22.150311+00', 1);
INSERT INTO public._prisma_migrations VALUES ('38f925aa-aff8-412c-b818-9711e608c25d', 'edb74c1bcca8961cfdab0b8fb34d48fdf10aabe6b3e55131a36a998e96401f2b', '2026-10-15 12:28:07.262017+00', '20261015130000_user_calendar_timeline_pos', NULL, NULL, '2026-10-15 12:28:07.247653+00', 1);
INSERT INTO public._prisma_migrations VALUES ('d130fd95-878f-47ef-bf53-e5d790e8c3c9', '2b9dc1848a66362fef25f661e6b6074d3cc999380df5d79305757578aab15ca5', '2026-10-15 13:07:01.139637+00', '20261015160000_user_calendar_timeline_size', NULL, NULL, '2026-10-15 13:07:01.13274+00', 1);
INSERT INTO public._prisma_migrations VALUES ('dd6ec94b-024a-4652-be41-41198f8473a5', '069a4f85cd4956520869bd5be22ceb760dd07e7a77c43d2f38e8539fb62b0e37', NULL, '20261015213000_status_auto_change', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20261015213000_status_auto_change

Database error code: 42703

Database error:
ERROR: column "updatedAt" does not exist
HINT: Perhaps you meant to reference the column "reminders.updated_at".

Position:
[1m 19[0m CREATE INDEX "deals_status_changed_at_idx" ON "deals"("status_changed_at");
[1m 20[0m CREATE INDEX "reminders_status_changed_at_idx" ON "reminders"("status_changed_at");
[1m 21[0m
[1m 22[0m -- Бэкфилл: считаем, что сущности находятся в текущем статусе с момента последнего обновления
[1m 23[0m UPDATE "tasks" SET "status_changed_at" = "updatedAt" WHERE "status_changed_at" IS NULL;
[1m 24[1;31m UPDATE "projects" SET "status_changed_at" = "updatedAt" WHERE "status_changed_at" IS NULL;[0m

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42703), message: "column \"updatedAt\" does not exist", detail: None, hint: Some("Perhaps you meant to reference the column \"reminders.updated_at\"."), position: Some(Original(1666)), where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("parse_relation.c"), line: Some(3729), routine: Some("errorMissingColumn") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20261015213000_status_auto_change"
             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106
   1: schema_core::commands::apply_migrations::Applying migration
           with migration_name="20261015213000_status_auto_change"
             at schema-engine/core/src/commands/apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine/core/src/state.rs:226', '2026-10-15 18:39:49.893284+00', '2026-10-15 18:32:12.768913+00', 0);
INSERT INTO public._prisma_migrations VALUES ('4648f278-d9ff-43b4-95bb-612338d25046', '069a4f85cd4956520869bd5be22ceb760dd07e7a77c43d2f38e8539fb62b0e37', NULL, '20261015213000_status_auto_change', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20261015213000_status_auto_change

Database error code: 42703

Database error:
ERROR: column "updatedAt" does not exist
HINT: Perhaps you meant to reference the column "reminders.updated_at".

Position:
[1m 19[0m CREATE INDEX "deals_status_changed_at_idx" ON "deals"("status_changed_at");
[1m 20[0m CREATE INDEX "reminders_status_changed_at_idx" ON "reminders"("status_changed_at");
[1m 21[0m
[1m 22[0m -- Бэкфилл: считаем, что сущности находятся в текущем статусе с момента последнего обновления
[1m 23[0m UPDATE "tasks" SET "status_changed_at" = "updatedAt" WHERE "status_changed_at" IS NULL;
[1m 24[1;31m UPDATE "projects" SET "status_changed_at" = "updatedAt" WHERE "status_changed_at" IS NULL;[0m

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42703), message: "column \"updatedAt\" does not exist", detail: None, hint: Some("Perhaps you meant to reference the column \"reminders.updated_at\"."), position: Some(Original(1666)), where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("parse_relation.c"), line: Some(3729), routine: Some("errorMissingColumn") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20261015213000_status_auto_change"
             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106
   1: schema_core::commands::apply_migrations::Applying migration
           with migration_name="20261015213000_status_auto_change"
             at schema-engine/core/src/commands/apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine/core/src/state.rs:226', '2026-10-15 18:41:47.508723+00', '2026-10-15 18:40:24.389804+00', 0);
INSERT INTO public._prisma_migrations VALUES ('3a10861b-97d3-4d2a-92c0-2e6850bcbcbf', '95cf5a607326e34932a366477a4518507c960517b3b033a6db65071d3071ccef', '2026-10-15 18:41:49.556912+00', '20261015213000_status_auto_change', NULL, NULL, '2026-10-15 18:41:49.512264+00', 1);
INSERT INTO public._prisma_migrations VALUES ('a8292bc3-4f8f-4850-b2e0-ea9697b01ccf', '1bfcd143f97094ceb2bdc0549eb14f0aa3cd6c3349d85cd571ff7af04ae03651', '2026-10-15 19:00:19.694101+00', '20261015223000_status_auto_change_enabled_at', NULL, NULL, '2026-10-15 19:00:19.68778+00', 1);


--
-- PostgreSQL database dump complete
--

\unrestrict IudId30unGp84YkQToBGbIMYqPZpaZlwby0fEMw6RLGRTFFcM4wCkDU8gqQUeEQ

