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

function databaseSchema() {
    return `
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
            created_at TIMESTAMPTZ NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL
        );

        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
            data_json TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL
        );

        CREATE INDEX IF NOT EXISTS products_status_created_at
            ON products (status, created_at DESC);
    `
}

function connectSqlite() {
    if (state.sqlite?.open) return

    const databasePath = resolve(process.env.SQLITE_DB_PATH || 'data/agromart.sqlite')
    mkdirSync(dirname(databasePath), { recursive: true })
    state.sqlite = new Database(databasePath)
    state.sqlite.pragma('journal_mode = WAL')
    state.sqlite.pragma('foreign_keys = ON')
    state.sqlite.pragma('busy_timeout = 5000')
    state.sqlite.exec(databaseSchema()
        .replaceAll('TIMESTAMPTZ', 'TEXT'))
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
            state.initialization = state.pool.query(databaseSchema())
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
    const statement = database.prepare(sql.replace(/\$\d+/g, '?'))
    if (statement.reader) {
        const rows = statement.all(...params)
        return { rows, rowCount: rows.length }
    }
    const result = statement.run(...params)
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
