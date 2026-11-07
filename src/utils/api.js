const defaultApiUrl = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api'
const API_BASE_URL = (import.meta.env.VITE_API_URL || defaultApiUrl).replace(/\/$/, '')

export async function apiRequest(path, { token, ...options } = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        cache: 'no-store',
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

export async function fetchOrders() {
    const result = await apiRequest('/orders', { token: getApiToken() })
    return result.orders
}

export async function createOrder(order) {
    const result = await apiRequest('/orders', {
        method: 'POST',
        token: getApiToken(),
        body: JSON.stringify(order)
    })
    return result.order
}

export async function syncLocalOrders(orders) {
    const result = await apiRequest('/orders/sync', {
        method: 'POST',
        token: getApiToken(),
        body: JSON.stringify({ orders })
    })
    return result.orders
}

export async function cancelOrder(orderId) {
    const result = await apiRequest(`/orders/${encodeURIComponent(orderId)}/cancel`, {
        method: 'PATCH',
        token: getApiToken()
    })
    return result.order
}

export async function advanceOrder(orderId, status) {
    const result = await apiRequest(`/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PATCH',
        token: getApiToken(),
        body: JSON.stringify({ status })
    })
    return result.order
}

export async function fetchFarmWorkspace() {
    const result = await apiRequest('/farm-workspaces', { token: getApiToken() })
    return result.workspace
}

export async function saveFarmWorkspace(workspace) {
    const result = await apiRequest('/farm-workspaces', {
        method: 'PUT',
        token: getApiToken(),
        body: JSON.stringify({ workspace })
    })
    return result.workspace
}

export async function fetchAdminFarmWorkspaces() {
    const result = await apiRequest('/farm-workspaces/admin', { token: getApiToken() })
    return result.workspaces
}
