const configuredApi = import.meta.env.VITE_API_URL || ''
const API_BASE = configuredApi.startsWith('/')
    ? `${window.location.origin}${configuredApi}`
    : configuredApi && !configuredApi.includes('localhost')
        ? configuredApi
        : import.meta.env.DEV
            ? `${window.location.protocol}//${window.location.hostname}:4000/api`
            : `${window.location.origin}/api`
const cache = new Map()
let ready = false

function notify(key) {
    window.dispatchEvent(new StorageEvent('storage', { key }))
}

export async function hydrateCloudStorage() {
    try {
        const response = await fetch(`${API_BASE}/state`)
        if (response.ok) {
            const state = await response.json()
            Object.entries(state).forEach(([key, value]) => cache.set(key, JSON.stringify(value)))
        }
    } catch (error) {
        console.error('MongoDB state could not be loaded:', error)
    }
    ready = true
}

const cloudStorage = {
    get length() { return cache.size },
    key(index) { return [...cache.keys()][index] || null },
    getItem(key) { return cache.has(String(key)) ? cache.get(String(key)) : null },
    setItem(key, value) {
        const normalizedKey = String(key)
        const normalizedValue = String(value)
        cache.set(normalizedKey, normalizedValue)
        let parsedValue = normalizedValue
        try { parsedValue = JSON.parse(normalizedValue) } catch { }
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
