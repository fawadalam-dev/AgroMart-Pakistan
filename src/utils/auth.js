const USERS_KEY = 'agro_users'
const SESSION_KEY = 'agro_session'
const ADMIN_EMAIL = 'fawadalam5813@gmail.com'
const ADMIN_PASSWORD = 'fawadalam58'

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

export function setSession(user) {
    const session = { id: user.id, name: user.name, email: user.email, role: user.role, shopName: user.shopName || '' }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return session
}

export function clearSession() {
    localStorage.removeItem(SESSION_KEY)
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