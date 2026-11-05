import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import Database from 'better-sqlite3'
import pg from 'pg'

const { Pool } = pg
const state = globalThis.agromartDatabase || {
    sqlite: null,
    pool: null,
    initialization: null
}
globalThis.agromartDatabase = state

function userSchema(timestampType, booleanType) {
    return `
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
            email_verified ${booleanType} NOT NULL DEFAULT FALSE,
            created_at ${timestampType} NOT NULL,
            updated_at ${timestampType} NOT NULL
        );
    `
}

function emailVerificationsSchema(timestampType) {
    return `
        CREATE TABLE IF NOT EXISTS email_verifications (
            email TEXT PRIMARY KEY,
            code_hash TEXT NOT NULL,
            name TEXT,
            phone TEXT,
            password_hash TEXT,
            attempts INTEGER NOT NULL DEFAULT 0,
            expires_at ${timestampType} NOT NULL,
            last_sent_at ${timestampType} NOT NULL
        );
    `
}

function productsSchema(timestampType, jsonType, jsonDefault) {
    return `
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
            name TEXT NOT NULL DEFAULT '',
            category TEXT NOT NULL DEFAULT '',
            sections ${jsonType} NOT NULL DEFAULT ${jsonDefault},
            price DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (price >= 0),
            stock DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (stock >= 0),
            pack_size DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (pack_size >= 0),
            unit TEXT NOT NULL DEFAULT 'piece',
            details TEXT NOT NULL DEFAULT '',
            usage TEXT NOT NULL DEFAULT '',
            image TEXT NOT NULL DEFAULT '',
            images ${jsonType} NOT NULL DEFAULT ${jsonDefault},
            badge TEXT NOT NULL DEFAULT '',
            rating TEXT NOT NULL DEFAULT '4.8',
            reviews DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (reviews >= 0),
            data_json TEXT,
            created_at ${timestampType} NOT NULL,
            updated_at ${timestampType} NOT NULL
        );

        CREATE INDEX IF NOT EXISTS products_status_created_at
            ON products (status, created_at DESC);
    `
}

function ordersSchema(timestampType, jsonType, jsonDefault) {
    return `
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            client_order_id TEXT NOT NULL,
            owner_user_id TEXT NOT NULL,
            owner_email TEXT NOT NULL,
            owner_name TEXT NOT NULL,
            customer ${jsonType} NOT NULL,
            items ${jsonType} NOT NULL,
            item_details ${jsonType} NOT NULL DEFAULT ${jsonDefault},
            total DOUBLE PRECISION NOT NULL CHECK (total >= 0),
            status TEXT NOT NULL CHECK (status IN ('Processing', 'Shipped', 'Delivered', 'Cancelled')),
            payment_method TEXT NOT NULL,
            payment_status TEXT NOT NULL,
            created_at ${timestampType} NOT NULL,
            updated_at ${timestampType} NOT NULL,
            UNIQUE (owner_user_id, client_order_id)
        );

        CREATE INDEX IF NOT EXISTS orders_owner_created_at
            ON orders (owner_user_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS orders_created_at
            ON orders (created_at DESC);
    `
}

