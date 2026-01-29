-- Add network_mode column to accounts table
-- This allows each account to choose between 'local' (server network) or 'proxy' (datacenter proxy)

ALTER TABLE accounts ADD COLUMN network_mode TEXT DEFAULT 'local';

-- Update all existing accounts to use local network by default
UPDATE accounts SET network_mode = 'local' WHERE network_mode IS NULL;
