import { randomBytes } from 'node:crypto'
import { getPostgresPool, getSqliteDatabase, query } from '../db/database.js'

class User {
    constructor(record) {
        Object.assign(this, record)
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            phone: this.phone,
            role: this.role
        }
    }

    static async exists(filter) {
        const field = filter.email !== undefined ? 'email' : 'role'
        const value = filter[field]
        const { rows } = await query(`SELECT 1 FROM users WHERE ${field} = $1 LIMIT 1`, [value])
        return rows.length > 0
    }

    static async findOne({ email }) {
        const { rows } = await query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [email.toLowerCase()])
        const record = rows[0]
        return record ? User.fromRecord(record) : null
    }

    static async findById(id) {
        const { rows } = await query('SELECT * FROM users WHERE id = $1', [id])
        const record = rows[0]
        return record ? User.fromRecord(record) : null
    }

    static async create(values) {
        const id = randomBytes(12).toString('hex')
        const now = new Date().toISOString()
        const record = {
            id,
            name: values.name.trim(),
            email: values.email.trim().toLowerCase(),
            phone: values.phone.trim(),
            passwordHash: values.passwordHash,
            role: values.role || 'user',
            createdAt: now,
            updatedAt: now
        }
        await query(`
            INSERT INTO users (id, name, email, phone, password_hash, role, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            record.id,
            record.name,
            record.email,
            record.phone,
            record.passwordHash,
            record.role,
            record.createdAt,
            record.updatedAt
        ])
        return new User(record)
    }

    static async issuePasswordResetCode(userId, codeHash, expiresAt) {
        await query('DELETE FROM password_reset_tokens WHERE expires_at <= $1', [Date.now()])
        await query(`
            INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, attempts)
            VALUES ($1, $2, $3, 0)
            ON CONFLICT (user_id) DO UPDATE
            SET token_hash = EXCLUDED.token_hash, expires_at = EXCLUDED.expires_at, attempts = 0
        `, [userId, codeHash, expiresAt])
    }

    static async deletePasswordResetCode(userId, codeHash) {
        await query('DELETE FROM password_reset_tokens WHERE user_id = $1 AND token_hash = $2', [userId, codeHash])
    }

    static async resetPasswordWithCode(email, codeHash, passwordHash) {
        const now = Date.now()
        if (process.env.DATABASE_URL) {
            const client = await getPostgresPool().connect()
            try {
                await client.query('BEGIN')
                const result = await client.query(`
                    SELECT users.id, password_reset_tokens.token_hash, password_reset_tokens.expires_at, password_reset_tokens.attempts
                    FROM password_reset_tokens
                    INNER JOIN users ON users.id = password_reset_tokens.user_id
                    WHERE LOWER(users.email) = $1
                    FOR UPDATE OF password_reset_tokens
                `, [email])
                const reset = result.rows[0]
                if (!reset || Number(reset.expires_at) <= now) {
                    if (reset) await client.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [reset.id])
                    await client.query('COMMIT')
                    return 'invalid'
                }
                if (reset.token_hash !== codeHash) {
                    const attempts = Number(reset.attempts) + 1
                    if (attempts >= 5) {
                        await client.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [reset.id])
                        await client.query('COMMIT')
                        return 'locked'
                    }
                    await client.query('UPDATE password_reset_tokens SET attempts = $1 WHERE user_id = $2', [attempts, reset.id])
                    await client.query('COMMIT')
                    return 'invalid'
                }
                await client.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [reset.id])
                await client.query(
                    'UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3',
                    [passwordHash, new Date(now).toISOString(), reset.id]
                )
                await client.query('COMMIT')
                return 'updated'
            } catch (error) {
                await client.query('ROLLBACK')
                throw error
            } finally {
                client.release()
            }
        }

        const database = getSqliteDatabase()
        return database.transaction(() => {
            const reset = database.prepare(`
                SELECT users.id, password_reset_tokens.token_hash, password_reset_tokens.expires_at, password_reset_tokens.attempts
                FROM password_reset_tokens
                INNER JOIN users ON users.id = password_reset_tokens.user_id
                WHERE LOWER(users.email) = ?
            `).get(email)
            if (!reset || Number(reset.expires_at) <= now) {
                if (reset) database.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(reset.id)
                return 'invalid'
            }
            if (reset.token_hash !== codeHash) {
                const attempts = Number(reset.attempts) + 1
                if (attempts >= 5) {
                    database.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(reset.id)
                    return 'locked'
                }
                database.prepare('UPDATE password_reset_tokens SET attempts = ? WHERE user_id = ?').run(attempts, reset.id)
                return 'invalid'
            }
            database.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(reset.id)
            database.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
                .run(passwordHash, new Date(now).toISOString(), reset.id)
            return 'updated'
        })()
    }

    static fromRecord(record) {
        return new User({
            id: record.id,
            name: record.name,
            email: record.email,
            phone: record.phone,
            passwordHash: record.password_hash,
            role: record.role,
            createdAt: record.created_at,
            updatedAt: record.updated_at
        })
    }
}

export default User