function migrateSqliteProducts(database) {
    const definitions = {
        name: "TEXT NOT NULL DEFAULT ''",
        category: "TEXT NOT NULL DEFAULT ''",
        sections: "TEXT NOT NULL DEFAULT '[]'",
        price: 'REAL NOT NULL DEFAULT 0',
        stock: 'REAL NOT NULL DEFAULT 0',
        pack_size: 'REAL NOT NULL DEFAULT 0',
        unit: "TEXT NOT NULL DEFAULT 'piece'",
        details: "TEXT NOT NULL DEFAULT ''",
        usage: "TEXT NOT NULL DEFAULT ''",
        image: "TEXT NOT NULL DEFAULT ''",
        images: "TEXT NOT NULL DEFAULT '[]'",
        badge: "TEXT NOT NULL DEFAULT ''",
        rating: "TEXT NOT NULL DEFAULT '4.8'",
        reviews: 'REAL NOT NULL DEFAULT 0',
        data_json: 'TEXT'
    }
    const existingColumns = new Set(database.prepare('PRAGMA table_info(products)').all().map((column) => column.name))
    for (const [column, definition] of Object.entries(definitions)) {
        if (!existingColumns.has(column)) {
            database.exec(`ALTER TABLE products ADD COLUMN ${column} ${definition}`)
        }
    }

    const legacyRows = database.prepare("SELECT id, data_json FROM products WHERE name = '' AND data_json IS NOT NULL").all()
    const update = database.prepare(`
        UPDATE products
        SET name = @name, category = @category, sections = @sections, price = @price,
            stock = @stock, pack_size = @pack_size, unit = @unit, details = @details,
            usage = @usage, image = @image, images = @images, badge = @badge,
            rating = @rating, reviews = @reviews
        WHERE id = @id
    `)
    const migrate = database.transaction((rows) => {
        for (const row of rows) {
            const product = JSON.parse(row.data_json)
            update.run({
                id: row.id,
                name: product.name || '',
                category: product.category || '',
                sections: JSON.stringify(product.sections || []),
                price: Number(product.price) || 0,
                stock: Number(product.stock) || 0,
                pack_size: Number(product.packSize) || 0,
                unit: product.unit || 'piece',
                details: product.details || '',
                usage: product.usage || '',
                image: product.image || '',
                images: JSON.stringify(product.images || []),
                badge: product.badge || '',
                rating: product.rating || '4.8',
                reviews: Number(product.reviews) || 0
            })
        }
    })
    migrate(legacyRows)
}

function migrateSqliteUsers(database) {
    const columns = new Set(database.prepare('PRAGMA table_info(users)').all().map((column) => column.name))
    if (!columns.has('email_verified')) {
        database.exec('ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0')
        database.exec("UPDATE users SET email_verified = 1 WHERE role = 'admin'")
    }
}

async function migratePostgresUsers(pool) {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE')
    await pool.query("UPDATE users SET email_verified = TRUE WHERE role = 'admin'")
}

async function migratePostgresProducts(pool) {
    const definitions = [
        "name TEXT NOT NULL DEFAULT ''",
        "category TEXT NOT NULL DEFAULT ''",
        "sections JSONB NOT NULL DEFAULT '[]'::jsonb",
        'price DOUBLE PRECISION NOT NULL DEFAULT 0',
        'stock DOUBLE PRECISION NOT NULL DEFAULT 0',
        'pack_size DOUBLE PRECISION NOT NULL DEFAULT 0',
        "unit TEXT NOT NULL DEFAULT 'piece'",
        "details TEXT NOT NULL DEFAULT ''",
        "usage TEXT NOT NULL DEFAULT ''",
        "image TEXT NOT NULL DEFAULT ''",
        "images JSONB NOT NULL DEFAULT '[]'::jsonb",
        "badge TEXT NOT NULL DEFAULT ''",
        "rating TEXT NOT NULL DEFAULT '4.8'",
        'reviews DOUBLE PRECISION NOT NULL DEFAULT 0',
        'data_json TEXT'
    ]
    await pool.query(definitions
        .map((definition) => `ALTER TABLE products ADD COLUMN IF NOT EXISTS ${definition}`)
        .join(';'))
    await pool.query(`
        UPDATE products SET
            name = COALESCE(data_json::jsonb->>'name', name),
            category = COALESCE(data_json::jsonb->>'category', category),
            sections = COALESCE(data_json::jsonb->'sections', sections),
            price = COALESCE(NULLIF(data_json::jsonb->>'price', '')::double precision, price),
            stock = COALESCE(NULLIF(data_json::jsonb->>'stock', '')::double precision, stock),
            pack_size = COALESCE(NULLIF(data_json::jsonb->>'packSize', '')::double precision, pack_size),
            unit = COALESCE(data_json::jsonb->>'unit', unit),
            details = COALESCE(data_json::jsonb->>'details', details),
            usage = COALESCE(data_json::jsonb->>'usage', usage),
            image = COALESCE(data_json::jsonb->>'image', image),
            images = COALESCE(data_json::jsonb->'images', images),
            badge = COALESCE(data_json::jsonb->>'badge', badge),
            rating = COALESCE(data_json::jsonb->>'rating', rating),
            reviews = COALESCE(NULLIF(data_json::jsonb->>'reviews', '')::double precision, reviews)
        WHERE data_json IS NOT NULL AND name = ''
    `)
}

