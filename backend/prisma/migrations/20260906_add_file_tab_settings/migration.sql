-- CreateTable
CREATE TABLE file_tab_settings (
    id TEXT NOT NULL,
    tab_key TEXT NOT NULL,
    url TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP(3) NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT file_tab_settings_pkey PRIMARY KEY (id)
);

-- CreateIndex
CREATE UNIQUE INDEX file_tab_settings_tab_key_key ON file_tab_settings(tab_key);
