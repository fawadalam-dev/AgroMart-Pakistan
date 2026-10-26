import { getSession, isUserAccount } from './auth'

function readFavorites() {
    try {
        const value = JSON.parse(localStorage.getItem('agro_favorites') || '{}')
        return value && typeof value === 'object' ? value : {}
    } catch {
        return {}
    }
}

export function getFavorites() {
    const session = getSession()
    return isUserAccount(session?.role) ? readFavorites()[session.id] || [] : []
}

export function isFavorite(productId) {
    return getFavorites().includes(productId)
}

export function toggleFavorite(productId) {
    const session = getSession()
    if (!session || !isUserAccount(session.role)) return false
    const allFavorites = readFavorites()
    const favorites = new Set(allFavorites[session.id] || [])
    if (favorites.has(productId)) favorites.delete(productId)
    else favorites.add(productId)
    allFavorites[session.id] = [...favorites]
    localStorage.setItem('agro_favorites', JSON.stringify(allFavorites))
    window.dispatchEvent(new Event('agro-favorites-updated'))
    return favorites.has(productId)
}
