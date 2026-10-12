const configuredApi = import.meta.env.VITE_API_URL || ''
const API_BASE = configuredApi.startsWith('/')
    ? `${window.location.origin}${configuredApi}`
    : configuredApi && !configuredApi.includes('localhost')
        ? configuredApi
        : import.meta.env.DEV
            ? `${window.location.protocol}//${window.location.hostname}:4000/api`
            : `${window.location.origin}/api`
const browserStorage = window.localStorage
const cache = new Map()
let ready = false

function notify(key) {
    window.dispatchEvent(new StorageEvent('storage', { key }))
}

export async function hydrateCloudStorage() {
    for (let index = 0; index < browserStorage.length; index += 1) {
        const key = browserStorage.key(index)
        if (key && !cache.has(key)) cache.set(key, browserStorage.getItem(key))
    }
    try {
        const response = await fetch(`${API_BASE}/state`)
        if (response.ok) {
            const state = await response.json()
            Object.entries(state).forEach(([key, value]) => {
                const serialized = JSON.stringify(value)
                cache.set(key, serialized)
                try { browserStorage.setItem(key, serialized) } catch { }
            })
        }
    } catch (error) {
        console.error('MongoDB state could not be loaded:', error)
    }
    ready = true
}

const cloudStorage = {
    get length() { return cache.size },
    key(index) { return [...cache.keys()][index] || null },
    getItem(key) {
        const normalizedKey = String(key)
        if (cache.has(normalizedKey)) return cache.get(normalizedKey)
        const value = browserStorage.getItem(normalizedKey)
        if (value !== null) cache.set(normalizedKey, value)
        return value
    },
    setItem(key, value) {
        const normalizedKey = String(key)
        const normalizedValue = String(value)
        cache.set(normalizedKey, normalizedValue)
        let parsedValue = normalizedValue
        try { parsedValue = JSON.parse(normalizedValue) } catch { }
        try { browserStorage.setItem(normalizedKey, normalizedValue) } catch { }
        fetch(`${API_BASE}/state/${encodeURIComponent(normalizedKey)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: parsedValue })
        }).catch((error) => console.error('MongoDB state save failed:', error))
        notify(normalizedKey)
    },
    removeItem(key) {
        const normalizedKey = String(key)
        cache.delete(normalizedKey)
        browserStorage.removeItem(normalizedKey)
        fetch(`${API_BASE}/state/${encodeURIComponent(normalizedKey)}`, { method: 'DELETE' })
            .catch((error) => console.error('MongoDB state delete failed:', error))
        notify(normalizedKey)
    },
    clear() {
        for (const key of cache.keys()) this.removeItem(key)
    }
}

export function isCloudStorageReady() {
    return ready
}

export default cloudStorage
