import bcrypt from 'bcryptjs'

const USERS_KEY = 'agro_users'
const SESSION_KEY = 'agro_session'
const DATA_CLEANUP_KEY = 'agro_admin_data_cleanup_v1'
const UNIFIED_ACCOUNTS_KEY = 'agro_unified_accounts_v1'
const USER_DATA_KEY_PREFIXES = [
    'agro_account_',
    'agro_customer_',
    'agro_farmer_',
    'agro_farm_management_',
    'agro_farm_theme_',
    'agro_settings_'
]

export function getUsers() {
    try {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
        return Array.isArray(users) ? users : []
    } catch {
        return []
    }
}

export function saveUsers(users) {
    if (!Array.isArray(users)) throw new TypeError('Users must be saved as an array.')
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
    window.dispatchEvent(new Event('agro-users-updated'))
}

export function isUserAccount(role) {
    return role === 'user' || role === 'customer' || role === 'farmer'
}

function createId(role) {
    const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
    return `${role}-${id}`
}

export async function loginLocally(email, password) {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const users = getUsers()
    const user = users.find((item) => item.email?.toLowerCase() === normalizedEmail)
    if (!user) throw new Error('Email or password is incorrect.')

    let passwordMatches = false
    if (user.passwordHash) {
        passwordMatches = await bcrypt.compare(String(password || ''), user.passwordHash)
    } else if (user.password) {
        passwordMatches = user.password === String(password || '')
        if (passwordMatches) {
            const passwordHash = await bcrypt.hash(String(password), 12)
            saveUsers(users.map((item) => {
                if (item.id !== user.id) return item
                const { password: _legacyPassword, ...safeUser } = item
                return { ...safeUser, passwordHash }
            }))
            Object.assign(user, { passwordHash })
            delete user.password
        }
    }
    if (!passwordMatches) throw new Error('Email or password is incorrect.')
    return user
}

export async function registerLocally(name, email, password, phone, role = 'user', farmerProfile = null) {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (getUsers().some((user) => user.email?.toLowerCase() === normalizedEmail)) {
        throw new Error('This email is already registered.')
    }
    if (!isUserAccount(role)) throw new Error('Choose a valid account type.')
    if (!name || !normalizedEmail || !password || String(password).length < 6) {
        throw new Error('Name, email, and a password of at least 6 characters are required.')
    }
    if (role === 'farmer' && farmerProfile) {
        const area = Number(farmerProfile?.farmArea)
        if (!farmerProfile?.farmName?.trim() || !farmerProfile?.province || !farmerProfile?.city || !farmerProfile?.primaryCrop?.trim() || !Number.isFinite(area) || area <= 0) {
            throw new Error('Complete the farm name, location, farm area, and primary crop before registering.')
        }
    }

    const id = createId('user')
    const user = {
        id,
        name: String(name).trim(),
        email: normalizedEmail,
        phone: String(phone || '').trim(),
        passwordHash: await bcrypt.hash(String(password), 12),
        role: 'user',
        status: 'approved',
        createdAt: new Date().toISOString()
    }
    saveUsers([...getUsers(), user])

    if (farmerProfile) {
        localStorage.setItem(`agro_farmer_${id}`, JSON.stringify({ ...farmerProfile, farmArea: String(farmerProfile.farmArea) }))
        localStorage.setItem(`agro_account_${id}`, JSON.stringify({
            name: user.name,
            email: user.email,
            phone: user.phone,
            city: farmerProfile.city,
            province: farmerProfile.province
        }))
    }
    return user
}

export async function resetPasswordLocally(email, password) {
    if (String(password || '').length < 6) throw new Error('Password must be at least 6 characters.')
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const users = getUsers()
    const user = users.find((item) => item.email?.toLowerCase() === normalizedEmail)
    if (!user) throw new Error('No account was found with this email address.')
    const passwordHash = await bcrypt.hash(String(password), 12)
    saveUsers(users.map((item) => item.id === user.id ? { ...item, passwordHash, password: undefined } : item))
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
    localStorage.removeItem('agro_token')
    window.dispatchEvent(new Event('agro-session-updated'))
    return session
}

export function clearSession() {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem('agro_token')
    window.dispatchEvent(new Event('agro-session-updated'))
}

export function removeNonAdminData() {
    if (localStorage.getItem(DATA_CLEANUP_KEY) === 'done') return

    const admins = getUsers().filter((user) => user.role === 'admin')
    const adminIds = new Set(admins.map((user) => String(user.id)))
    saveUsers(admins)

    const keysToRemove = []
    for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index)
        if (!key) continue

        if (['agro_orders', 'agro_cart', 'agro_favorites', 'agro_reviews', 'agro_token'].includes(key)) {
            keysToRemove.push(key)
            continue
        }

        const prefix = USER_DATA_KEY_PREFIXES.find((item) => key.startsWith(item))
        if (prefix && !adminIds.has(key.slice(prefix.length))) keysToRemove.push(key)
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key))

    const session = getSession()
    if (session?.role !== 'admin' || (adminIds.size > 0 && !adminIds.has(String(session.id)))) {
        clearSession()
    }

    localStorage.setItem(DATA_CLEANUP_KEY, 'done')
}

export function migrateUnifiedAccounts() {
    if (localStorage.getItem(UNIFIED_ACCOUNTS_KEY) === 'done') return

    const users = getUsers()
    const migratedUsers = users.map((user) =>
        isUserAccount(user.role) && user.role !== 'user' ? { ...user, role: 'user' } : user
    )
    if (migratedUsers.some((user, index) => user !== users[index])) saveUsers(migratedUsers)

    const session = getSession()
    if (session && isUserAccount(session.role) && session.role !== 'user') {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, role: 'user' }))
        window.dispatchEvent(new Event('agro-session-updated'))
    }

    localStorage.setItem(UNIFIED_ACCOUNTS_KEY, 'done')
}