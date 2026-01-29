import { getQuery, runQuery, allQuery } from '../database/database.js';

const proxyService = {
    // Get all proxies
    async getAll() {
        try {
            return await allQuery('SELECT * FROM proxies');
        } catch (error) {
            console.error('Error fetching proxies:', error);
            throw error;
        }
    },

    // Get specific proxy by ID
    async getById(id) {
        try {
            return await getQuery('SELECT * FROM proxies WHERE id = ?', [id]);
        } catch (error) {
            console.error('Error fetching proxy:', error);
            throw error;
        }
    },

    // Create new proxy
    async create(data) {
        try {
            const { name, host, port, protocol, auth_enabled, username, password, active } = data;

            const result = await runQuery(
                `INSERT INTO proxies (name, host, port, protocol, auth_enabled, username, password, active) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, host, port, protocol || 'http', auth_enabled ? 1 : 0, username, password, active !== false ? 1 : 0]
            );

            return { id: result.id, ...data };
        } catch (error) {
            console.error('Error creating proxy:', error);
            throw error;
        }
    },

    // Update proxy
    async update(id, data) {
        try {
            const { name, host, port, protocol, auth_enabled, username, password, active } = data;

            await runQuery(
                `UPDATE proxies 
                 SET name = ?, host = ?, port = ?, protocol = ?, auth_enabled = ?, username = ?, password = ?, active = ?, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = ?`,
                [name, host, port, protocol, auth_enabled ? 1 : 0, username, password, active !== false ? 1 : 0, id]
            );

            return await this.getById(id);
        } catch (error) {
            console.error('Error updating proxy:', error);
            throw error;
        }
    },

    // Delete proxy
    async delete(id) {
        try {
            // Unassign accounts using this proxy
            await runQuery('UPDATE accounts SET proxy_id = NULL WHERE proxy_id = ?', [id]);

            // Delete proxy
            await runQuery('DELETE FROM proxies WHERE id = ?', [id]);
            return true;
        } catch (error) {
            console.error('Error deleting proxy:', error);
            throw error;
        }
    },

    // Assign accounts to proxy
    async assignAccounts(proxyId, accountIds) {
        try {
            // First clear this proxy from all accounts (to ensure we only have selected ones)
            // OPTIONAL: If we want "Select accounts for this proxy" to be exclusive. 
            // But simpler: just update the selected ones.

            // Wait: If I check "Account A" for "Proxy 1", Account A now points to Proxy 1.
            // If I uncheck it, it should point to NULL.

            // Strategy: 
            // 1. Find all accounts currently pointing to this proxy.
            // 2. Identify which ones are NO LONGER in accountIds list -> Set to NULL.
            // 3. Update accounts in accountIds list -> Set to proxyId.

            const currentAccounts = await allQuery('SELECT id FROM accounts WHERE proxy_id = ?', [proxyId]);
            const currentIds = currentAccounts.map(a => a.id);

            const toRemove = currentIds.filter(id => !accountIds.includes(id));
            const toAdd = accountIds; // All in this list should be set to proxyId

            if (toRemove.length > 0) {
                await runQuery(`UPDATE accounts SET proxy_id = NULL WHERE id IN (${toRemove.join(',')})`);
            }

            if (toAdd.length > 0) {
                await runQuery(`UPDATE accounts SET proxy_id = ? WHERE id IN (${toAdd.join(',')})`, [proxyId]);
            }

            return true;
        } catch (error) {
            console.error('Error assigning accounts to proxy:', error);
            throw error;
        }
    },

    // Get accounts assigned to a proxy
    async getAssignedAccounts(proxyId) {
        try {
            return await allQuery('SELECT id FROM accounts WHERE proxy_id = ?', [proxyId]);
        } catch (error) {
            console.error('Error fetching assigned accounts:', error);
            throw error;
        }
    }
};

export default proxyService;
