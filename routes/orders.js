import { Router } from 'express'
import Order from '../models/Order.js'
import { authenticate, requireAdmin } from '../middleware/authenticate.js'
import requireDatabase from '../middleware/requireDatabase.js'

const router = Router()
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

router.use(requireDatabase, authenticate)

function normalizeOrder(body, user, { allowHistoricalTotal = false } = {}) {
    const customer = body?.customer
    const customerFields = ['name', 'email', 'phone', 'address', 'city', 'province']
    if (!customer || customerFields.some((field) => typeof customer[field] !== 'string' || !customer[field].trim())) {
        return { error: 'Complete the customer name, email, phone, address, city, and province.' }
    }
    if (!emailPattern.test(customer.email.trim())) return { error: 'Enter a valid customer email address.' }
    if (customerFields.some((field) => customer[field].length > (field === 'address' ? 1000 : 254))) {
        return { error: 'One or more customer fields are too long.' }
    }
    if (!body.items || typeof body.items !== 'object' || Array.isArray(body.items)) {
        return { error: 'Order items are invalid.' }
    }

    const itemEntries = Object.entries(body.items)
    if (!itemEntries.length || itemEntries.length > 100) return { error: 'An order must contain between 1 and 100 products.' }
    const itemDetails = Array.isArray(body.itemDetails) ? body.itemDetails : []
    const detailById = new Map(itemDetails.map((item) => [String(item.productId), item]))
    const normalizedItems = {}
    const normalizedDetails = []

    for (const [productId, rawQuantity] of itemEntries) {
        const quantity = Number(rawQuantity)
        const item = detailById.get(productId)
        if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10000) {
            return { error: 'Product quantities must be positive whole numbers.' }
        }
        if (!item || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 160) {
            return { error: 'Order product details are missing or invalid.' }
        }
        const price = Number(item.price)
        if (!Number.isFinite(price) || price < 0 || price > 100000000) {
            return { error: 'Product prices must be valid non-negative amounts.' }
        }
        const packSize = item.packSize === undefined ? 0 : Number(item.packSize)
        if (!Number.isFinite(packSize) || packSize < 0) {
            return { error: 'Product pack sizes must be valid non-negative amounts.' }
        }
        if (item.unit !== undefined && (typeof item.unit !== 'string' || item.unit.length > 30)) {
            return { error: 'Product pack size units are invalid.' }
        }
        const image = typeof item.image === 'string' ? item.image : ''
        if (image.length > 12000000) return { error: 'Product image data is too large.' }
        normalizedItems[productId] = quantity
        normalizedDetails.push({
            productId,
            name: item.name.trim(),
            price,
            quantity,
            image,
            packSize,
            unit: item.unit?.trim() || ''
        })
    }

    if (normalizedDetails.length !== itemDetails.length) {
        return { error: 'Order product details do not match the cart.' }
    }
    const subtotal = normalizedDetails.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const expectedTotal = subtotal + (subtotal >= 10000 ? 0 : 200) + 50
    const total = Number(body.total)
    if (!Number.isFinite(total) || total < 0 || total > 10000000000) {
        return { error: 'Order total is invalid.' }
    }
    if (!allowHistoricalTotal && Math.abs(total - expectedTotal) > 0.01) {
        return { error: 'Order total does not match the cart and delivery fees.' }
    }
    const clientOrderId = typeof body.clientOrderId === 'string' && body.clientOrderId.length <= 100
        ? body.clientOrderId.trim()
        : ''
    if (!clientOrderId) return { error: 'Order reference is missing.' }

    return {
        order: {
            user,
            clientOrderId,
            customer: {
                name: customer.name.trim(),
                email: customer.email.trim().toLowerCase(),
                phone: customer.phone.trim(),
                address: customer.address.trim(),
                city: customer.city.trim(),
                province: customer.province.trim(),
                postalCode: typeof customer.postalCode === 'string' ? customer.postalCode.trim() : ''
            },
            items: normalizedItems,
            itemDetails: normalizedDetails,
            total: allowHistoricalTotal ? total : expectedTotal
        }
    }
}

router.get('/', async (request, response, next) => {
    try {
        const orders = await Order.findForUser(request.user)
        return response.json({ orders })
    } catch (error) {
        return next(error)
    }
})

router.post('/', async (request, response, next) => {
    try {
        if (request.user.role === 'admin') {
            return response.status(403).json({ error: 'Customer accounts are required to place orders.' })
        }
        const { order, error } = normalizeOrder(request.body || {}, request.user)
        if (error) return response.status(400).json({ error })
        const savedOrder = await Order.create(order)
        return response.status(201).json({ order: savedOrder })
    } catch (error) {
        return next(error)
    }
})

router.post('/sync', async (request, response, next) => {
    try {
        if (request.user.role === 'admin') {
            return response.status(403).json({ error: 'Customer accounts are required to sync customer orders.' })
        }
        const legacyOrders = request.body?.orders
        if (!Array.isArray(legacyOrders) || legacyOrders.length > 25) {
            return response.status(400).json({ error: 'Provide up to 25 saved orders to sync.' })
        }

        const syncedOrders = []
        for (const legacyOrder of legacyOrders) {
            const belongsToUser = legacyOrder.ownerId === request.user.id
                || String(legacyOrder.ownerEmail || legacyOrder.customer?.email || '').toLowerCase() === request.user.email.toLowerCase()
            if (!belongsToUser) continue
            const { order, error } = normalizeOrder({
                ...legacyOrder,
                clientOrderId: legacyOrder.clientOrderId || legacyOrder.id
            }, request.user, { allowHistoricalTotal: true })
            if (error) return response.status(400).json({ error: `Could not sync order ${legacyOrder.id || ''}: ${error}` })
            syncedOrders.push(await Order.create(order))
        }
        return response.json({ orders: syncedOrders })
    } catch (error) {
        return next(error)
    }
})

router.patch('/:id/cancel', async (request, response, next) => {
    try {
        if (request.user.role === 'admin') {
            return response.status(403).json({ error: 'Customer accounts are required to cancel orders.' })
        }
        const order = await Order.cancelForUser(request.params.id, request.user)
        if (!order) return response.status(409).json({ error: 'This order can no longer be cancelled.' })
        return response.json({ order })
    } catch (error) {
        return next(error)
    }
})

router.patch('/:id/status', requireAdmin, async (request, response, next) => {
    try {
        const { status } = request.body || {}
        if (!['Shipped', 'Delivered'].includes(status)) {
            return response.status(400).json({ error: 'Order status must be Shipped or Delivered.' })
        }
        const order = await Order.updateStatus(request.params.id, status)
        if (!order) return response.status(409).json({ error: 'Order was not found or cannot be advanced from its current status.' })
        return response.json({ order })
    } catch (error) {
        return next(error)
    }
})

export default router
