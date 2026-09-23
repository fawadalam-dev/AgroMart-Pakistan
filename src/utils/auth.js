const USERS_KEY = 'agro_users'
const SESSION_KEY = 'agro_session'
const ADMIN_EMAIL = 'fawadalam5813@gmail.com'
const ADMIN_PASSWORD = 'fawadalam58'
const configuredApi = import.meta.env.VITE_API_URL || ''
const API_BASE = configuredApi.startsWith('/')
    ? `${window.location.origin}${configuredApi}`
    : configuredApi && !configuredApi.includes('localhost')
        ? configuredApi
        : `${window.location.protocol}//${window.location.hostname}:4000/api`

export function getOAuthUrl(provider) {
    return `${API_BASE}/auth/${provider}`
}

async function requestAuth(path, body) {
    const response = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(payload.error || 'Authentication request failed.')
    return payload
}

export function loginWithApi(email, password) {
    return requestAuth('/auth/login', { email, password })
}

export function registerWithApi(name, email, password, phone) {
    return requestAuth('/auth/register', { name, email, password, phone })
}

export function resetPasswordWithApi(email, password) {
    return requestAuth('/auth/reset-password', { email, password })
}

export function getUsers() {
    try {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
        return Array.isArray(users) ? users : []
    } catch {
        return []
    }
}

export function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
    window.dispatchEvent(new Event('agro-users-updated'))
}

export function getSession() {
    try {
        return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
    } catch {
        return null
    }
}

export function setSession(user, token = '') {
    const session = { id: user.id, name: user.name, email: user.email, role: user.role, shopName: user.shopName || '' }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    if (token) localStorage.setItem('agro_token', token)
    window.dispatchEvent(new Event('agro-session-updated'))
    return session
}

export function clearSession() {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem('agro_token')
    window.dispatchEvent(new Event('agro-session-updated'))
}

export function ensureAdmin() {
    const users = getUsers()
    const admin = { id: 'admin-1', name: 'Super Admin', email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin', status: 'approved' }
    const hasAdmin = users.some((user) => user.role === 'admin')
    const updatedUsers = hasAdmin
        ? users.map((user) => user.role === 'admin' ? { ...user, ...admin } : user)
        : [admin, ...users]
    if (!hasAdmin || JSON.stringify(updatedUsers) !== JSON.stringify(users)) saveUsers(updatedUsers)
    const session = getSession()
    if (session?.role === 'admin' && session.email !== ADMIN_EMAIL) clearSession()
}