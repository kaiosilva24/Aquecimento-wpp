-- Add network_mode if not exists (SQLite doesn't support IF NOT EXISTS for ADD COLUMN directly, so we try and ignore errors manually or just run it)
-- Actually, we can check pragma or just attempt it. simpler to just run and if it fails (duplicate), it fails.
-- But running multiple commands in one go:

BEGIN TRANSACTION;

-- Add network_mode
ALTER TABLE accounts ADD COLUMN network_mode TEXT DEFAULT 'local';

-- Add proxy_id
ALTER TABLE accounts ADD COLUMN proxy_id INTEGER REFERENCES proxies(id);

COMMIT;
