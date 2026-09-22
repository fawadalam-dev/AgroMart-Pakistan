import { getSession } from './auth'

export function getProductReviews(productId) {
    try {
        const reviews = JSON.parse(localStorage.getItem('agro_reviews') || '{}')
        return Array.isArray(reviews[productId]) ? reviews[productId] : []
    } catch {
        return []
    }
}

export function addProductReview(productId, rating, text) {
    const session = getSession()
    if (!session || session.role !== 'customer') return false
    try {
        const reviews = JSON.parse(localStorage.getItem('agro_reviews') || '{}')
        const productReviews = Array.isArray(reviews[productId]) ? reviews[productId] : []
        reviews[productId] = [{ id: `${session.id}-${Date.now()}`, customerId: session.id, customerName: session.name, rating: Number(rating), text: text.trim(), date: new Date().toLocaleDateString() }, ...productReviews]
        localStorage.setItem('agro_reviews', JSON.stringify(reviews))
        window.dispatchEvent(new Event('agro-reviews-updated'))
        return true
    } catch {
        return false
    }
}
