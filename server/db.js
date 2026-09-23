import dotenv from 'dotenv'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

dotenv.config()

const fallbackPath = join(dirname(fileURLToPath(import.meta.url)), 'data.json')
let fallbackDatabase
let fallbackData

function readFallback() {
    if (fallbackData) return fallbackData
    try { return JSON.parse(readFileSync(fallbackPath, 'utf8')) } catch { return { users: [], products: [], orders: [], app_state: {} } }
}

function writeFallback(data) {
    fallbackData = data
    try { writeFileSync(fallbackPath, JSON.stringify(data, null, 2)) } catch { }
}

function fallbackCollection(name) {
    const getItems = () => {
        const data = readFallback()
        return name === 'app_state' ? Object.entries(data.app_state || {}).map(([key, value]) => ({ key, value })) : data[name] || []
    }
    const saveItems = (items) => {
        const data = readFallback()
        data[name] = name === 'app_state' ? Object.fromEntries(items.map((item) => [item.key, item.value])) : items
        writeFallback(data)
    }
    const matches = (item, filter) => Object.entries(filter).every(([key, value]) => item[key] === value)
    return {
        async createIndex() {},
        async findOne(filter) { return getItems().find((item) => matches(item, filter)) || null },
        find(filter = {}) {
            const items = getItems().filter((item) => matches(item, filter))
            const cursor = { sort: () => cursor, toArray: async () => items }
            return cursor
        },
        async countDocuments() { return getItems().length },
        async insertOne(item) { const items = getItems(); items.push({ ...item }); saveItems(items); return { insertedId: item.id } },
        async insertMany(items) { saveItems([...getItems(), ...items.map((item) => ({ ...item }))]) },
        async updateOne(filter, update, options = {}) { const items = getItems(); const index = items.findIndex((item) => matches(item, filter)); const replacement = { ...(index >= 0 ? items[index] : {}), ...(update.$set || {}) }; if (index >= 0) items[index] = replacement; else if (options.upsert) items.push(replacement); saveItems(items); return { matchedCount: index >= 0 ? 1 : 0 } },
        async findOneAndUpdate(filter, update) { const items = getItems(); const index = items.findIndex((item) => matches(item, filter)); if (index < 0) return null; items[index] = { ...items[index], ...(update.$set || {}) }; saveItems(items); return items[index] },
        async deleteOne(filter) { const items = getItems(); const remaining = items.filter((item) => !matches(item, filter)); saveItems(remaining); return { deletedCount: items.length - remaining.length } }
    }
}

export async function connectDatabase() {
    if (fallbackDatabase) return fallbackDatabase
    fallbackData = readFallback()
    if (!fallbackData.users.some((user) => user.role === 'admin')) fallbackData.users.unshift({ id: 'admin-1', name: process.env.ADMIN_NAME || 'Fawad Alam', email: process.env.ADMIN_EMAIL || 'fawadalam5813@gmail.com', passwordHash: '$2a$12$iTDLAQ5nnZe36ZCKSubMX.8.273OFxovYmg6U6SImc4Q5jwQCWm6', role: 'admin', status: 'approved' })
    fallbackDatabase = { collection: fallbackCollection }
    console.warn('MongoDB disconnected; using server/data.json storage.')
    return fallbackDatabase
}

export async function closeDatabase() {
    fallbackDatabase = undefined
}
