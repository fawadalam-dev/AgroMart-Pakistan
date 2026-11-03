import 'dotenv/config'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import Database from 'better-sqlite3'
import Product from '../models/Product.js'
import {
    closeDatabase,
    connectDatabase,
    getPostgresPool
} from '../db/database.js'

async function main() {
    if (!process.env.DATABASE_URL) {
        throw new Error('Set DATABASE_URL to the hosted PostgreSQL connection string before migrating.')
    }

    const sourcePath = resolve(process.env.SQLITE_DB_PATH || 'data/agromart.sqlite')
    if (!existsSync(sourcePath)) {
        throw new Error(`Local SQLite database was not found at ${sourcePath}.`)
    }

    const source = new Database(sourcePath, { readonly: true, fileMustExist: true })
    let client
    let transactionStarted = false
    try {
        await connectDatabase()
        client = await getPostgresPool().connect()
        const users = source.prepare('SELECT * FROM users').all()
        const products = source.prepare('SELECT * FROM products').all()

        await client.query('BEGIN')
        transactionStarted = true
        const userCount = Number((await client.query('SELECT COUNT(*) AS count FROM users')).rows[0].count)
        const productCount = Number((await client.query('SELECT COUNT(*) AS count FROM products')).rows[0].count)
        if (userCount || productCount) {
            throw new Error('Hosted database is not empty. Migration stopped to avoid overwriting existing data.')
        }

        for (const user of users) {
            await client.query(`
                INSERT INTO users (id, name, email, phone, password_hash, role, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                user.id,
                user.name,
                user.email.trim().toLowerCase(),
                user.phone,
                user.password_hash,
                user.role,
                user.created_at,
                user.updated_at
            ])
        }

        for (const product of products) {
            const data = Product.fromRecord(product)
            await client.query(`
                INSERT INTO products (
                    id, status, name, category, sections, price, stock, pack_size, unit,
                    details, usage, image, images, badge, rating, reviews, created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9,
                    $10, $11, $12, $13::jsonb, $14, $15, $16, $17, $18
                )
            `, [
                product.id,
                product.status,
                data.name || '',
                data.category || '',
                JSON.stringify(data.sections || []),
                Number(data.price) || 0,
                Number(data.stock) || 0,
                Number(data.packSize) || 0,
                data.unit || 'piece',
                data.details || '',
                data.usage || '',
                data.image || '',
                JSON.stringify(data.images || []),
                data.badge || '',
                data.rating || '4.8',
                Number(data.reviews) || 0,
                product.created_at,
                product.updated_at
            ])
        }

        await client.query('COMMIT')
        transactionStarted = false
        console.log(`Migration complete: ${users.length} user(s), ${products.length} product(s).`)
    } catch (error) {
        if (client && transactionStarted) await client.query('ROLLBACK')
        throw error
    } finally {
        client?.release()
        source.close()
        await closeDatabase()
    }
}

main().catch((error) => {
    console.error(`SQLite to PostgreSQL migration failed: ${error.message}`)
    process.exitCode = 1
})
