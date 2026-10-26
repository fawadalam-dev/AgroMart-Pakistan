import bcrypt from 'bcryptjs'
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { getUsers, saveUsers } from './auth'

const BACKUP_FILENAME = 'agromart-backup.json'
const BACKUP_FORMAT = 'agromart-browser-backup'
const MAX_ARCHIVE_SIZE = 50 * 1024 * 1024

async function removePlaintextPasswords(users) {
    if (!Array.isArray(users)) throw new Error('The backup user data is invalid.')
    return Promise.all(users.map(async (user) => {
        const { password, ...safeUser } = user
        if (!safeUser.passwordHash && typeof password === 'string') {
            safeUser.passwordHash = await bcrypt.hash(password, 12)
        }
        return safeUser
    }))
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function downloadDataBackup() {
    const storage = {}
    for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index)
        if (key?.startsWith('agro_')) storage[key] = localStorage.getItem(key)
    }

    storage.agro_users = JSON.stringify(await removePlaintextPasswords(getUsers()))
    const backup = {
        format: BACKUP_FORMAT,
        version: 1,
        exportedAt: new Date().toISOString(),
        storage
    }
    const archive = zipSync({ [BACKUP_FILENAME]: strToU8(JSON.stringify(backup)) }, { level: 6 })
    downloadBlob(new Blob([archive], { type: 'application/zip' }), `agromart-backup-${new Date().toISOString().slice(0, 10)}.zip`)
}

function parseJson(contents, filename) {
    try {
        return JSON.parse(strFromU8(contents))
    } catch {
        throw new Error(`Could not read ${filename} from this ZIP backup.`)
    }
}

async function importLegacyDatabase(data) {
    const storage = {}
    storage.agro_users = JSON.stringify(await removePlaintextPasswords(data.users || []))
    storage.agro_products = JSON.stringify(data.products || [])
    storage.agro_orders = JSON.stringify(data.orders || [])
    for (const [key, value] of Object.entries(data.app_state || {})) {
        if (key.startsWith('agro_')) storage[key] = JSON.stringify(value)
    }
    return storage
}

export async function restoreDataBackup(file) {
    if (!file || file.size > MAX_ARCHIVE_SIZE) {
        throw new Error('Choose a ZIP backup smaller than 50 MB.')
    }

    let files
    try {
        files = unzipSync(new Uint8Array(await file.arrayBuffer()))
    } catch {
        throw new Error('This file is not a valid AgroMart ZIP backup.')
    }

    let storage
    if (files[BACKUP_FILENAME]) {
        const backup = parseJson(files[BACKUP_FILENAME], BACKUP_FILENAME)
        if (backup.format !== BACKUP_FORMAT || backup.version !== 1 || !backup.storage || typeof backup.storage !== 'object') {
            throw new Error('This AgroMart backup format is not supported.')
        }
        storage = { ...backup.storage }
        if (storage.agro_users) {
            const users = JSON.parse(storage.agro_users)
            storage.agro_users = JSON.stringify(await removePlaintextPasswords(users))
        }
    } else if (files['server/data.json']) {
        storage = await importLegacyDatabase(parseJson(files['server/data.json'], 'server/data.json'))
    } else {
        throw new Error('No AgroMart backup data was found in this ZIP file.')
    }

    const safeEntries = Object.entries(storage).filter(([key, value]) =>
        key.startsWith('agro_') && typeof value === 'string'
    )
    if (!safeEntries.length) throw new Error('The ZIP backup contains no AgroMart data.')

    safeEntries.forEach(([key, value]) => localStorage.setItem(key, value))
    window.location.reload()
}