function connectSqlite() {
    if (state.sqlite?.open) return

    const databasePath = resolve(process.env.SQLITE_DB_PATH || 'data/agromart.sqlite')
    mkdirSync(dirname(databasePath), { recursive: true })
    state.sqlite = new Database(databasePath)
    state.sqlite.pragma('journal_mode = WAL')
    state.sqlite.pragma('foreign_keys = ON')
    state.sqlite.pragma('busy_timeout = 5000')
    state.sqlite.exec(
        userSchema('TEXT', 'BOOLEAN')
        + emailVerificationsSchema('TEXT')
        + productsSchema('TEXT', 'TEXT', "'[]'")
        + ordersSchema('TEXT', 'TEXT', "'[]'")
    )
    migrateSqliteUsers(state.sqlite)
    migrateSqliteProducts(state.sqlite)
}

export async function connectDatabase() {
    if (process.env.DATABASE_URL) {
        if (!state.pool) {
            state.pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                max: Number(process.env.PG_POOL_MAX) || 5,
                idleTimeoutMillis: 10000,
                connectionTimeoutMillis: 10000
            })
            state.pool.on('error', (error) => {
                console.error('Unexpected PostgreSQL pool error:', error)
            })
        }
        if (!state.initialization) {
            state.initialization = state.pool.query(
                userSchema('TIMESTAMPTZ', 'BOOLEAN')
                + emailVerificationsSchema('TIMESTAMPTZ')
                + productsSchema('TIMESTAMPTZ', 'JSONB', "'[]'::jsonb")
                + ordersSchema('TIMESTAMPTZ', 'JSONB', "'[]'::jsonb")
            )
                .then(() => migratePostgresUsers(state.pool))
                .then(() => migratePostgresProducts(state.pool))
                .catch((error) => {
                    state.initialization = null
                    throw error
                })
        }
        await state.initialization
        return
    }

    if (process.env.VERCEL) {
        throw new Error('DATABASE_URL is required when running on Vercel.')
    }

    connectSqlite()
}

export function getDatabaseType() {
    return process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite'
}

export function getSqliteDatabase() {
    if (process.env.DATABASE_URL) {
        throw new Error('Direct SQLite access is unavailable while DATABASE_URL is configured.')
    }
    if (!state.sqlite?.open) connectSqlite()
    return state.sqlite
}

export function getPostgresPool() {
    if (!process.env.DATABASE_URL || !state.pool) {
        throw new Error('PostgreSQL is not connected. Set DATABASE_URL and call connectDatabase() first.')
    }
    return state.pool
}

export async function query(sql, params = []) {
    if (process.env.DATABASE_URL) {
        if (!state.pool) throw new Error('Database is not connected. Call connectDatabase() first.')
        const result = await state.pool.query(sql, params)
        return { rows: result.rows, rowCount: result.rowCount }
    }

    const database = getSqliteDatabase()
    const sqliteParams = []
    const sqliteSql = sql.replace(/\$(\d+)(?:::\w+)?/g, (_placeholder, index) => {
        const value = params[Number(index) - 1]
        sqliteParams.push(typeof value === 'boolean' ? Number(value) : value)
        return '?'
    })
    const statement = database.prepare(sqliteSql)
    if (statement.reader) {
        const rows = statement.all(...sqliteParams)
        return { rows, rowCount: rows.length }
    }
    const result = statement.run(...sqliteParams)
    return { rows: [], rowCount: result.changes }
}

export async function isDatabaseConnected() {
    try {
        await query('SELECT 1')
        return true
    } catch (error) {
        console.error('Database health check failed:', error)
        return false
    }
}

export async function closeDatabase() {
    if (state.pool) {
        await state.pool.end()
        state.pool = null
        state.initialization = null
    }
    if (state.sqlite?.open) {
        state.sqlite.close()
        state.sqlite = null
    }
}
