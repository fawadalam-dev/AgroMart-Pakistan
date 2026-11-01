const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '')

export async function apiRequest(path, { token, ...options } = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers
        }
    })
    const result = response.status === 204 ? null : await response.json().catch(() => null)
    if (!response.ok) {
        throw new Error(result?.error || `Request failed with status ${response.status}.`)
    }
    return result
}

export function getApiToken() {
    return localStorage.getItem('agro_token') || ''
}

export function saveApiToken(token) {
    if (typeof token !== 'string' || !token) throw new TypeError('A valid API token is required.')
    localStorage.setItem('agro_token', token)
}

export function clearApiToken() {
    localStorage.removeItem('agro_token')
}

export async function fetchProducts({ all = false } = {}) {
    const query = all ? '?status=all' : ''
    const result = await apiRequest(`/products${query}`, all ? { token: getApiToken() } : {})
    return result.products
}

export async function createProduct(product) {
    const result = await apiRequest('/products', {
        method: 'POST',
        token: getApiToken(),
        body: JSON.stringify(product)
    })
    return result.product
}

export async function updateProduct(productId, product) {
    const result = await apiRequest(`/products/${encodeURIComponent(productId)}`, {
        method: 'PUT',
        token: getApiToken(),
        body: JSON.stringify(product)
    })
    return result.product
}

export async function setProductStatus(productId, status) {
    const result = await apiRequest(`/products/${encodeURIComponent(productId)}/status`, {
        method: 'PATCH',
        token: getApiToken(),
        body: JSON.stringify({ status })
    })
    return result.product
}

export async function deleteProduct(productId) {
    await apiRequest(`/products/${encodeURIComponent(productId)}`, {
        method: 'DELETE',
        token: getApiToken()
    })
}
