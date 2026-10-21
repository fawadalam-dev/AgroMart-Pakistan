import dotenv from 'dotenv'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

dotenv.config()

const dataPath = join(dirname(fileURLToPath(import.meta.url)), 'data.json')
const emptyData = () => ({ users: [], products: [], orders: [], app_state: {} })
let database
let data

function readData() {
    if (data) return data
    if (!existsSync(dataPath)) {
        data = emptyData()
        writeFileSync(dataPath, JSON.stringify(data, null, 2))
        return data
    }

    const parsedData = JSON.parse(readFileSync(dataPath, 'utf8'))
    data = {
        ...emptyData(),
        ...parsedData,
        app_state: parsedData.app_state || {}
    }
    return data
}

function writeData(nextData) {
    writeFileSync(dataPath, JSON.stringify(nextData, null, 2))
    data = nextData
}

function fileCollection(name) {
    const getItems = () => {
        const currentData = readData()
        return name === 'app_state'
            ? Object.entries(currentData.app_state).map(([key, value]) => ({ key, value }))
            : currentData[name]
    }
    const saveItems = (items) => {
        const currentData = readData()
        const nextData = {
            ...currentData,
            [name]: name === 'app_state'
                ? Object.fromEntries(items.map((item) => [item.key, item.value]))
                : items
        }
        writeData(nextData)
    }
    const matches = (item, filter) => Object.entries(filter).every(([key, value]) =>
        value !== undefined && item[key] === value
    )

    return {
        async createIndex() {},
        async findOne(filter) {
            return getItems().find((item) => matches(item, filter)) || null
        },
        find(filter = {}) {
            const items = getItems().filter((item) => matches(item, filter))
            const cursor = { sort: () => cursor, toArray: async () => items }
            return cursor
        },
        async countDocuments(filter = {}) {
            return getItems().filter((item) => matches(item, filter)).length
        },
        async insertOne(item) {
            const items = getItems()
            items.push({ ...item })
            saveItems(items)
            return { insertedId: item.id }
        },
        async insertMany(items) {
            saveItems([...getItems(), ...items.map((item) => ({ ...item }))])
        },
        async updateOne(filter, update, options = {}) {
            const items = getItems()
            const index = items.findIndex((item) => matches(item, filter))
            const replacement = {
                ...(index >= 0 ? items[index] : {}),
                ...(update.$set || {})
            }
            if (index >= 0) items[index] = replacement
            else if (options.upsert) items.push(replacement)
            saveItems(items)
            return { matchedCount: index >= 0 ? 1 : 0 }
        },
        async findOneAndUpdate(filter, update) {
            const items = getItems()
            const index = items.findIndex((item) => matches(item, filter))
            if (index < 0) return null
            items[index] = { ...items[index], ...(update.$set || {}) }
            saveItems(items)
            return items[index]
        },
        async deleteOne(filter) {
            const items = getItems()
            const remaining = items.filter((item) => !matches(item, filter))
            saveItems(remaining)
            return { deletedCount: items.length - remaining.length }
        }
    }
}

export async function connectDatabase() {
    if (database) return database

    const currentData = readData()
    if (!currentData.users.some((user) => user.role === 'admin')) {
        currentData.users.unshift({
            id: 'admin-1',
            name: process.env.ADMIN_NAME || 'Fawad Alam',
            email: process.env.ADMIN_EMAIL || 'fawadalam5813@gmail.com',
            passwordHash: '$2a$12$iTDLAQ5nnZe36ZCKSubMX.8.273OFxovYmg6U6SImc4Q5jwQCWm6',
            role: 'admin',
            status: 'approved'
        })
        writeData(currentData)
    }

    database = { collection: fileCollection }
    console.log(`Using local JSON datastore: ${dataPath}`)
    return database
}

export async function closeDatabase() {
    database = undefined
    data = undefined
}
