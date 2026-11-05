import { randomBytes } from 'node:crypto'
import { query } from '../db/database.js'

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
