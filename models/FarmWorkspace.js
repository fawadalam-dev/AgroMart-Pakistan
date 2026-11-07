import { query } from '../db/database.js'

function parseWorkspace(value) {
    return typeof value === 'string' ? JSON.parse(value) : value
}

class FarmWorkspace {
    static async findByOwnerId(ownerUserId) {
        const { rows } = await query(
            'SELECT workspace_json FROM farm_workspaces WHERE owner_user_id = $1',
            [ownerUserId]
        )
        return rows[0] ? parseWorkspace(rows[0].workspace_json) : null
    }

    static async save(ownerUserId, workspace) {
        const now = new Date().toISOString()
        await query(`
            INSERT INTO farm_workspaces (owner_user_id, workspace_json, created_at, updated_at)
            VALUES ($1, $2, $3, $3)
            ON CONFLICT (owner_user_id) DO UPDATE SET
                workspace_json = EXCLUDED.workspace_json,
                updated_at = EXCLUDED.updated_at
        `, [ownerUserId, JSON.stringify(workspace), now])
    }

    static async findAll() {
        const { rows } = await query(`
            SELECT users.id AS owner_user_id, users.name, users.email, users.phone,
                   farm_workspaces.workspace_json, farm_workspaces.updated_at
            FROM farm_workspaces
            JOIN users ON users.id = farm_workspaces.owner_user_id
            ORDER BY farm_workspaces.updated_at DESC
        `)
        return rows.map((row) => ({
            owner: {
                id: row.owner_user_id,
                name: row.name,
                email: row.email,
                phone: row.phone
            },
            workspace: parseWorkspace(row.workspace_json),
            updatedAt: row.updated_at
        }))
    }
}

export default FarmWorkspace
