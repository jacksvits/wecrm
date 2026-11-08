--
-- PostgreSQL database dump
--

\restrict kz6jBmrdcUfuplyrzYZbjnNTSBkz04REMOxA4X7rKb4iaRkW3gm2gbKjb8dgG7Z

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
-- Name: auth_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_events (
    id text NOT NULL,
    tenant_id text,
    tenant_slug text NOT NULL,
    tenant_name text NOT NULL,
    user_id text,
    login text NOT NULL,
    ip_address text NOT NULL,
    user_agent text NOT NULL,
    device text NOT NULL,
    client_type text NOT NULL,
    auth_method text NOT NULL,
    success boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    is_partner boolean DEFAULT false NOT NULL,
    update_time text DEFAULT '10:00'::text NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: branding; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branding (
    id integer DEFAULT 1 NOT NULL,
    icon_path text,
    logo_path text,
    dark_logo_path text,
    accent_color text,
    news_cover_path text,
    product_default_image_path text,
    product_card_style text,
    splash_enabled boolean DEFAULT true NOT NULL,
    splash_path text,
    default_theme text,
    timezone text DEFAULT 'UTC'::text NOT NULL,
    login_title text,
    login_accent text,
    login_subtitle text,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    label text DEFAULT 'Видеокамера'::text NOT NULL,
    ip text DEFAULT '192.168.8.10'::text NOT NULL,
    port integer DEFAULT 554 NOT NULL,
    channel text DEFAULT '102'::text NOT NULL,
    username text DEFAULT 'admin'::text NOT NULL,
    password text DEFAULT 'W22665588e'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: cdek_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cdek_settings (
    id integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    environment text DEFAULT 'test'::text NOT NULL,
    account text DEFAULT ''::text NOT NULL,
    secure_password text DEFAULT ''::text NOT NULL,
    access_token text DEFAULT ''::text NOT NULL,
    token_expires_at timestamp(3) without time zone,
    webhook_token text DEFAULT ''::text NOT NULL,
    sender_city_code integer,
    sender_company text DEFAULT ''::text NOT NULL,
    sender_name text DEFAULT ''::text NOT NULL,
    sender_phone text DEFAULT ''::text NOT NULL,
    sender_address text DEFAULT ''::text NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: cdek_shipments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cdek_shipments (
    id text NOT NULL,
    uuid text,
    cdek_number text,
    deal_id text,
    contact_id text,
    im_number text NOT NULL,
    tariff_code integer NOT NULL,
    delivery_mode text DEFAULT 'door'::text NOT NULL,
    delivery_sum double precision,
    currency text DEFAULT 'RUB'::text NOT NULL,
    from_city text DEFAULT ''::text NOT NULL,
    to_city text NOT NULL,
    to_address text DEFAULT ''::text NOT NULL,
    delivery_point_code text,
    recipient_name text NOT NULL,
    recipient_phone text NOT NULL,
    recipient_email text DEFAULT ''::text NOT NULL,
    weight_grams integer NOT NULL,
    length_cm integer,
    width_cm integer,
    height_cm integer,
    cod_amount integer DEFAULT 0 NOT NULL,
    declared_value integer DEFAULT 0 NOT NULL,
    item_name text DEFAULT ''::text NOT NULL,
    comment text DEFAULT ''::text NOT NULL,
    status_code text,
    status_name text,
    status_at timestamp(3) without time zone,
    status_history text,
    request_state text,
    last_error text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: chat_message_recipients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_message_recipients (
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    id text NOT NULL,
    message_id text NOT NULL,
    user_id text NOT NULL
);


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp(3) without time zone,
    "authorId" text NOT NULL,
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
-- Name: client_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_devices (
    id text NOT NULL,
    contact_id text NOT NULL,
    device_key text NOT NULL,
    token text NOT NULL,
    hostname text NOT NULL,
    username text DEFAULT ''::text NOT NULL,
    workgroup text DEFAULT ''::text NOT NULL,
    os_caption text DEFAULT ''::text NOT NULL,
    os_version text DEFAULT ''::text NOT NULL,
    os_build text DEFAULT ''::text NOT NULL,
    os_arch text DEFAULT ''::text NOT NULL,
    os_install_date timestamp(3) without time zone,
    manufacturer text DEFAULT ''::text NOT NULL,
    model text DEFAULT ''::text NOT NULL,
    serial_number text DEFAULT ''::text NOT NULL,
    cpu text DEFAULT ''::text NOT NULL,
    cpu_cores integer DEFAULT 0 NOT NULL,
    cpu_threads integer DEFAULT 0 NOT NULL,
    ram_total_mb integer DEFAULT 0 NOT NULL,
    disks jsonb DEFAULT '[]'::jsonb NOT NULL,
    pnp_devices jsonb DEFAULT '[]'::jsonb NOT NULL,
    ip_address text DEFAULT ''::text NOT NULL,
    mac_address text DEFAULT ''::text NOT NULL,
    gpu text DEFAULT ''::text NOT NULL,
    last_boot_at timestamp(3) without time zone,
    agent_version text DEFAULT ''::text NOT NULL,
    comment text DEFAULT ''::text NOT NULL,
    first_seen_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_seen_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    telegram_message_id text,
    id text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "authorId" text NOT NULL,
    "taskId" text NOT NULL,
    vk_message_id integer,
    max_message_id text,
    is_internal boolean DEFAULT false NOT NULL,
    pinned_at timestamp(3) without time zone
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
    for_vitrine boolean DEFAULT false NOT NULL,
    for_vk boolean DEFAULT false NOT NULL,
    is_visible boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    telegram_chat_id text,
    telegram_user_id text,
    id text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    emails text[] DEFAULT ARRAY[]::text[],
    phones text[] DEFAULT ARRAY[]::text[],
    type text DEFAULT 'client'::text NOT NULL,
    kind text DEFAULT 'contact'::text NOT NULL,
    tags text[] DEFAULT ARRAY[]::text[],
    notes text,
    vk_user_id bigint,
    vk_profile_url text,
    max_chat_id text,
    max_user_id text,
    onec_id text,
    avatar_url text,
    description text,
    is_spam boolean DEFAULT false NOT NULL,
    last_activity_time timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    inn text,
    ogrn text,
    legal_address text,
    "position" text,
    birth_date timestamp(3) without time zone,
    address text,
    telegram_username text,
    organization_id text,
    client_key text
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
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    status_changed_at timestamp(3) without time zone,
    probability integer DEFAULT 10 NOT NULL,
    "expectedClose" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "contactId" text,
    "projectId" text
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
    assignee_ids text[] DEFAULT ARRAY[]::text[],
    priority text,
    status text,
    mark_read boolean,
    move_to_folder text,
    is_spam boolean DEFAULT false NOT NULL,
    parse_rules jsonb,
    stop_processing boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
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
    secure boolean DEFAULT true NOT NULL,
    "rejectUnauthorized" boolean DEFAULT false NOT NULL,
    "requireTLS" boolean DEFAULT true NOT NULL,
    "markAsRead" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
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
-- Name: file_download_counts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.file_download_counts (
    id text NOT NULL,
    tab_key text NOT NULL,
    file_path text NOT NULL,
    count integer DEFAULT 0 NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: file_hide_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.file_hide_settings (
    id text NOT NULL,
    names text DEFAULT ''::text NOT NULL,
    theme text DEFAULT 'win7'::text NOT NULL,
    view_mode text DEFAULT 'icons'::text NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: file_tab_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.file_tab_settings (
    path text DEFAULT ''::text NOT NULL,
    id text NOT NULL,
    tab_key text NOT NULL,
    url text DEFAULT ''::text NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
-- Name: hikvision_plugin_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hikvision_plugin_settings (
    id integer DEFAULT 1 NOT NULL,
    login text DEFAULT ''::text NOT NULL,
    password text DEFAULT ''::text NOT NULL,
    validate_code text DEFAULT ''::text NOT NULL,
    api_base_url text DEFAULT 'https://api.hik-connect.com'::text NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: legal_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.legal_documents (
    id integer DEFAULT 1 NOT NULL,
    offer text DEFAULT ''::text NOT NULL,
    privacy text DEFAULT ''::text NOT NULL,
    cookies text DEFAULT ''::text NOT NULL,
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
-- Name: mail_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mail_accounts (
    id text NOT NULL,
    user_id text NOT NULL,
    label text DEFAULT ''::text NOT NULL,
    email text NOT NULL,
    imap_host text NOT NULL,
    imap_port integer DEFAULT 993 NOT NULL,
    imap_user text NOT NULL,
    imap_pass text NOT NULL,
    smtp_host text NOT NULL,
    smtp_port integer DEFAULT 465 NOT NULL,
    smtp_user text NOT NULL,
    smtp_pass text NOT NULL,
    secure boolean DEFAULT true NOT NULL,
    reject_unauthorized boolean DEFAULT false NOT NULL,
    signature text DEFAULT ''::text NOT NULL,
    sig_on_new boolean DEFAULT true NOT NULL,
    sig_on_reply boolean DEFAULT true NOT NULL,
    sig_on_forward boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
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
    default_creator_id text,
    assignee_ids text[] DEFAULT ARRAY[]::text[],
    auto_create_contact boolean DEFAULT true NOT NULL,
    auto_reply boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
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
    pinned_to_home boolean DEFAULT false NOT NULL,
    published_at timestamp(3) without time zone,
    views integer DEFAULT 0 NOT NULL,
    labels text[] DEFAULT ARRAY[]::text[],
    "authorId" text NOT NULL,
    "categoryId" text,
    "subcategoryId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
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
    pinned_to_home boolean DEFAULT false NOT NULL,
    "editorId" text NOT NULL,
    "editorName" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    entity_sync jsonb,
    kind_folder text DEFAULT ''::text NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ozon_seller_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ozon_seller_settings (
    id integer DEFAULT 1 NOT NULL,
    client_id text DEFAULT ''::text NOT NULL,
    api_key text DEFAULT ''::text NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    auto_sync boolean DEFAULT true NOT NULL,
    products_mode text DEFAULT 'to_ozon'::text NOT NULL,
    prices_mode text DEFAULT 'to_ozon'::text NOT NULL,
    stocks_mode text DEFAULT 'to_ozon'::text NOT NULL,
    products_interval_minutes integer DEFAULT 60 NOT NULL,
    prices_interval_minutes integer DEFAULT 60 NOT NULL,
    stocks_interval_minutes integer DEFAULT 60 NOT NULL,
    stock_warehouse_id text,
    default_type_id integer,
    last_sync_at timestamp(3) without time zone,
    last_sync_result text,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    is_retail boolean DEFAULT false NOT NULL,
    for_cashless boolean DEFAULT false NOT NULL,
    for_ozon boolean DEFAULT false NOT NULL,
    for_wb boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_categories (
    id text NOT NULL,
    onec_id text,
    name text NOT NULL,
    is_group boolean DEFAULT true NOT NULL,
    ozon_type_id integer,
    is_crm_tariff boolean DEFAULT false NOT NULL,
    parent_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
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
    updated_at timestamp(3) without time zone NOT NULL
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
    status text DEFAULT 'active'::text NOT NULL,
    ends_at timestamp(3) without time zone,
    comment text DEFAULT ''::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id text NOT NULL,
    sku text,
    article text,
    name text NOT NULL,
    kind text DEFAULT 'product'::text NOT NULL,
    description text,
    category text,
    subcategory text,
    unit text DEFAULT 'шт'::text NOT NULL,
    barcode text,
    weight double precision,
    width double precision,
    height double precision,
    depth double precision,
    brand text,
    tnved text,
    source text DEFAULT 'system'::text NOT NULL,
    sync_to_vk boolean DEFAULT false NOT NULL,
    vk_item_id integer,
    sync_to_ozon boolean DEFAULT false NOT NULL,
    ozon_product_id bigint,
    ozon_synced_at timestamp(3) without time zone,
    sync_to_wb boolean DEFAULT false NOT NULL,
    wb_product_id bigint,
    wb_synced_at timestamp(3) without time zone,
    onec_id text,
    onec_synced_at timestamp(3) without time zone,
    is_active boolean DEFAULT true NOT NULL,
    on_vitrine boolean DEFAULT false NOT NULL,
    is_subscription boolean DEFAULT false NOT NULL,
    tags text[] DEFAULT ARRAY[]::text[],
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    category_id text,
    crm_allowed_pages jsonb,
    pay_link text,
    crm_renew_months integer,
    crm_cameras boolean DEFAULT false NOT NULL,
    crm_subscriptions boolean DEFAULT false NOT NULL,
    crm_accounting boolean DEFAULT false NOT NULL,
    crm_video_notes boolean DEFAULT false NOT NULL,
    crm_calls boolean DEFAULT false NOT NULL,
    crm_integrations jsonb
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
    status_changed_at timestamp(3) without time zone,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    progress integer DEFAULT 0 NOT NULL,
    is_locked boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    parent_id text
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
    button_style text DEFAULT 'blue'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
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
    label2 text DEFAULT 'Псковлайн телефон'::text NOT NULL,
    login2 text DEFAULT 'upl69777'::text NOT NULL,
    password2 text DEFAULT 'i9rmh2s9'::text NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
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
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    status_changed_at timestamp(3) without time zone,
    remind_at timestamp(3) without time zone NOT NULL,
    notify_before_min integer DEFAULT 0 NOT NULL,
    repeat text DEFAULT 'none'::text NOT NULL,
    repeat_end_at timestamp(3) without time zone,
    last_notified_at timestamp(3) without time zone,
    completed_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
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
    payment_method text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    issued_at timestamp(3) without time zone
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
    allowedpages text[] DEFAULT ARRAY[]::text[],
    isassignable boolean DEFAULT true NOT NULL,
    can_access_chat boolean DEFAULT true NOT NULL,
    show_finances_tab boolean DEFAULT false NOT NULL,
    stock_access boolean DEFAULT true NOT NULL,
    can_change_task_status boolean DEFAULT true NOT NULL,
    allowed_task_statuses text[] DEFAULT ARRAY[]::text[],
    can_create_news boolean DEFAULT true NOT NULL,
    can_edit_news boolean DEFAULT true NOT NULL,
    can_handle_spam boolean DEFAULT false NOT NULL,
    can_access_projects boolean DEFAULT false NOT NULL,
    can_access_support_chat boolean DEFAULT false NOT NULL,
    can_see_all_support_tickets boolean DEFAULT false NOT NULL,
    show_calendar_metric boolean DEFAULT true NOT NULL,
    is_system_handler boolean DEFAULT false NOT NULL,
    notify_on_new_task boolean DEFAULT true NOT NULL,
    notify_on_new_deal boolean DEFAULT false NOT NULL,
    notify_on_new_comment boolean DEFAULT false NOT NULL,
    notify_on_new_chat boolean DEFAULT false NOT NULL,
    notify_on_new_call boolean DEFAULT false NOT NULL,
    notify_on_new_news boolean DEFAULT false NOT NULL,
    can_read_contact_accesses boolean DEFAULT true NOT NULL,
    can_edit_contact_accesses boolean DEFAULT false NOT NULL,
    can_delete_contact_accesses boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: sale_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_items (
    id text NOT NULL,
    "saleId" text NOT NULL,
    "productId" text NOT NULL,
    quantity numeric(65,30) NOT NULL,
    price numeric(65,30) NOT NULL,
    sum numeric(65,30) NOT NULL
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
    total numeric(65,30) DEFAULT 0 NOT NULL,
    status text DEFAULT 'new'::text NOT NULL,
    "paymentMethod" text,
    "paymentId" text,
    "paidAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
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
    task_id text,
    received_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    auto_change_enabled boolean DEFAULT false NOT NULL,
    auto_change_enabled_at timestamp(3) without time zone,
    auto_change_minutes integer,
    auto_change_to_status_id text
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
-- Name: tapo_plugin_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tapo_plugin_settings (
    id integer DEFAULT 1 NOT NULL,
    login text DEFAULT ''::text NOT NULL,
    password text DEFAULT ''::text NOT NULL,
    extra_cameras text DEFAULT '[]'::text NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: task_favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_favorites (
    id text NOT NULL,
    "taskId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    telegram_message_id text,
    telegram_chat_id text,
    telegram_user_id text,
    id text NOT NULL,
    title text NOT NULL,
    description text,
    status text DEFAULT 'open'::text NOT NULL,
    status_changed_at timestamp(3) without time zone,
    priority text DEFAULT 'medium'::text NOT NULL,
    "dueDate" timestamp(3) without time zone,
    "startDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "creatorId" text NOT NULL,
    support_owner_id text,
    "projectId" text,
    "contactId" text,
    "dealId" text,
    parent_id text,
    "emailMessageId" text,
    "sourceEmail" text,
    vk_peer_id bigint,
    vk_group_id integer,
    vk_message_id integer,
    max_chat_id text,
    max_user_id text,
    max_message_id text,
    budget double precision DEFAULT 0,
    price double precision DEFAULT 0,
    address text,
    ticket_number integer NOT NULL
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
    auto_reply boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    user_id text
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
    web_rtc_enabled boolean DEFAULT false NOT NULL,
    api_key text NOT NULL,
    api_secret text NOT NULL,
    virtual_number text,
    webhook_secret text,
    auto_create_contact boolean DEFAULT true NOT NULL,
    auto_create_task boolean DEFAULT false NOT NULL,
    auto_create_task_on_incoming boolean DEFAULT false NOT NULL,
    auto_create_task_on_outgoing boolean DEFAULT false NOT NULL,
    auto_create_task_on_sms boolean DEFAULT false NOT NULL,
    auto_attach_record boolean DEFAULT false NOT NULL,
    notify_admins_on_sms boolean DEFAULT false NOT NULL,
    default_iov_employee_id integer,
    default_iov_employee_name text,
    default_user_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
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
    task_id text,
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
    plan_product_id text,
    price_per_month integer,
    paid_until timestamp(3) without time zone,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    activated_at timestamp(3) without time zone,
    payment_info text
);


--
-- Name: tochka_acquiring_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tochka_acquiring_payments (
    id text NOT NULL,
    sale_id text,
    subscription_id text,
    order_id text NOT NULL,
    payment_id text,
    amount integer NOT NULL,
    method text NOT NULL,
    status text DEFAULT 'created'::text NOT NULL,
    payment_url text,
    qr_data text,
    paid_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
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
    username text,
    password text NOT NULL,
    name text NOT NULL,
    avatar text,
    emails text[] DEFAULT ARRAY[]::text[],
    "roleId" text,
    "hideCompletedTasks" boolean DEFAULT true NOT NULL,
    "darkTheme" boolean DEFAULT false NOT NULL,
    calendar_timeline_pos text DEFAULT 'bottom'::text NOT NULL,
    calendar_timeline_size integer DEFAULT 420 NOT NULL,
    calendar_theme text DEFAULT 'classic'::text NOT NULL,
    can_be_curator boolean DEFAULT false NOT NULL,
    stock_access boolean DEFAULT false NOT NULL,
    default_task_assignee boolean DEFAULT false NOT NULL,
    default_task_curator boolean DEFAULT false NOT NULL,
    last_active_at timestamp(3) without time zone,
    allowed_pages text[] DEFAULT ARRAY[]::text[],
    mobile_nav text[] DEFAULT ARRAY[]::text[],
    timezone text,
    push_enabled boolean DEFAULT true NOT NULL,
    notify_task boolean DEFAULT true NOT NULL,
    notify_comment boolean DEFAULT true NOT NULL,
    notify_chat boolean DEFAULT true NOT NULL,
    notify_call boolean DEFAULT true NOT NULL,
    notify_deal boolean DEFAULT true NOT NULL,
    notify_news boolean DEFAULT true NOT NULL,
    sound_enabled boolean DEFAULT true NOT NULL,
    novofon_extension text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: vitrine_favorite_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vitrine_favorite_groups (
    id text NOT NULL,
    name text NOT NULL,
    "ownerId" text NOT NULL,
    shared_by_id text,
    shared_by_name text,
    share_token text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: vitrine_favorite_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vitrine_favorite_items (
    id text NOT NULL,
    "groupId" text NOT NULL,
    "productId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: vk_auth_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vk_auth_settings (
    id text NOT NULL,
    app_id integer,
    client_secret text,
    redirect_uri text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: vk_community_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vk_community_settings (
    id text NOT NULL,
    group_id integer NOT NULL,
    access_token text NOT NULL,
    default_creator_id text,
    default_project_id text,
    assignee_ids text[] DEFAULT ARRAY[]::text[],
    auto_create_contact boolean DEFAULT true NOT NULL,
    auto_reply boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_ts integer,
    callback_secret text,
    confirmation_string text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: vk_market_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vk_market_settings (
    id text NOT NULL,
    group_id integer NOT NULL,
    market_token text,
    market_refresh_token text,
    market_device_id text,
    market_token_expires_at timestamp(3) without time zone,
    market_app_id integer,
    market_app_secret text,
    is_active boolean DEFAULT true NOT NULL,
    auto_sync boolean DEFAULT true NOT NULL,
    products_mode text DEFAULT 'to_vk'::text NOT NULL,
    prices_mode text DEFAULT 'to_vk'::text NOT NULL,
    stocks_mode text DEFAULT 'to_vk'::text NOT NULL,
    products_interval_minutes integer DEFAULT 60 NOT NULL,
    prices_interval_minutes integer DEFAULT 60 NOT NULL,
    stocks_interval_minutes integer DEFAULT 60 NOT NULL,
    last_sync_at timestamp(3) without time zone,
    last_sync_result text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
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
-- Name: wb_seller_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wb_seller_settings (
    id integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    auto_sync boolean DEFAULT true NOT NULL,
    api_key text DEFAULT ''::text NOT NULL,
    default_subject_id integer,
    products_mode text DEFAULT 'from_wb'::text NOT NULL,
    prices_mode text DEFAULT 'from_wb'::text NOT NULL,
    stocks_mode text DEFAULT 'from_wb'::text NOT NULL,
    products_interval_minutes integer DEFAULT 60 NOT NULL,
    prices_interval_minutes integer DEFAULT 60 NOT NULL,
    stocks_interval_minutes integer DEFAULT 60 NOT NULL,
    stock_warehouse_id text,
    last_sync_at timestamp(3) without time zone,
    last_sync_result text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
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
-- Name: auth_events auth_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_events
    ADD CONSTRAINT auth_events_pkey PRIMARY KEY (id);


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
-- Name: cdek_settings cdek_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cdek_settings
    ADD CONSTRAINT cdek_settings_pkey PRIMARY KEY (id);


--
-- Name: cdek_shipments cdek_shipments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cdek_shipments
    ADD CONSTRAINT cdek_shipments_pkey PRIMARY KEY (id);


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
-- Name: client_devices client_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_devices
    ADD CONSTRAINT client_devices_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


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
-- Name: contact_types contact_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_types
    ADD CONSTRAINT contact_types_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


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
-- Name: file_download_counts file_download_counts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_download_counts
    ADD CONSTRAINT file_download_counts_pkey PRIMARY KEY (id);


--
-- Name: file_hide_settings file_hide_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_hide_settings
    ADD CONSTRAINT file_hide_settings_pkey PRIMARY KEY (id);


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
-- Name: hikvision_plugin_settings hikvision_plugin_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hikvision_plugin_settings
    ADD CONSTRAINT hikvision_plugin_settings_pkey PRIMARY KEY (id);


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
-- Name: mail_accounts mail_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mail_accounts
    ADD CONSTRAINT mail_accounts_pkey PRIMARY KEY (id);


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
-- Name: tapo_plugin_settings tapo_plugin_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tapo_plugin_settings
    ADD CONSTRAINT tapo_plugin_settings_pkey PRIMARY KEY (id);


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
-- Name: task_favorites task_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_favorites
    ADD CONSTRAINT task_favorites_pkey PRIMARY KEY (id);


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
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


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
-- Name: vitrine_favorite_groups vitrine_favorite_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vitrine_favorite_groups
    ADD CONSTRAINT vitrine_favorite_groups_pkey PRIMARY KEY (id);


--
-- Name: vitrine_favorite_items vitrine_favorite_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vitrine_favorite_items
    ADD CONSTRAINT vitrine_favorite_items_pkey PRIMARY KEY (id);


--
-- Name: vk_auth_settings vk_auth_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vk_auth_settings
    ADD CONSTRAINT vk_auth_settings_pkey PRIMARY KEY (id);


--
-- Name: vk_community_settings vk_community_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vk_community_settings
    ADD CONSTRAINT vk_community_settings_pkey PRIMARY KEY (id);


--
-- Name: vk_market_settings vk_market_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vk_market_settings
    ADD CONSTRAINT vk_market_settings_pkey PRIMARY KEY (id);


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
-- Name: wb_seller_settings wb_seller_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wb_seller_settings
    ADD CONSTRAINT wb_seller_settings_pkey PRIMARY KEY (id);


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
-- Name: auth_events_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auth_events_created_at_idx ON public.auth_events USING btree (created_at);


--
-- Name: auth_events_tenant_slug_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auth_events_tenant_slug_created_at_idx ON public.auth_events USING btree (tenant_slug, created_at);


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
-- Name: cdek_shipments_contact_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cdek_shipments_contact_id_idx ON public.cdek_shipments USING btree (contact_id);


--
-- Name: cdek_shipments_deal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cdek_shipments_deal_id_idx ON public.cdek_shipments USING btree (deal_id);


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
-- Name: client_devices_contact_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_devices_contact_id_idx ON public.client_devices USING btree (contact_id);


--
-- Name: client_devices_device_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX client_devices_device_key_key ON public.client_devices USING btree (device_key);


--
-- Name: client_devices_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX client_devices_token_key ON public.client_devices USING btree (token);


--
-- Name: comments_max_message_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX comments_max_message_id_key ON public.comments USING btree (max_message_id);


--
-- Name: comments_taskId_pinned_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "comments_taskId_pinned_at_idx" ON public.comments USING btree ("taskId", pinned_at);


--
-- Name: comments_telegram_message_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX comments_telegram_message_id_key ON public.comments USING btree (telegram_message_id);


--
-- Name: comments_vk_message_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX comments_vk_message_id_key ON public.comments USING btree (vk_message_id);


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
-- Name: contact_types_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX contact_types_name_key ON public.contact_types USING btree (name);


--
-- Name: contacts_client_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX contacts_client_key_key ON public.contacts USING btree (client_key);


--
-- Name: contacts_max_chat_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX contacts_max_chat_id_key ON public.contacts USING btree (max_chat_id);


--
-- Name: contacts_onec_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contacts_onec_id_idx ON public.contacts USING btree (onec_id);


--
-- Name: contacts_vk_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX contacts_vk_user_id_key ON public.contacts USING btree (vk_user_id);


--
-- Name: dashboard_metric_settings_user_id_metric_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX dashboard_metric_settings_user_id_metric_key_key ON public.dashboard_metric_settings USING btree (user_id, metric_key);


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
-- Name: file_download_counts_tab_key_file_path_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX file_download_counts_tab_key_file_path_key ON public.file_download_counts USING btree (tab_key, file_path);


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
-- Name: mail_accounts_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mail_accounts_user_id_idx ON public.mail_accounts USING btree (user_id);


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
-- Name: sales_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX sales_number_key ON public.sales USING btree (number);


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
-- Name: statuses_entity_type_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX statuses_entity_type_name_key ON public.statuses USING btree (entity_type, name);


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
-- Name: task_curators_taskId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "task_curators_taskId_userId_key" ON public.task_curators USING btree ("taskId", "userId");


--
-- Name: task_curators_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "task_curators_userId_idx" ON public.task_curators USING btree ("userId");


--
-- Name: task_favorites_taskId_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "task_favorites_taskId_userId_idx" ON public.task_favorites USING btree ("taskId", "userId");


--
-- Name: task_favorites_taskId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "task_favorites_taskId_userId_key" ON public.task_favorites USING btree ("taskId", "userId");


--
-- Name: task_favorites_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "task_favorites_userId_idx" ON public.task_favorites USING btree ("userId");


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
-- Name: tasks_max_message_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tasks_max_message_id_key ON public.tasks USING btree (max_message_id);


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
-- Name: tasks_status_dueDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "tasks_status_dueDate_idx" ON public.tasks USING btree (status, "dueDate");


--
-- Name: tasks_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_status_idx ON public.tasks USING btree (status);


--
-- Name: tasks_telegram_message_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tasks_telegram_message_id_key ON public.tasks USING btree (telegram_message_id);


--
-- Name: tasks_ticket_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tasks_ticket_number_key ON public.tasks USING btree (ticket_number);


--
-- Name: tasks_vk_message_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tasks_vk_message_id_key ON public.tasks USING btree (vk_message_id);


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
-- Name: tenant_tickets_task_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_tickets_task_id_idx ON public.tenant_tickets USING btree (task_id);


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
-- Name: vitrine_favorite_groups_ownerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "vitrine_favorite_groups_ownerId_idx" ON public.vitrine_favorite_groups USING btree ("ownerId");


--
-- Name: vitrine_favorite_groups_share_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX vitrine_favorite_groups_share_token_key ON public.vitrine_favorite_groups USING btree (share_token);


--
-- Name: vitrine_favorite_items_groupId_productId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "vitrine_favorite_items_groupId_productId_key" ON public.vitrine_favorite_items USING btree ("groupId", "productId");


--
-- Name: vitrine_favorite_items_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "vitrine_favorite_items_productId_idx" ON public.vitrine_favorite_items USING btree ("productId");


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
-- Name: cdek_shipments cdek_shipments_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cdek_shipments
    ADD CONSTRAINT cdek_shipments_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cdek_shipments cdek_shipments_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cdek_shipments
    ADD CONSTRAINT cdek_shipments_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
-- Name: client_devices client_devices_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_devices
    ADD CONSTRAINT client_devices_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: mail_accounts mail_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mail_accounts
    ADD CONSTRAINT mail_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: sale_items sale_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT "sale_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sale_items sale_items_saleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT "sale_items_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES public.sales(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sales sales_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT "sales_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sales sales_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT "sales_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sales sales_warehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT "sales_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES public.warehouses(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
-- Name: task_favorites task_favorites_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_favorites
    ADD CONSTRAINT "task_favorites_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_favorites task_favorites_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_favorites
    ADD CONSTRAINT "task_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: tasks tasks_support_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_support_owner_id_fkey FOREIGN KEY (support_owner_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
-- Name: tenant_ticket_messages tenant_ticket_messages_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_ticket_messages
    ADD CONSTRAINT tenant_ticket_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tenant_tickets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tochka_acquiring_payments tochka_acquiring_payments_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tochka_acquiring_payments
    ADD CONSTRAINT tochka_acquiring_payments_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tochka_acquiring_payments tochka_acquiring_payments_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tochka_acquiring_payments
    ADD CONSTRAINT tochka_acquiring_payments_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.product_subscriptions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: vitrine_favorite_groups vitrine_favorite_groups_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vitrine_favorite_groups
    ADD CONSTRAINT "vitrine_favorite_groups_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vitrine_favorite_items vitrine_favorite_items_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vitrine_favorite_items
    ADD CONSTRAINT "vitrine_favorite_items_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public.vitrine_favorite_groups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vitrine_favorite_items vitrine_favorite_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vitrine_favorite_items
    ADD CONSTRAINT "vitrine_favorite_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vk_community_settings vk_community_settings_default_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vk_community_settings
    ADD CONSTRAINT vk_community_settings_default_creator_id_fkey FOREIGN KEY (default_creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: vk_community_settings vk_community_settings_default_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vk_community_settings
    ADD CONSTRAINT vk_community_settings_default_project_id_fkey FOREIGN KEY (default_project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


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

\unrestrict kz6jBmrdcUfuplyrzYZbjnNTSBkz04REMOxA4X7rKb4iaRkW3gm2gbKjb8dgG7Z

--
-- PostgreSQL database dump
--

\restrict rftW7ZqBwYwmw3EIu4Nl1oFZy0nWGIF0FGXeabxxmi0baAKYnfSTxvY4m30RmjU

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

INSERT INTO public._prisma_migrations VALUES ('324cf7a9-f279-4cb5-9755-168724037cd8', '7111e9ee5be440013341be7db6c23462007c0e35e5b8616388e35002061c7d43', '2026-11-08 21:11:10.511612+00', '20250829130000_add_pskovline_balance', '', NULL, '2026-11-08 21:11:10.511612+00', 0);
INSERT INTO public._prisma_migrations VALUES ('127033fa-a0b1-4047-9394-4e8f7193ebc2', '587c9548ba5a5f2dbd9d257606a62afba85afe7a05ca0f49fa7ed1d484cb7397', '2026-11-08 21:11:11.900058+00', '20250829132200_add_pskovline_settings', '', NULL, '2026-11-08 21:11:11.900058+00', 0);
INSERT INTO public._prisma_migrations VALUES ('7ead181d-3b24-4c8f-9d12-8fad04a23d6e', '23fee488728b3e9bf81d5b08c3476b79713ac77bcb7587e60808798b623bbb2d', '2026-11-08 21:11:13.307525+00', '20250829140000_add_pskovline_account2', '', NULL, '2026-11-08 21:11:13.307525+00', 0);
INSERT INTO public._prisma_migrations VALUES ('ccfbc8c5-7493-4f23-beda-f7eb76c68877', '42f8fc283457bf8cc9fe9bce7d0a3ebda0f5325e3e7f1ca3a3e3aadd8dc95e80', '2026-11-08 21:11:14.754262+00', '20250831_add_task_finances', '', NULL, '2026-11-08 21:11:14.754262+00', 0);
INSERT INTO public._prisma_migrations VALUES ('33fa8cc1-49c4-42f8-8e39-676ab68a3d3b', '83790efa03cea011af990a8ab55c4c16632f9cfd314c262a6caf388d530ed15b', '2026-11-08 21:11:16.150053+00', '20250831_add_vk_comment', '', NULL, '2026-11-08 21:11:16.150053+00', 0);
INSERT INTO public._prisma_migrations VALUES ('df2ae000-bd6a-43e4-af02-32bed4c9bb50', '0f5943e98192d6ce0d2781b1d5f8cb8ccfba9d996f0bf8b438a956f1b3959c80', '2026-11-08 21:11:17.557106+00', '20250831_add_vk_group', '', NULL, '2026-11-08 21:11:17.557106+00', 0);
INSERT INTO public._prisma_migrations VALUES ('265e9f43-a144-4978-8bbc-64e137d0261b', 'cc4f2669c58ed9cc43b5a55028c81f22a9dc91e91fe51fdffcce4b8416955a04', '2026-11-08 21:11:19.025582+00', '20250904235500_add_telegram', '', NULL, '2026-11-08 21:11:19.025582+00', 0);
INSERT INTO public._prisma_migrations VALUES ('50415dbb-c5e8-4d07-920e-26644bb0dfb3', '8961fb3f58b2de2c6f88de5ac1e410662fe9a3181cfb7b7c5331b6f05ed10f7d', '2026-11-08 21:11:20.457513+00', '20250905_enable_push_default', '', NULL, '2026-11-08 21:11:20.457513+00', 0);
INSERT INTO public._prisma_migrations VALUES ('b4d01a07-e549-4deb-98db-4af496c5b0a1', '5b9d38a5e642da78b3a9758339291b533cd09e254cb6ff1a35d73034c76e07ad', '2026-11-08 21:11:21.826924+00', '20250906_add_is_visible_to_contact_types', '', NULL, '2026-11-08 21:11:21.826924+00', 0);
INSERT INTO public._prisma_migrations VALUES ('196ae1ab-d038-49da-b143-c10d4cae45e4', '43e538a62ff509e4f764b41ca0172d0f9d76e51faaaed863bab5c7eb16c221c5', '2026-11-08 21:11:23.199463+00', '20260823224514_init', '', NULL, '2026-11-08 21:11:23.199463+00', 0);
INSERT INTO public._prisma_migrations VALUES ('cbd9a144-22ca-432d-a846-ddd2c64accf2', 'c6b03e4d7af6f0d95ebb6cb6a53d402aedf763e1826ce0389e6c7dc87f030596', '2026-11-08 21:11:24.629443+00', '20260824000000_add_roles', '', NULL, '2026-11-08 21:11:24.629443+00', 0);
INSERT INTO public._prisma_migrations VALUES ('595999d0-0947-4d53-9fc9-43b00aeb991c', '75b7a317b567d93902bbb064ad6d5c29a706f62c01dcc7a76fa4dfa2e71fc8c5', '2026-11-08 21:11:26.075524+00', '20260824150825_multi_assignee', '', NULL, '2026-11-08 21:11:26.075524+00', 0);
INSERT INTO public._prisma_migrations VALUES ('9f34edcd-1874-414b-8e88-82a1df7d60e1', '7fcecefef0445e6221b9707736fdf9b933f073f8cc9d303eb967f4ecf1616fb1', '2026-11-08 21:11:27.505436+00', '20260824162843_push_notifications', '', NULL, '2026-11-08 21:11:27.505436+00', 0);
INSERT INTO public._prisma_migrations VALUES ('2ae3a466-1ef9-4f16-8add-46b4bb39cc73', '01bd3f5dc826fb6a72823fd2f21a28e9a878875efafb74345526afa39cd5ea95', '2026-11-08 21:11:28.953063+00', '20260824230000_add_email_fields', '', NULL, '2026-11-08 21:11:28.953063+00', 0);
INSERT INTO public._prisma_migrations VALUES ('b78b4354-8c27-4964-8ad4-3f7d8b0d5b3c', 'b4b9013e9166e6333b4efe0950f9ab0f0110cc31fca31a4ba46470d00c339ec3', '2026-11-08 21:11:30.342169+00', '20260824235000_add_email_settings', '', NULL, '2026-11-08 21:11:30.342169+00', 0);
INSERT INTO public._prisma_migrations VALUES ('bcf597d1-92fe-4879-aa9a-e4bab80e3146', '5a7843b7d519e39228bef1e98ae1785800293afc159be43751c6fd10cfaa90cf', '2026-11-08 21:11:31.766562+00', '20260824240000_add_email_tls_options', '', NULL, '2026-11-08 21:11:31.766562+00', 0);
INSERT INTO public._prisma_migrations VALUES ('d70b6ab0-83b0-4734-89b5-6d9cf1ec9ac9', '436da7eceea50d6dfa9a1b3af022835a1244fd240c15f717692b62331525c371', '2026-11-08 21:11:33.195887+00', '20260824241000_add_require_tls', '', NULL, '2026-11-08 21:11:33.195887+00', 0);
INSERT INTO public._prisma_migrations VALUES ('ee1bcf9d-da93-4fe5-8c3e-c7970de0657b', '698f28d22c3e1c05c60a2bd55daa5b9bc690ddfeac75adb57a1333454b9dac04', '2026-11-08 21:11:34.682116+00', '20260825044300_add_chat_message', '', NULL, '2026-11-08 21:11:34.682116+00', 0);
INSERT INTO public._prisma_migrations VALUES ('60ebf948-da49-4617-8cef-3ff342c3fee8', 'ea8ccf13bda918e2c4ad3f9d3d4236b6206d2e31d2825ec676d4b7547b52b39f', '2026-11-08 21:11:36.117554+00', '20260825060000_add_file_attachments', '', NULL, '2026-11-08 21:11:36.117554+00', 0);
INSERT INTO public._prisma_migrations VALUES ('db32affb-c95e-4d42-a3a9-cbadaf4511a8', '9c15195a44f3d00de61433a0078eddc115bcf5f03154c809e990afa39c5f61e6', '2026-11-08 21:11:37.581794+00', '20260825070000_add_hide_completed_tasks', '', NULL, '2026-11-08 21:11:37.581794+00', 0);
INSERT INTO public._prisma_migrations VALUES ('cef35fe3-7668-4292-b976-64891b831552', '279f8a2df02e31cd5c0610abd6e164e7d89682cdff221c752dd9f1788d477970', '2026-11-08 21:11:38.983638+00', '20260825080000_add_dark_theme', '', NULL, '2026-11-08 21:11:38.983638+00', 0);
INSERT INTO public._prisma_migrations VALUES ('e3521187-ed6b-4da0-a31e-5d8d8a4dada5', '0d12901a907049f1bf75f876c20aabdc90b3f22c7418e3bd25c90de5583d75dc', '2026-11-08 21:11:40.469481+00', '20260826000000_add_telephony', '', NULL, '2026-11-08 21:11:40.469481+00', 0);
INSERT INTO public._prisma_migrations VALUES ('0acf1bc0-f668-4288-a8d0-58b457deb805', '6d7b01e72d66ab4337b1bee50c1c642d6a5d139a857a0bec021561758a23cfed', '2026-11-08 21:11:41.924964+00', '20260827110000_add_parent_id', '', NULL, '2026-11-08 21:11:41.924964+00', 0);
INSERT INTO public._prisma_migrations VALUES ('24c92872-b800-4f31-a9d3-1c225e35a5af', '892eb02357dfa10a8d4deb9929a301d3d595f0a6917a1aa403b9323cf5b9ecf5', '2026-11-08 21:11:43.350276+00', '20260827160000_add_role_pages', '', NULL, '2026-11-08 21:11:43.350276+00', 0);
INSERT INTO public._prisma_migrations VALUES ('71c84e8f-d0c2-41b2-999e-30db5f2c5a0d', '330755a7c53b2d5b8bfd007c4886b365c6da50004a8700ee16d9cacab0f7cd3a', '2026-11-08 21:11:44.792331+00', '20260827170000_add_notifications', '', NULL, '2026-11-08 21:11:44.792331+00', 0);
INSERT INTO public._prisma_migrations VALUES ('79a57aee-bb3e-4c06-a3d0-c89943d8393a', '6e693f46bc0ba2827aedfdbb1edeb15ee3c5d13bd8e9bcafecd15b180b35f905', '2026-11-08 21:11:46.190604+00', '20260827180000_add_statuses', '', NULL, '2026-11-08 21:11:46.190604+00', 0);
INSERT INTO public._prisma_migrations VALUES ('2e1bf31e-5461-4ef7-8314-569ee9c6713d', '64ef5f52cb0deb10d3f9c1b85ce431de9cb5cb99b106f6bf5325839e1c8e7538', '2026-11-08 21:11:47.648405+00', '20260827190000_add_role_assignable', '', NULL, '2026-11-08 21:11:47.648405+00', 0);
INSERT INTO public._prisma_migrations VALUES ('035ee873-e2fe-4fb8-9b42-76db22603c41', '45e791942061fc8119a79872a72c4adb4c1c9d1e690850a3423bb753a453d911', '2026-11-08 21:11:49.121591+00', '20260828080000_add_user_fields', '', NULL, '2026-11-08 21:11:49.121591+00', 0);
INSERT INTO public._prisma_migrations VALUES ('d629db02-d5e5-49a3-87b6-8168f7a03b4e', '50351158d49d8a2730581770dbb6f0ce1673a632911ecbf3a02d607ad803b9c2', '2026-11-08 21:11:50.565015+00', '20260828230000_add_chat_reactions_reply_recipient', '', NULL, '2026-11-08 21:11:50.565015+00', 0);
INSERT INTO public._prisma_migrations VALUES ('34225023-6806-48c6-860e-9a615abc5820', 'e758b36fdd3caa2a985e78dbd7458b303d3045ecba0ad5939dde31cfdb1f7fc5', '2026-11-08 21:11:52.014487+00', '20260829055849_add_news_system', '', NULL, '2026-11-08 21:11:52.014487+00', 0);
INSERT INTO public._prisma_migrations VALUES ('cf2b20b6-0db8-4e03-92a5-0e2eb4c2c460', '628aaf22d19a95e5369143245069fe06d0afc2d2451cfb4a0570c993a60c8f84', '2026-11-08 21:11:53.460126+00', '20260829062302_add_news_to_allowed_pages', '', NULL, '2026-11-08 21:11:53.460126+00', 0);
INSERT INTO public._prisma_migrations VALUES ('6088c623-b8f0-4ffa-9aa0-3910d1aa5d44', '069b3abac849b3dfc9158bea587f1a415cfe9bc525542cba66677c209193058f', '2026-11-08 21:11:54.917965+00', '20260830110000_add_task_history', '', NULL, '2026-11-08 21:11:54.917965+00', 0);
INSERT INTO public._prisma_migrations VALUES ('0cfb18bd-dd50-46da-ac4b-e4883a82951b', 'fbd68687a10b48471e98f1e13c02ccd4677bbf0d6590102c3ac8dd51a3f0bc28', '2026-11-08 21:11:56.340369+00', '20260830143200_add_status_is_active', '', NULL, '2026-11-08 21:11:56.340369+00', 0);
INSERT INTO public._prisma_migrations VALUES ('dfc50529-3a1d-4499-a25c-d1d6f146300f', 'af4c4b08f7cae5decc195f5f7b47aa80612257960595cdfbffff0e57b8b9b53a', '2026-11-08 21:11:57.800471+00', '20260830210000_add_task_curator', '', NULL, '2026-11-08 21:11:57.800471+00', 0);
INSERT INTO public._prisma_migrations VALUES ('2afb4474-fe4e-4c52-a042-ae5f5e99ae4b', 'a2a214676389d2e838aad867d990cad20a2134a4ae17d4f1e116f7e5c80a386b', '2026-11-08 21:11:59.231364+00', '20260830230500_add_can_be_curator', '', NULL, '2026-11-08 21:11:59.231364+00', 0);
INSERT INTO public._prisma_migrations VALUES ('5e4ca9df-ee19-4ea0-8523-933f34799e2b', 'cbba941d9416672adf1fb1ab3ff32499455c7590e7da33fd5f74869f4849935a', '2026-11-08 21:12:00.694545+00', '20260901_add_is_internal', '', NULL, '2026-11-08 21:12:00.694545+00', 0);
INSERT INTO public._prisma_migrations VALUES ('cd751700-e7a9-4ac9-bbb2-ded4e1717bff', 'e5acb310cef2af41764115026ded46d889e0a1ef09d070682e14d512d5616dfd', '2026-11-08 21:12:02.095539+00', '20260901_add_notification_settings', '', NULL, '2026-11-08 21:12:02.095539+00', 0);
INSERT INTO public._prisma_migrations VALUES ('afcdb5ce-f82d-4613-862e-c4de4f1047bc', 'e065ac1827d1d0ce745b0becb455c7e0f94f57f35aeb5e9138819f1cbfcfb303', '2026-11-08 21:12:03.528803+00', '20260901_add_ticket_number', '', NULL, '2026-11-08 21:12:03.528803+00', 0);
INSERT INTO public._prisma_migrations VALUES ('c9c1e8c8-691f-40c7-ac23-f51a2b176e36', 'b3e189758c2580dea0f22067d05d1820b6f5010ebe823b6a6791adbc156f3874', '2026-11-08 21:12:04.978469+00', '20260901_add_vk_callback_fields', '', NULL, '2026-11-08 21:12:04.978469+00', 0);
INSERT INTO public._prisma_migrations VALUES ('541d9f84-45df-4a1a-88b8-ee7e66a9b3a1', 'd7547c33529ac7693008f1aac05aea38ef39655f0058be62d7443f3efcdcbf09', '2026-11-08 21:12:06.427709+00', '20260902_121800_add_contact_max_fields', '', NULL, '2026-11-08 21:12:06.427709+00', 0);
INSERT INTO public._prisma_migrations VALUES ('f5cc552b-5142-45c8-823a-1b27f5dfe6e7', '6c4e2bcadd92144c1879c261c6cbace71b04da382c2c85a858ab021900cba75b', '2026-11-08 21:12:07.898839+00', '20260902_160000_add_role_notifications', '', NULL, '2026-11-08 21:12:07.898839+00', 0);
INSERT INTO public._prisma_migrations VALUES ('ecfef612-5a13-48dc-96df-39e1b1d2a4a4', 'e27d1ea392368587f51c3c381738fdc2991db9e03d1876ed1c7648bf4cbd3b6c', '2026-11-08 21:12:09.32423+00', '20260903050000_novofon_full_integration', '', NULL, '2026-11-08 21:12:09.32423+00', 0);
INSERT INTO public._prisma_migrations VALUES ('979bca82-27fa-4279-87b6-f15125d17ca3', '0879f6c7b4f5e3235c10a125946fe39e52f03898c11cbb66309ccc152286eab9', '2026-11-08 21:12:10.794957+00', '20260903_010000_add_is_locked', '', NULL, '2026-11-08 21:12:10.794957+00', 0);
INSERT INTO public._prisma_migrations VALUES ('3cf17ff4-ee2b-4fa8-87d1-da60b6aa293a', '933903f2ee0e6bc7c8f5581eff8e18a86e9569c7fcb1066fa338653e2da65b76', '2026-11-08 21:12:12.191183+00', '20260905_add_contact_project_relation', '', NULL, '2026-11-08 21:12:12.191183+00', 0);
INSERT INTO public._prisma_migrations VALUES ('225e2e85-76b7-4473-bbe6-c4ce227a7786', 'be4b115ed005811c8b30b033871795fcc5d3c92e9e2ab6e20067e7dc4f427aaf', '2026-11-08 21:12:13.633032+00', '20260906_add_file_tab_settings', '', NULL, '2026-11-08 21:12:13.633032+00', 0);
INSERT INTO public._prisma_migrations VALUES ('e430514e-e4e5-4b3b-8c7e-43aa7214ddf8', 'c28da3569520b01bf84e5fcb69b18a6a00c24ddbea04b058145c38ad0ce22b9f', '2026-11-08 21:12:15.076351+00', '20260907_add_path_to_file_tab_settings', '', NULL, '2026-11-08 21:12:15.076351+00', 0);
INSERT INTO public._prisma_migrations VALUES ('a5e18077-dee8-4abf-89cc-362288fe0b86', '699d2f9c5ebe660ed408b341ceb5315835bb788c151d530e8a803766e60dbada', '2026-11-08 21:12:16.524917+00', '20260908120000_add_reminders', '', NULL, '2026-11-08 21:12:16.524917+00', 0);
INSERT INTO public._prisma_migrations VALUES ('c9c99258-000d-47d2-bcb5-a5109f58bfca', 'f648ead8414ec5eea5d150b697a9039591bcf69fb6e14a1cc6e656192bb739fc', '2026-11-08 21:12:17.935872+00', '20260909093000_shared_reminders', '', NULL, '2026-11-08 21:12:17.935872+00', 0);
INSERT INTO public._prisma_migrations VALUES ('72adddad-391c-4a9b-a807-b2c8b59777a7', '2b0ebd34bb79f2d289d16e75a10abdb458a4f18d2e55557e52690dac75b0aaab', '2026-11-08 21:12:19.453505+00', '20260909180000_yandex_task_address', '', NULL, '2026-11-08 21:12:19.453505+00', 0);
INSERT INTO public._prisma_migrations VALUES ('981a8a8a-21d7-4be2-a961-d647840cdc95', 'bc338045acbfaa64d3cc4b3da914e6f534f7e555d1adfcfd40c5ad9a3b9da9ae', '2026-11-08 21:12:20.910548+00', '20260910_add_products', '', NULL, '2026-11-08 21:12:20.910548+00', 0);
INSERT INTO public._prisma_migrations VALUES ('a6d7445d-74b9-4696-8324-91d7dd247c30', 'ca8111c015192099a34163d59deb2e56ba20bd65a61587c690fe3a8319c12107', '2026-11-08 21:12:22.320064+00', '20260910_product_images', '', NULL, '2026-11-08 21:12:22.320064+00', 0);
INSERT INTO public._prisma_migrations VALUES ('5c946ab9-741d-43bb-a04f-00b6be334e0a', '4a10ab0607d6a691c354b782888b5be6e72f2d4e47d564fc891dae0649d6aedd', '2026-11-08 21:12:23.77246+00', '20260910_sms_tasks', '', NULL, '2026-11-08 21:12:23.77246+00', 0);
INSERT INTO public._prisma_migrations VALUES ('38626a11-1e0e-4ffd-9f27-cecd395312a0', '35377385b7eca837ddf237d5f7929cfbb5587614bab1e261f6581cd064bbf557', '2026-11-08 21:12:25.228131+00', '20260910_vk_market_oauth', '', NULL, '2026-11-08 21:12:25.228131+00', 0);
INSERT INTO public._prisma_migrations VALUES ('342bd6a0-6a38-4274-bfa1-d0ecfc642ce7', '86a4996891379230f61045c51b44ac2415a588f02d704a369da98df1034c3fb4', '2026-11-08 21:12:26.64398+00', '20260910_vk_market_token', '', NULL, '2026-11-08 21:12:26.64398+00', 0);
INSERT INTO public._prisma_migrations VALUES ('80b3e547-c779-4c1e-a704-02a674a72b31', 'f16fe9f045a962a2655078246adc19668af64d979d2fe8f1b8200efae2200197', '2026-11-08 21:12:28.060447+00', '20260910_vk_sync', '', NULL, '2026-11-08 21:12:28.060447+00', 0);
INSERT INTO public._prisma_migrations VALUES ('8ccb1cd6-c1a0-40c5-9cc8-4a4a94e8c40b', '8ebf610f1626d845e827f808c1999fe47b71412f3e758caeb2039f2e2c94868d', '2026-11-08 21:12:29.442493+00', '20260911000000_add_branding', '', NULL, '2026-11-08 21:12:29.442493+00', 0);
INSERT INTO public._prisma_migrations VALUES ('db3f8650-0542-4a97-aab6-b6207647911c', '4a2869b814e75e598e446e28b376831c29520c1dcf91802a7a7d19d00a816db2', '2026-11-08 21:12:30.922036+00', '20260911_add_beget_partner', '', NULL, '2026-11-08 21:12:30.922036+00', 0);
INSERT INTO public._prisma_migrations VALUES ('b2511b59-e2c7-429a-ad46-35f2e4a18d4b', 'bc90286187e91638fd94fd32f06eda7450524c5a3dcb191f1d6bedf343a1d500', '2026-11-08 21:12:32.399643+00', '20260911_add_beget_settings', '', NULL, '2026-11-08 21:12:32.399643+00', 0);
INSERT INTO public._prisma_migrations VALUES ('739497f3-3378-4d10-8536-e25ea289ed4f', '6a64b2ffc2db182ec2f9b7d77efe638ddf16c5b79fa987a371ec450f3f6e67f6', '2026-11-08 21:12:33.829518+00', '20260911_add_beget_update_time', '', NULL, '2026-11-08 21:12:33.829518+00', 0);
INSERT INTO public._prisma_migrations VALUES ('7dc7fb49-01bb-4f35-ad30-3dc9fe173f55', '595fdebedbe4ed9357fb761cfee5f88c6c60f8af51733c55a7c2022e2f42fa84', '2026-11-08 21:12:35.274566+00', '20260911_add_pskovline_plugin', '', NULL, '2026-11-08 21:12:35.274566+00', 0);
INSERT INTO public._prisma_migrations VALUES ('7d2a6812-485a-448b-b5d8-10cf1491d88e', 'fefc9a3714b69af4e190bfd60226456a2dc26f8eb0b81a7d8a99269e937f9fae', '2026-11-08 21:12:36.728531+00', '20260911_add_tochka_interval', '', NULL, '2026-11-08 21:12:36.728531+00', 0);
INSERT INTO public._prisma_migrations VALUES ('78346e28-d6a4-4281-a6f2-110ac246bb30', '3b9db3d10edf984ed8a6388d24fb32729752168a8244f39153e84c54613d96f1', '2026-11-08 21:12:38.168195+00', '20260911_add_user_task_defaults', '', NULL, '2026-11-08 21:12:38.168195+00', 0);
INSERT INTO public._prisma_migrations VALUES ('62b4b3cc-9730-43dd-9a4a-26a2617a8fd0', '2a64a0ea8e4ab8e9517faf7ab973c7cbecef9566886eaa51213c2eccee493fbf', '2026-11-08 21:12:39.623028+00', '20260912012100_telegram_user_chat', '', NULL, '2026-11-08 21:12:39.623028+00', 0);
INSERT INTO public._prisma_migrations VALUES ('1506e1cc-b5ba-4628-86b5-2f68f7c47bf7', 'aefb32bb85eb61cb108ea35f00d2f5207e0f35b215998378686d443542c31075', '2026-11-08 21:12:41.054227+00', '20260912120000_add_handler_settings', '', NULL, '2026-11-08 21:12:41.054227+00', 0);
INSERT INTO public._prisma_migrations VALUES ('5e309b0f-7f56-4f0d-9769-01c7539d1d80', '65e5c38afbe054d24b807b9678b9001a82a697f415eb9b0f1a4b4ee537bca04b', '2026-11-08 21:12:42.478769+00', '20260912130000_add_auto_reply', '', NULL, '2026-11-08 21:12:42.478769+00', 0);
INSERT INTO public._prisma_migrations VALUES ('bd42e5f6-d90f-4e3b-9288-a7c6cd90a209', '94cb9360da2a65ce18aa6cecf1edf9ad71719999e7b5ee71d56f319a3fe09d57', '2026-11-08 21:12:43.977202+00', '20260912140000_add_auto_replier', '', NULL, '2026-11-08 21:12:43.977202+00', 0);
INSERT INTO public._prisma_migrations VALUES ('a196256d-4b42-4a1d-b6d0-a995264b6fd4', 'b5ccaaeea097038dc5fc37d15aff941cff6fcc5ddb991cb6cfacadd0d8c340e4', '2026-11-08 21:12:45.387314+00', '20260912150000_add_vk_profile_url', '', NULL, '2026-11-08 21:12:45.387314+00', 0);
INSERT INTO public._prisma_migrations VALUES ('045d5729-dc12-428f-8711-2eb680a86d62', 'fff3780f37bb317a6221e523176145f91c44271036b92e3f2d7a6d6045d1fcd4', '2026-11-08 21:12:46.852627+00', '20260913010000_add_dark_logo_accent_color', '', NULL, '2026-11-08 21:12:46.852627+00', 0);
INSERT INTO public._prisma_migrations VALUES ('700a4fc2-f3a3-4bba-b058-9c8eec799967', '218b2108febed948fd21ea6bb56077c0f781c4a45b08e6382a738bfb512a9cc6', '2026-11-08 21:12:48.288381+00', '20260913_add_onec_entity_sync', '', NULL, '2026-11-08 21:12:48.288381+00', 0);
INSERT INTO public._prisma_migrations VALUES ('ef61462d-45b6-4562-ad7d-be901cba9e6a', 'f0e16170ed330f94f6e0184977c5de5603f56e084e485dc2377afb6ef3ca0c9e', '2026-11-08 21:12:49.677487+00', '20260913_add_onec_plugin', '', NULL, '2026-11-08 21:12:49.677487+00', 0);
INSERT INTO public._prisma_migrations VALUES ('5e516f5d-4441-43aa-b384-1e1c54328c87', 'caf7923092af57522cce52b5aaa30f5b8144c7e1c0789bd019e76d1cc90fa487', '2026-11-08 21:12:51.114827+00', '20260914000000_product_categories', '', NULL, '2026-11-08 21:12:51.114827+00', 0);
INSERT INTO public._prisma_migrations VALUES ('1230000a-7e92-46ad-bb51-d5a0372c03f3', '4f2bbd7fcbfc3c169ef46af0715ffe65f17d8367635e21d21cb30b0a0eb08070', '2026-11-08 21:12:52.566611+00', '20260914_add_email_filters', '', NULL, '2026-11-08 21:12:52.566611+00', 0);
INSERT INTO public._prisma_migrations VALUES ('4ef3a67d-2247-4b66-b094-ea3ab034bd3f', '73c2ab25301fb76aaf55560d33d3d8689b74cbb73a43ed2c627686975e84eea9', '2026-11-08 21:12:54.009175+00', '20260914_add_news_cover_branding', '', NULL, '2026-11-08 21:12:54.009175+00', 0);
INSERT INTO public._prisma_migrations VALUES ('603aa80a-5a26-460b-8027-9192d61d6ada', '9a924442913ecc9cd179977a131f2c9e2284ce1a8e687bee2be791fe3022cbb8', '2026-11-08 21:12:55.417028+00', '20260914_add_news_permissions_roles', '', NULL, '2026-11-08 21:12:55.417028+00', 0);
INSERT INTO public._prisma_migrations VALUES ('1a8cb27d-b8d8-44d5-a400-30acef875968', '0d4116dbdcb17c4b0698f1bfdb0172586655902b10e833aaea24c16944d2d37a', '2026-11-08 21:12:56.850494+00', '20260914_add_news_reactions_comments', '', NULL, '2026-11-08 21:12:56.850494+00', 0);
INSERT INTO public._prisma_migrations VALUES ('7c27df12-a7f6-44fa-9f9a-30d6b7413e6b', 'edc50c074e5dfc4322371aa9bb8362fe9208f579e0ff57084a9391bb218043de', '2026-11-08 21:12:58.264911+00', '20260914_add_pinned_to_home_news', '', NULL, '2026-11-08 21:12:58.264911+00', 0);
INSERT INTO public._prisma_migrations VALUES ('8a10bc5a-5b6f-4ed6-8fc4-9e7b7e959f4c', '3bc67167fb7c3e0e5714d93f3a8564bcc00a5cfcd43de6102939219cf50b60ca', '2026-11-08 21:12:59.689946+00', '20260914_add_show_finances_tab_to_roles', '', NULL, '2026-11-08 21:12:59.689946+00', 0);
INSERT INTO public._prisma_migrations VALUES ('263e0e1c-eaa3-467a-89cd-fcaf7ca404f1', '1d258b4315e42a1f3e975fbb75460d0a269697811c4fb5bf0358a21baeb06097', '2026-11-08 21:13:01.162239+00', '20260914_add_task_status_permissions_to_roles', '', NULL, '2026-11-08 21:13:01.162239+00', 0);
INSERT INTO public._prisma_migrations VALUES ('71ea1d5d-74e6-408f-88c0-a54216d2693a', '1e73f691952dd99221f214920bdd45c4e1a85e4d2cd9ea53d0826a5cd553028a', '2026-11-08 21:13:02.587744+00', '20260914_remove_ai_assistant', '', NULL, '2026-11-08 21:13:02.587744+00', 0);
INSERT INTO public._prisma_migrations VALUES ('84100cf8-a7c1-42dc-adcb-c91bfd6495ca', '6a98411cb84c88769b193d227e29688ee28d2ce94f8a484c6fc4a2f65cc41dfd', '2026-11-08 21:13:04.03119+00', '20260915_add_email_filter_spam', '', NULL, '2026-11-08 21:13:04.03119+00', 0);
INSERT INTO public._prisma_migrations VALUES ('51ff4598-59c0-4ca1-a4e7-74214273343b', '05c85e9ccf8d783e067d9f995d2b17a0362202bfd87cffadb14f2fb55a4c3103', '2026-11-08 21:13:05.485996+00', '20260915_add_email_parse_rules', '', NULL, '2026-11-08 21:13:05.485996+00', 0);
INSERT INTO public._prisma_migrations VALUES ('94cd54f3-4768-410e-9734-9692b7cff218', '299353e2793faffe793fea9fa569222d5b2e7ded896b3d7bcfbde1f80a51f5d2', '2026-11-08 21:13:06.916157+00', '20260915_add_onec_kind_folder', '', NULL, '2026-11-08 21:13:06.916157+00', 0);
INSERT INTO public._prisma_migrations VALUES ('9c488665-f89f-466f-a0ab-f043fd850362', 'e1d7864a7cc66535e9eb40fc9fa02fb26e38d32553939d472756314f3e7fb835', '2026-11-08 21:13:08.358967+00', '20260915_add_product_on_vitrine', '', NULL, '2026-11-08 21:13:08.358967+00', 0);
INSERT INTO public._prisma_migrations VALUES ('9698d48e-fb18-4764-85d4-04cd4831cdac', '06dcd2aee44aa782a41f392c0b5f797585ac4407a579e23bb82da667ace8a1d0', '2026-11-08 21:13:09.779802+00', '20260915_add_role_can_handle_spam', '', NULL, '2026-11-08 21:13:09.779802+00', 0);
INSERT INTO public._prisma_migrations VALUES ('7f6c0988-1f39-4f72-af34-37622a8cdcb0', '1becb4e78a6b5706f850e483f62ccd60444f1f0f274fa44558e4f218ba3a8677', '2026-11-08 21:13:11.251926+00', '20260915_add_splash_settings', '', NULL, '2026-11-08 21:13:11.251926+00', 0);
INSERT INTO public._prisma_migrations VALUES ('9ce5c0e8-d43f-4cdc-89f4-3c483f74d822', 'b1de575b6da218f470a4fca3a829c6217c55cc65750a951edb8a23c91727bad8', '2026-11-08 21:13:12.705597+00', '20260915_add_web_calls', '', NULL, '2026-11-08 21:13:12.705597+00', 0);
INSERT INTO public._prisma_migrations VALUES ('d0e22116-50bf-4370-9e6b-226ccf9915aa', '8685bf361229684cf08bbc036e0654b732cdbad32e7ebcf8ce0289f2978672e6', '2026-11-08 21:13:14.143417+00', '20260916152000_add_stock_access', '', NULL, '2026-11-08 21:13:14.143417+00', 0);
INSERT INTO public._prisma_migrations VALUES ('71a52383-7169-4edc-a78d-905817fb5081', '449d50921506e3b44ef7c36b6004d39202f1828fb3ea670522f79ba763ea7297', '2026-11-08 21:13:15.579541+00', '20260916174500_add_user_mobile_nav', '', NULL, '2026-11-08 21:13:15.579541+00', 0);
INSERT INTO public._prisma_migrations VALUES ('d339656a-419a-411e-bbf0-b8dfd98519d2', 'c0e609033c6701bdeb592b1588caa2fee4925eaaa80c7e24765db46e2ba64b95', '2026-11-08 21:13:17.040446+00', '20260916195500_add_price_catalog_flags', '', NULL, '2026-11-08 21:13:17.040446+00', 0);
INSERT INTO public._prisma_migrations VALUES ('0cd30476-560b-484d-ba76-231a4574e95a', 'cfe703bbfcdca175224c408434f39c230475dbcf9966dcdf8aef9c268446b4db', '2026-11-08 21:13:18.470495+00', '20260916232000_add_contact_type_catalog_flags', '', NULL, '2026-11-08 21:13:18.470495+00', 0);
INSERT INTO public._prisma_migrations VALUES ('c1cbfb0b-6c22-480d-b956-83053e802973', '0f7aa4bd4a1bcb73123f32c2e6811943c0ba6a407448c1ffbf45353f1bb4dac8', '2026-11-08 21:13:19.914064+00', '20260917100000_vpn_settings', '', NULL, '2026-11-08 21:13:19.914064+00', 0);
INSERT INTO public._prisma_migrations VALUES ('9d47f641-8185-4e98-82fd-73588e93218f', '451b3c219dee33184de6b1460b11dba858e8d3b7a63c4b48dcfdf1124732c51a', '2026-11-08 21:13:21.382946+00', '20260918_add_dashboard_metric_settings', '', NULL, '2026-11-08 21:13:21.382946+00', 0);
INSERT INTO public._prisma_migrations VALUES ('4b1b397c-68e8-4048-a627-13cb16cdb0f1', '9b959d89be597e2cd3ab3afa1f7b083ac69bf74ef224cb83c9822a560728465e', '2026-11-08 21:13:22.904809+00', '20260918_project_users', '', NULL, '2026-11-08 21:13:22.904809+00', 0);
INSERT INTO public._prisma_migrations VALUES ('6c3e63b1-f8f0-474a-b3a9-47f51280c8e0', '2b2b823557b9b51afdc168a934915bbacb16a3e97216ac9990633148dfb3c898', '2026-11-08 21:13:24.439532+00', '20260918_role_can_access_projects', '', NULL, '2026-11-08 21:13:24.439532+00', 0);
INSERT INTO public._prisma_migrations VALUES ('5cef5d60-632e-4500-9c63-cde3ccd3368c', '25fded8f3b1a7c3025e684f513d3a0398164adb7b318d775a369090e875edb68', '2026-11-08 21:13:25.933067+00', '20260920120000_add_diadoc_plugin', '', NULL, '2026-11-08 21:13:25.933067+00', 0);
INSERT INTO public._prisma_migrations VALUES ('4ac1033f-fc0b-46d0-bf7b-bf11257cea2d', '2334325cfbe3425bee282a440fe5539fa8f4bf1c6200c25fa3272f348d6594b8', '2026-11-08 21:13:27.373471+00', '20260920130000_add_dgis_plugin', '', NULL, '2026-11-08 21:13:27.373471+00', 0);
INSERT INTO public._prisma_migrations VALUES ('d41c22c3-af56-4dfa-a0db-b0986483d5c5', 'c057590a0c6a6a495fa099e6334b48837fcc64899d0daa7ad18d9f4280cac70c', '2026-11-08 21:13:28.8019+00', '20260920_accounting_module', '', NULL, '2026-11-08 21:13:28.8019+00', 0);
INSERT INTO public._prisma_migrations VALUES ('dba24536-c012-447a-939b-0d2f06055c49', 'aedd38ec66c2caae46c141229f7b3ccdf0d0f7a9d016b5ff373219f94b45953e', '2026-11-08 21:13:30.205701+00', '20260921_add_theme_setting', '', NULL, '2026-11-08 21:13:30.205701+00', 0);
INSERT INTO public._prisma_migrations VALUES ('acb94009-255d-4a22-ab46-702fa986a325', 'c0973778af291772111394cb2df252c2019259f59937daaed946c748dbbcd05c', '2026-11-08 21:13:31.651849+00', '20260921_sales', '', NULL, '2026-11-08 21:13:31.651849+00', 0);
INSERT INTO public._prisma_migrations VALUES ('cc0265a6-fd96-4f60-9d8d-e25779f8217d', 'ff5e2e36b0483ed0620960e8b46c34512affc369b6882f69908f7aa93deaacee', '2026-11-08 21:13:33.159416+00', '20260921_webrtc_widget', '', NULL, '2026-11-08 21:13:33.159416+00', 0);
INSERT INTO public._prisma_migrations VALUES ('249be667-20c8-43bf-b418-96d7a9fe8872', '82cb935aab10c380da57ff547fac5fd3a6d134909b7ac6eea0e0f5495e662ed7', '2026-11-08 21:13:34.594528+00', '20260929_ip_is_organization', '', NULL, '2026-11-08 21:13:34.594528+00', 0);
INSERT INTO public._prisma_migrations VALUES ('7ce7eed5-9acb-4b91-98fc-8e7fc9d6e55c', 'aeebb5684a316157d287cefed2a4db96c4b45abb8f83fb56048d9cb6305bff9a', '2026-11-08 21:13:35.996241+00', '20260929_remove_contact_company', '', NULL, '2026-11-08 21:13:35.996241+00', 0);
INSERT INTO public._prisma_migrations VALUES ('bc45dc21-4fc1-4ae8-8018-2a1429c40913', '74a2d924d99c33c8338ace9d8bccd747520f5c7e4429a3b3e9d879d2cd839166', '2026-11-08 21:13:37.455467+00', '20260930213000_add_product_article', '', NULL, '2026-11-08 21:13:37.455467+00', 0);
INSERT INTO public._prisma_migrations VALUES ('1dfc1c95-59dd-458e-94e4-59abc94df7f3', '9c642ef4c6e090a9bee6df755411e1a52c785a2969749a653bb29d56ce5287c2', '2026-11-08 21:13:38.922478+00', '20261001013000_contact_accesses', '', NULL, '2026-11-08 21:13:38.922478+00', 0);
INSERT INTO public._prisma_migrations VALUES ('a3ab8661-301c-4823-a25c-de9ec5cd8ba4', '645f3f6d6d681ce7bc166c5f109c31bd7aa0e4ba63846f15ee0fb0f60a090b48', '2026-11-08 21:13:40.334105+00', '20261001033000_contact_birth_date', '', NULL, '2026-11-08 21:13:40.334105+00', 0);
INSERT INTO public._prisma_migrations VALUES ('2f1897c9-97f5-422c-af90-01796251d306', 'fc7f327e8ca9074a08a55449e98709974b8f709c2bcac727f2ae7cb9feb498df', '2026-11-08 21:13:41.764897+00', '20261001143000_contact_address', '', NULL, '2026-11-08 21:13:41.764897+00', 0);
INSERT INTO public._prisma_migrations VALUES ('cdcbe274-b552-497f-9298-c866eeba9d6f', '6cd134a142161706c5831efd048667fb042a8f5f93aa5a101c317cfcde9a9e34', '2026-11-08 21:13:43.166542+00', '20261001163000_contact_telegram_username', '', NULL, '2026-11-08 21:13:43.166542+00', 0);
INSERT INTO public._prisma_migrations VALUES ('0cc59865-e81a-4707-9b08-193bdf700cdb', '13af2162903a15f9784570afac6160a5beb47457d989d1b101756c5c773942cf', '2026-11-08 21:13:44.602836+00', '20261001223500_legal_documents', '', NULL, '2026-11-08 21:13:44.602836+00', 0);
INSERT INTO public._prisma_migrations VALUES ('bde80101-3197-4177-901e-1191e3bcb8dd', '75fffb614e4e93acf7c084a9bbeada63a296209bfb074928bf61e2021366ac77', '2026-11-08 21:13:46.089921+00', '20261002150000_product_subscriptions', '', NULL, '2026-11-08 21:13:46.089921+00', 0);
INSERT INTO public._prisma_migrations VALUES ('85b6ad47-2a77-42e9-bd2c-7b4ce8f80085', '4be74e026e7569bd0c51ccab8c1337535a2e1bbf8f08bcb6c7bc7a2bcbfe0121', '2026-11-08 21:13:47.568671+00', '20261003195600_billing_price_flags', '', NULL, '2026-11-08 21:13:47.568671+00', 0);
INSERT INTO public._prisma_migrations VALUES ('7238a00c-5c26-47e0-880a-4f25e1692696', 'ba5a58fc1734bb321210730974fcddf197c0b8bcf0b5e2db1c8614f11bac0654', '2026-11-08 21:13:49.03207+00', '20261004004500_promo_block_button_style', '', NULL, '2026-11-08 21:13:49.03207+00', 0);
INSERT INTO public._prisma_migrations VALUES ('30957fec-ba77-41c9-8d2f-a010ff6f82c6', 'fc72ff694881beffc14de84c9214d1bb8cfeada23bd90a48bed4ff8ade5ae304', '2026-11-08 21:13:50.496971+00', '20261004074500_login_slides', '', NULL, '2026-11-08 21:13:50.496971+00', 0);
INSERT INTO public._prisma_migrations VALUES ('272fd07c-eec3-4a01-b036-35066393e781', '42d9b1a42c7f35b081be3ab078d3d4d858771a53e7e3e9a6b4dc0a49c17adbe2', '2026-11-08 21:13:51.925668+00', '20261004111500_login_brand_text', '', NULL, '2026-11-08 21:13:51.925668+00', 0);
INSERT INTO public._prisma_migrations VALUES ('a0bce6cd-1dca-48ae-88f0-aa45e6011945', '95aff7d0f8be26d1ee5c0964f8a1a692e6ef5fbaba794ef475b1bfab98ca07e0', '2026-11-08 21:13:53.354975+00', '20261005120000_add_tochka_acquiring', '', NULL, '2026-11-08 21:13:53.354975+00', 0);
INSERT INTO public._prisma_migrations VALUES ('4ebada5b-de18-41a4-a5ae-4e17d7296caf', 'e8d965957b50c9f1ea1c3853e800d2ff2c53d82fcbb102b1f574905374303127', '2026-11-08 21:13:54.776973+00', '20261006100000_subscription_ends_at', '', NULL, '2026-11-08 21:13:54.776973+00', 0);
INSERT INTO public._prisma_migrations VALUES ('1535ca8c-6c51-4d71-b79b-08103c675f77', '76de27212139817d8d99cb47781f5f66415f8f302c03cbfaecd695a361924c22', '2026-11-08 21:13:56.201028+00', '20261006110000_subscription_statuses', '', NULL, '2026-11-08 21:13:56.201028+00', 0);
INSERT INTO public._prisma_migrations VALUES ('8d162d6c-5190-453e-a4c1-dfa24bdf0b00', 'ba66293619eb7d88877231f2626df74d3ad974551c26f059beb26514db20b259', '2026-11-08 21:13:57.611626+00', '20261006120000_subscription_renewal_payments', '', NULL, '2026-11-08 21:13:57.611626+00', 0);
INSERT INTO public._prisma_migrations VALUES ('6fa5dc5e-c0fa-48fd-9570-1e595736fa5e', '05045aeadbe04e272c2e9ff02534c9f55f4fc00074ee80db9403eabe22dd63d8', '2026-11-08 21:13:59.034439+00', '20261006181000_add_user_stock_access', '', NULL, '2026-11-08 21:13:59.034439+00', 0);
INSERT INTO public._prisma_migrations VALUES ('a4298662-99ea-4a2a-9352-e6dfaf538059', '093e1b0c49dcbd7577312db4079ac8ada3215408f8f8c5afb6347702cf39bff3', '2026-11-08 21:14:00.493905+00', '20261007170000_product_tags', '', NULL, '2026-11-08 21:14:00.493905+00', 0);
INSERT INTO public._prisma_migrations VALUES ('6e0d302b-8ab3-41e3-ab47-6c2d54640310', '4e895d02e2e5e7703a766fe9a7e4ac8d03859734e95b40407b4efc241c374b3c', '2026-11-08 21:14:01.960721+00', '20261007210000_ozon_seller', '', NULL, '2026-11-08 21:14:01.960721+00', 0);
INSERT INTO public._prisma_migrations VALUES ('18df8910-8fc9-427b-95af-b52074cc9ed4', 'c42f7877b644daf552e1d162968ae7de1373e9d89a6b351f13c1d68f83701f95', '2026-11-08 21:14:03.367114+00', '20261007213000_ozon_default_type', '', NULL, '2026-11-08 21:14:03.367114+00', 0);
INSERT INTO public._prisma_migrations VALUES ('545002e2-2531-48c5-b38f-a6463b063ab6', '626b96851ed118cb112b8b356e5e1872b12cffffd64878114da5bd5146875d3e', '2026-11-08 21:14:04.870336+00', '20261007214500_ozon_category_binding', '', NULL, '2026-11-08 21:14:04.870336+00', 0);
INSERT INTO public._prisma_migrations VALUES ('a54fe2c0-7d29-49c5-bd8d-a46049063f36', 'd3006fd7abc39a802e5ae4eff7d65d7a80ac52a99e202f32fec2275874bec0ba', '2026-11-08 21:14:06.313851+00', '20261007223000_ozon_product_id_bigint', '', NULL, '2026-11-08 21:14:06.313851+00', 0);
INSERT INTO public._prisma_migrations VALUES ('0009552d-3cb5-41e6-8288-76f2830934aa', 'f55a22e0a0825e32cecef7e374a6dbd49f8ac38eff67e10cbbb1c4d38f4af334', '2026-11-08 21:14:07.755871+00', '20261007233000_product_weight_dims', '', NULL, '2026-11-08 21:14:07.755871+00', 0);
INSERT INTO public._prisma_migrations VALUES ('69a9e0ab-7c32-4601-99e3-377dd7ab828f', 'dff6d952eb5f13d0623b6f02e9cf21d96d00d4e62f802f939467ade3bf217b86', '2026-11-08 21:14:09.21056+00', '20261008001000_product_brand', '', NULL, '2026-11-08 21:14:09.21056+00', 0);
INSERT INTO public._prisma_migrations VALUES ('16be7062-ebb0-40b5-b589-efa285a31324', '13121bea85e076e53fda3bb9a8fd76ca186211e1c525e560afeec27b247b979e', '2026-11-08 21:14:10.638412+00', '20261008011000_product_tnved', '', NULL, '2026-11-08 21:14:10.638412+00', 0);
INSERT INTO public._prisma_migrations VALUES ('ca935cc1-6b38-4449-b788-4e38e22a3cbd', 'daea88ee276c434ea1e29004aa54f858ac1cf8d49e21b44b54ad15a87bfd4b5b', '2026-11-08 21:14:12.098305+00', '20261008015000_product_units_g_mm', '', NULL, '2026-11-08 21:14:12.098305+00', 0);
INSERT INTO public._prisma_migrations VALUES ('8fa34857-96fe-4678-8c35-186891633c6d', '3709d1d3ecc1d925d2cd0cf16b17d9ec636988f37d953b1ae8a0f5504977df90', '2026-11-08 21:14:13.563658+00', '20261009144000_vk_market_token_refresh', '', NULL, '2026-11-08 21:14:13.563658+00', 0);
INSERT INTO public._prisma_migrations VALUES ('a7602fd4-045e-4c09-aeeb-5fefdac2a662', '73b52f0179ff75fc5ee2a221717c69d66ba466f75b7e712df1ae6e6813a2aca0', '2026-11-08 21:14:15.068361+00', '20261009200000_support_chat', '', NULL, '2026-11-08 21:14:15.068361+00', 0);
INSERT INTO public._prisma_migrations VALUES ('6ca6e669-6cb1-4dcf-8704-2fbd2e3fc519', 'a69ee992f54bf52dc79d31249a8cd835905ff8fc898265c54441569f25d0cb6e', '2026-11-08 21:14:16.529486+00', '20261009223000_support_tickets_visibility', '', NULL, '2026-11-08 21:14:16.529486+00', 0);
INSERT INTO public._prisma_migrations VALUES ('988809f8-cdb7-46fc-b3c2-6c3c64e32470', '9761b70bdda8d4bb64e6351fd0be14a6cb53db56d1e90f3488be9c76b14df488', '2026-11-08 21:14:17.989143+00', '20261010000000_add_seo_settings', '', NULL, '2026-11-08 21:14:17.989143+00', 0);
INSERT INTO public._prisma_migrations VALUES ('00f036a3-128b-405d-8055-43adf52002f9', '3d3f967e92fdf68c3af91ee56a7e903ae785440c38b1f3921acaaeb9bfce9cdb', '2026-11-08 21:14:19.446955+00', '20261010191500_add_product_default_image', '', NULL, '2026-11-08 21:14:19.446955+00', 0);
INSERT INTO public._prisma_migrations VALUES ('78a0ccec-7e84-444e-bcf5-6198b2d67cad', '8e59a0512b5e5de767b9d15a5849c41f3c5fa8a4399f6429e650795c660089e2', '2026-11-08 21:14:20.904013+00', '20261010195000_add_product_card_style', '', NULL, '2026-11-08 21:14:20.904013+00', 0);
INSERT INTO public._prisma_migrations VALUES ('6af3f86a-c80a-45e4-825b-9d800ac2b81b', 'a9839d84e69a5a14e3eec786562d89bf192be7447b6b7624b07a7d4c845a9f88', '2026-11-08 21:14:22.327369+00', '20261011140000_platform_tenants', '', NULL, '2026-11-08 21:14:22.327369+00', 0);
INSERT INTO public._prisma_migrations VALUES ('ebee61ca-dd90-408a-9248-b2f6e7be78f5', '07ff4798826c48d98c62f8cfb95ef3f0e13a4cd7ff2453a44a071c29d616c49e', '2026-11-08 21:14:23.77829+00', '20261011160000_tenant_support_tickets', '', NULL, '2026-11-08 21:14:23.77829+00', 0);
INSERT INTO public._prisma_migrations VALUES ('3c1aa959-7034-4e06-90fd-b64d77ef6ea0', '5b7c2aab3e0e490de792d3563b97ba7f4a53569e9353c3ab5298f611880fb4b2', '2026-11-08 21:14:25.265532+00', '20261011180000_crm_tariff_plans', '', NULL, '2026-11-08 21:14:25.265532+00', 0);
INSERT INTO public._prisma_migrations VALUES ('3d8545dc-a596-4bf7-9d1c-4d8690150c5c', 'bfd54b468f6f9b34ea3b42cce558a59f8e5818f9f7a15e893bfa03a9a1872457', '2026-11-08 21:14:26.755217+00', '20261011190000_crm_subscription_pages', '', NULL, '2026-11-08 21:14:26.755217+00', 0);
INSERT INTO public._prisma_migrations VALUES ('ff6b4858-d1c8-4794-9337-f46e7917f627', 'a7580b883265be58acc5f6ec5b85a6b3e79a49573b3792b97f85061bbedff1e8', '2026-11-08 21:14:28.24112+00', '20261011203000_tenant_pay_fields', '', NULL, '2026-11-08 21:14:28.24112+00', 0);
INSERT INTO public._prisma_migrations VALUES ('b5f81f0d-10f7-41f2-a83f-dadd6e7fb90d', '8a4d07f0700e87a330b6c2a2822f8f6674c6ba6b50d98a1b12c7e2b9a3013a50', '2026-11-08 21:14:29.681346+00', '20261011222000_crm_cameras', '', NULL, '2026-11-08 21:14:29.681346+00', 0);
INSERT INTO public._prisma_migrations VALUES ('5a23a4fe-85f6-4a06-8613-14e45c1eb9f8', 'bb31a872a1cdb8f0963c2bfcd3014f376d717c49dcb42a830426a80e5865a4a5', '2026-11-08 21:14:31.121059+00', '20261011224500_crm_subscription_options', '', NULL, '2026-11-08 21:14:31.121059+00', 0);
INSERT INTO public._prisma_migrations VALUES ('7fa7cd17-7b99-4464-87af-56d44135423d', 'f021d1e73d5ef720e722f94842d395891f5016a837a5c8f58aab8e0431aae601', '2026-11-08 21:14:32.649503+00', '20261012012000_crm_calls', '', NULL, '2026-11-08 21:14:32.649503+00', 0);
INSERT INTO public._prisma_migrations VALUES ('60883ff7-b76c-4c5c-9f39-04824545f568', '41bf312a64ef260c32a6dc66e1fbd7de0e45368e990a6f35e0500db5dcf885c7', '2026-11-08 21:14:34.06657+00', '20261012020000_crm_integrations', '', NULL, '2026-11-08 21:14:34.06657+00', 0);
INSERT INTO public._prisma_migrations VALUES ('2d3d5810-429d-40bb-a617-ed88d53bad4b', '6186d2261cd19d275eaf6029777b4c2024e15a0761f9eccbdae49cc1cffa389d', '2026-11-08 21:14:35.522379+00', '20261013204500_help_articles', '', NULL, '2026-11-08 21:14:35.522379+00', 0);
INSERT INTO public._prisma_migrations VALUES ('9f30484f-6b55-41ac-8c02-d0e9fc097399', '80af48117d48a4494e028d7966bb83e2a17c10e1a26bac28d2432321f2d498a7', '2026-11-08 21:14:36.948498+00', '20261013210000_tenant_ticket_attachments', '', NULL, '2026-11-08 21:14:36.948498+00', 0);
INSERT INTO public._prisma_migrations VALUES ('82db0da2-e17c-4f47-8b47-ced9764910f7', '72ab017ac7872c8cd4c8963fafbc9cccb64959aff63ae2f8cafcbe9ce66e1d2d', '2026-11-08 21:14:38.445761+00', '20261014120000_schedule', '', NULL, '2026-11-08 21:14:38.445761+00', 0);
INSERT INTO public._prisma_migrations VALUES ('d987bde8-fcd1-4252-ad89-80b5d1c87f54', '174f143c40b8c4a28513c51f8a9b753810d2bbc8e2fcb201447ac1d74e8b33a1', '2026-11-08 21:14:39.981736+00', '20261014140000_product_crm_renew_months', '', NULL, '2026-11-08 21:14:39.981736+00', 0);
INSERT INTO public._prisma_migrations VALUES ('d7405e46-f8c2-48fa-83f9-9a999606cdff', '620e41a9218f61ff62dda63617efb5cf22d906684418ad6fcba38f140160a004', '2026-11-08 21:14:41.479214+00', '20261014150000_schedule_settings', '', NULL, '2026-11-08 21:14:41.479214+00', 0);
INSERT INTO public._prisma_migrations VALUES ('cd8ae6a5-5908-48c3-8c7f-f61b42ca0904', '7218d83203d2d6b71d22d2d59ccadfc1cc12db0d79c03aeffe20e19d300cac33', '2026-11-08 21:14:43.012167+00', '20261015103000_role_show_calendar_metric', '', NULL, '2026-11-08 21:14:43.012167+00', 0);
INSERT INTO public._prisma_migrations VALUES ('36392416-23ca-4269-889c-d052b78ee5a6', 'edb74c1bcca8961cfdab0b8fb34d48fdf10aabe6b3e55131a36a998e96401f2b', '2026-11-08 21:14:44.43539+00', '20261015130000_user_calendar_timeline_pos', '', NULL, '2026-11-08 21:14:44.43539+00', 0);
INSERT INTO public._prisma_migrations VALUES ('15f5c852-cd23-45fb-b95b-656ac8b4c447', '2b9dc1848a66362fef25f661e6b6074d3cc999380df5d79305757578aab15ca5', '2026-11-08 21:14:45.889362+00', '20261015160000_user_calendar_timeline_size', '', NULL, '2026-11-08 21:14:45.889362+00', 0);
INSERT INTO public._prisma_migrations VALUES ('1ccba3db-2485-4b6d-96e9-bbfce2d34e90', 'ab711df423380ca189ba16c5efd977231abef4a48cdf4985d923af20fce942b9', '2026-11-08 21:14:47.349741+00', '20261015170000_user_calendar_theme', '', NULL, '2026-11-08 21:14:47.349741+00', 0);
INSERT INTO public._prisma_migrations VALUES ('ac011c44-1115-4918-a0d1-5469d1b4ba1f', '95cf5a607326e34932a366477a4518507c960517b3b033a6db65071d3071ccef', '2026-11-08 21:14:48.812567+00', '20261015213000_status_auto_change', '', NULL, '2026-11-08 21:14:48.812567+00', 0);
INSERT INTO public._prisma_migrations VALUES ('41073bbe-0607-4069-9d90-5b833f067287', '1bfcd143f97094ceb2bdc0549eb14f0aa3cd6c3349d85cd571ff7af04ae03651', '2026-11-08 21:14:50.222795+00', '20261015223000_status_auto_change_enabled_at', '', NULL, '2026-11-08 21:14:50.222795+00', 0);
INSERT INTO public._prisma_migrations VALUES ('5026d707-02a4-458c-9dd7-eb65373bceec', '57b2e1b922d573b0cc579b8dff719117cbeb789d78bcc924362b85469a10cf58', '2026-11-08 21:14:51.637308+00', '20261016095800_task_is_favorite', '', NULL, '2026-11-08 21:14:51.637308+00', 0);
INSERT INTO public._prisma_migrations VALUES ('2fcb391a-18a6-4198-8325-c6b9ebf015b3', '60fc5973495f838c35b3aa9b3c82a2c61e518375f763296fc9c6f7a8bc295026', '2026-11-08 21:14:53.04597+00', '20261016203000_comment_pinned', '', NULL, '2026-11-08 21:14:53.04597+00', 0);
INSERT INTO public._prisma_migrations VALUES ('e52669d5-c8d4-4aaf-a22a-524823fa520d', 'fa5549b7ad4078d35685a5d2f8c0067e67e8896e4eb58f922e53ab1ad1d38a16', '2026-11-08 21:14:54.432572+00', '20261016220000_task_favorites_user', '', NULL, '2026-11-08 21:14:54.432572+00', 0);
INSERT INTO public._prisma_migrations VALUES ('142b0e73-8269-41bc-a006-4b4655a313e9', '63c5e3f8b34804f17937dee9d0db63113e1898a820f3b6454799b4f1d7e9fbdc', '2026-11-08 21:14:55.831822+00', '20261017010500_role_is_system_handler', '', NULL, '2026-11-08 21:14:55.831822+00', 0);
INSERT INTO public._prisma_migrations VALUES ('bfb11695-3213-440a-b191-818e219bfc0b', '2903da31c71ec49195ad6c84f5f85e4530bc2b49bfce95690685f8e12438db45', '2026-11-08 21:14:57.221559+00', '20261018164500_role_contact_accesses', '', NULL, '2026-11-08 21:14:57.221559+00', 0);
INSERT INTO public._prisma_migrations VALUES ('b0270eb0-ca04-472c-abf5-c9025b482eb7', '33309f2d26c9ef6e6f9d75b911028acb91c3cee679ed1dbba64d7c71cbcf518f', '2026-11-08 21:14:58.675071+00', '20261019120000_split_vk_group_plugin', '', NULL, '2026-11-08 21:14:58.675071+00', 0);
INSERT INTO public._prisma_migrations VALUES ('7a3705c9-bc57-4a6a-9430-37b12447f10b', '089510b658e9f4be923a2fa47d7b8bc8d70d3c08a4bc97326e74c5664d6fcd48', '2026-11-08 21:15:00.130637+00', '20261019160000_ozon_seller_auto_sync', '', NULL, '2026-11-08 21:15:00.130637+00', 0);
INSERT INTO public._prisma_migrations VALUES ('ae81d638-5b4c-44fd-82d3-00303f9456fb', '0b54ea24c532142930abd0ca0c6ab08e68feec49842efb7abf65f60cbac62d97', '2026-11-08 21:15:01.514056+00', '20261020195000_vk_user_id_bigint', '', NULL, '2026-11-08 21:15:01.514056+00', 0);
INSERT INTO public._prisma_migrations VALUES ('da4ac741-cd37-4507-ade4-e2dee778d499', '88c5c29c37e6b16a9527e2e09d26f552fe4a20f7716717cf326521b020fe7d07', '2026-11-08 21:15:02.9657+00', '20261020196000_vk_peer_id_bigint', '', NULL, '2026-11-08 21:15:02.9657+00', 0);
INSERT INTO public._prisma_migrations VALUES ('367bbf05-6fc9-43ee-8f2a-c3c6f9174908', '1b7241d7876616e1836afefe1188867c71e9e18a93b9df4d939d2b26221a8901', '2026-11-08 21:15:04.392531+00', '20261021001000_hikvision_plugin_settings', '', NULL, '2026-11-08 21:15:04.392531+00', 0);
INSERT INTO public._prisma_migrations VALUES ('f36733b9-d9d8-4bf5-b43c-33310fdb8abe', '7ac0b996be0095be5f4a71d408c93eb78360ee2e2e20024e4489bd8cee5a0893', '2026-11-08 21:15:05.839521+00', '20261021083000_hikvision_validate_code', '', NULL, '2026-11-08 21:15:05.839521+00', 0);
INSERT INTO public._prisma_migrations VALUES ('7bd9d451-edc5-40c6-995a-ae3a216e23c1', 'ddc1d833fe5f8c14e7109c646ca26f36d66e5811859fddae38c68fca940fb0df', '2026-11-08 21:15:07.25814+00', '20261021160000_user_timezone_and_task_start_date', '', NULL, '2026-11-08 21:15:07.25814+00', 0);
INSERT INTO public._prisma_migrations VALUES ('6821210c-d0cc-48f5-b4d9-d18651df2d8f', '5e5a2b7e81c432fdc4df594fb4c4cd71d1e59ec296d8d363cbd009b54298ae31', '2026-11-08 21:15:08.663841+00', '20261021165000_task_start_date_default_now', '', NULL, '2026-11-08 21:15:08.663841+00', 0);
INSERT INTO public._prisma_migrations VALUES ('af51c803-b126-4f17-bd24-76623f96fdbf', '88f812c5c8ee45533e8ef18634777b61965fd098da246f98f65ef2758d7be15a', '2026-11-08 21:15:10.092732+00', '20261021180000_add_email_mark_as_read', '', NULL, '2026-11-08 21:15:10.092732+00', 0);
INSERT INTO public._prisma_migrations VALUES ('e81d6042-ed77-494d-9912-79313f6420f6', '5bb5f931d811d416234da2b157b1a66aeebae91ef70d1ca9221e2e75f0d2b494', '2026-11-08 21:15:11.522113+00', '20261021190000_client_devices_and_contact_key', '', NULL, '2026-11-08 21:15:11.522113+00', 0);
INSERT INTO public._prisma_migrations VALUES ('dddfccd1-0b29-49c3-9a0f-100518adb552', 'dbf3c025606e815cea353427cd41ba9d0153de572c9965b9bed60267b2c38b4c', '2026-11-08 21:15:12.935695+00', '20261021210000_client_devices_updated_at', '', NULL, '2026-11-08 21:15:12.935695+00', 0);
INSERT INTO public._prisma_migrations VALUES ('fdac2039-a47d-4c84-bb85-ec340c6273a5', '6a0b0232d3bf10773255589ad4a176f1d66afb69e6dc8e4b170534f44a2a7e68', '2026-11-08 21:15:14.377765+00', '20261022190000_system_timezone', '', NULL, '2026-11-08 21:15:14.377765+00', 0);
INSERT INTO public._prisma_migrations VALUES ('c3b6a5d6-a1af-4fda-9498-72075b9bbe01', '577ca7db06faf1b5f8f39d05e88584646440f853310c7d83e7291612a750973a', '2026-11-08 21:15:15.762645+00', '20261022233000_vitrine_favorites', '', NULL, '2026-11-08 21:15:15.762645+00', 0);
INSERT INTO public._prisma_migrations VALUES ('a5d435a7-0f51-44a6-800f-a56c4e1be71a', '60741646c444b3be8ca7d2e508f6ea52acbd63ebd30318ef9c34f109e38f66fb', '2026-11-08 21:15:17.174609+00', '20261023000500_vitrine_favorite_share_link', '', NULL, '2026-11-08 21:15:17.174609+00', 0);
INSERT INTO public._prisma_migrations VALUES ('e3364487-16bd-4813-bf7e-8e9073328dae', 'd0aa72a702e7a62268098f7f33e917790e437c4a16d4fdc9b39d3363c676aed2', '2026-11-08 21:15:18.589498+00', '20261023170000_tenant_ticket_task_link', '', NULL, '2026-11-08 21:15:18.589498+00', 0);
INSERT INTO public._prisma_migrations VALUES ('340671a5-1208-40e6-bdf9-deaee539de99', 'a258f63636d75eb98ce9abab9c34000384b5d77e11db1c9a68e0a05afb6e5990', '2026-11-08 21:15:20.018691+00', '20261023235700_price_type_for_ozon', '', NULL, '2026-11-08 21:15:20.018691+00', 0);
INSERT INTO public._prisma_migrations VALUES ('503c83f5-1494-4d83-bce5-509abd2f7c89', '585984f2646c297f4dcf66dcd75591172a34534550ef73a5741f4b34d456d42b', '2026-11-08 21:15:21.426941+00', '20261023235800_ozon_stock_source', '', NULL, '2026-11-08 21:15:21.426941+00', 0);
INSERT INTO public._prisma_migrations VALUES ('6b00fc41-e3b2-4656-91bb-a6ff419288f8', 'f9ecd641ce60a512bcde8f8cc0a9ac1a56e8a60650a1fc10b3d0c5fa0daf64f3', '2026-11-08 21:15:22.883817+00', '20261024002000_ozon_stock_warehouse', '', NULL, '2026-11-08 21:15:22.883817+00', 0);
INSERT INTO public._prisma_migrations VALUES ('6f4f157f-4e46-438a-bf4a-92012daa90e1', '45da77eb9d0cc5a05455417cf1e52c06c192727fb76fba719ed0b94ea4025252', '2026-11-08 21:15:24.333092+00', '20261024004000_ozon_modes_and_intervals', '', NULL, '2026-11-08 21:15:24.333092+00', 0);
INSERT INTO public._prisma_migrations VALUES ('84bf5ddc-bbc7-4ec9-8145-d4845d722a79', '9fac8e6c8ce8255a887ba17f70f9108d0c0a9b5d8d18bc25698be45900fd5eb7', '2026-11-08 21:15:25.750994+00', '20261024041000_wb_seller_plugin', '', NULL, '2026-11-08 21:15:25.750994+00', 0);
INSERT INTO public._prisma_migrations VALUES ('99df4ca0-3536-4eba-a0df-35b72d03529e', 'd5261ed224983b341b057ac339e8fde7ee72f8d03b20511ba1ed10f99472cdd9', '2026-11-08 21:15:27.170884+00', '20261025110000_vk_community_default_project', '', NULL, '2026-11-08 21:15:27.170884+00', 0);
INSERT INTO public._prisma_migrations VALUES ('a6f94893-afce-4d5e-bae5-c9e5164f7308', '8b2ab19318e144ad689222fa54ea23acf2e5bc10418482fabac4008812fd5470', '2026-11-08 21:15:28.536471+00', '20261025131500_cdek_plugin', '', NULL, '2026-11-08 21:15:28.536471+00', 0);
INSERT INTO public._prisma_migrations VALUES ('4a086e44-9b91-47b1-9e7d-8895173e008e', 'd74f38884583eea089b332037f32dc1f27fd328426bd2e302c219d89def9f447', '2026-11-08 21:15:29.919278+00', '20261027001500_mail_accounts', '', NULL, '2026-11-08 21:15:29.919278+00', 0);
INSERT INTO public._prisma_migrations VALUES ('12f5d4d1-78b3-4af5-8c1b-5107ed240dc3', '7b84101baca0f030c2b660b0c81aac3889148262b7ef6ea0f3816a7315fcd13e', '2026-11-08 21:15:31.338603+00', '20261028001500_mail_account_signature', '', NULL, '2026-11-08 21:15:31.338603+00', 0);
INSERT INTO public._prisma_migrations VALUES ('afabff84-fd0f-47d9-ae2d-8a53bc1b4fb0', '5f42aa5e71b65e311b42911982c2b006640e616b702634a17c779a3448615e59', '2026-11-08 21:15:32.72688+00', '20261028130300_contact_is_spam', '', NULL, '2026-11-08 21:15:32.72688+00', 0);
INSERT INTO public._prisma_migrations VALUES ('f5b003d5-9f3d-4c84-850f-445e4dd6e357', 'a5a879bdb556d14ce86f01f6ab156e61de9f8ff3abe07e3351d47a8476c82dc7', '2026-11-08 21:15:34.116991+00', '20261029100000_tapo_plugin_settings', '', NULL, '2026-11-08 21:15:34.116991+00', 0);
INSERT INTO public._prisma_migrations VALUES ('3d1b52a8-21af-4f78-af2c-afa6f6b3e831', 'baf7e8df8f42e6152c0c3c3eae1c5f32d2c67c1488b6ed39c38d3e54009aaa3f', '2026-11-08 21:15:35.50417+00', '20261029120000_tapo_extra_cameras', '', NULL, '2026-11-08 21:15:35.50417+00', 0);
INSERT INTO public._prisma_migrations VALUES ('4d21025a-5e5b-42aa-99e6-6c631adc7d39', '70995aa59aa0a31b5469ec313eef8b55d1dea2ce80e1e5e585a97d53dda1da28', '2026-11-08 21:15:36.915274+00', '20261106190000_vk_market_autosync', '', NULL, '2026-11-08 21:15:36.915274+00', 0);
INSERT INTO public._prisma_migrations VALUES ('471ec0c5-a6da-46d0-a7bb-615fd54a83e5', '314d0bf256ee5d6374b08fedffeb3228825213760a622092abc5fb81ec44de6d', '2026-11-08 21:15:38.297651+00', '20261108014000_product_source', '', NULL, '2026-11-08 21:15:38.297651+00', 0);
INSERT INTO public._prisma_migrations VALUES ('ab4fb873-7308-49e5-bead-20d2324e3763', '136ccd19f432467cad3d3095899f6bff5dd348f4679c234177cc50c7ca3f381b', '2026-11-08 21:15:39.694001+00', '20261108090000_file_hide_settings', '', NULL, '2026-11-08 21:15:39.694001+00', 0);
INSERT INTO public._prisma_migrations VALUES ('550ecc1b-6980-48f0-a9bb-24e635a498f6', '41f8c2597da9a22588e99ac35f84e65e0b08062f057c49932b983bb8ce7c67f2', '2026-11-08 21:15:41.081901+00', '20261108120000_files_page_theme', '', NULL, '2026-11-08 21:15:41.081901+00', 0);
INSERT INTO public._prisma_migrations VALUES ('1539e39f-3f11-4b66-b712-b7343ac8e440', '4fc99ef1d24be6137d1d7979ef962fa634bf9b73443cb2d09bb2b9836cf9e9d1', '2026-11-08 21:15:42.506978+00', '20261108133000_files_theme_default_win7', '', NULL, '2026-11-08 21:15:42.506978+00', 0);
INSERT INTO public._prisma_migrations VALUES ('d44d182a-eaea-48f5-b0c4-5e0b50267c15', 'cdf2b1c43da702d3c01377e38750e8dceb76830f9f7d7005b86328a843ca9c76', '2026-11-08 21:15:43.945059+00', '20261108153000_files_table_view', '', NULL, '2026-11-08 21:15:43.945059+00', 0);
INSERT INTO public._prisma_migrations VALUES ('c131e964-ad92-4823-bafe-882bf8a723f7', '9481f37413655bfa8a8219fb96479c1fd4ea0742a442e208ae33db989192268a', '2026-11-08 21:15:45.343545+00', '20261109000000_legal_cookies', '', NULL, '2026-11-08 21:15:45.343545+00', 0);
INSERT INTO public._prisma_migrations VALUES ('8e9f22e5-ead4-4906-be77-46ece597409d', 'd8bfe1e1ac7e8ab904f24df7b61280656ea31ba83c41fff4d2ddfbf296e38bce', '2026-11-08 21:15:46.735317+00', '20261109010000_auth_events', '', NULL, '2026-11-08 21:15:46.735317+00', 0);
INSERT INTO public._prisma_migrations VALUES ('d042f37f-fd48-46fc-82e3-8c65422c4cb0', '896e8f660c238d1f53e9dd7e28166d580290868e7dcc9a2f1bfcce541f86b030', '2026-11-08 21:15:48.189295+00', '20261109020000_auth_event_failures', '', NULL, '2026-11-08 21:15:48.189295+00', 0);


--
-- PostgreSQL database dump complete
--

\unrestrict rftW7ZqBwYwmw3EIu4Nl1oFZy0nWGIF0FGXeabxxmi0baAKYnfSTxvY4m30RmjU

